// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title  IdentityRegistry — SovereignGraph Anchors & Revocations
/// @author SovereignGraph Protocol
/// @notice An append-only registry for credential commitment hashes used by
///         off-chain Zero-Knowledge Proof verifiers. Users own their identity
///         anchors and may revoke them at any time. The contract never stores
///         personal data — only Pedersen / SHA-256 commitment hashes derived
///         from data that lives in the user's local vault.
/// @dev    All state-changing functions emit events to enable lightweight
///         off-chain indexing of the social/identity graph.
contract IdentityRegistry {
    /* ---------------------------------------------------------------- */
    /* Types                                                            */
    /* ---------------------------------------------------------------- */

    enum ClaimType {
        AgeOver, // 0
        BalanceOver, // 1
        Credential, // 2
        Membership, // 3
        Education // 4
    }

    struct Anchor {
        bytes32 commitment; // hash committed by the owner
        ClaimType claimType; // category of the underlying claim
        address owner; // the sovereign owner
        uint64 anchoredAt; // block timestamp when anchored
        bool revoked; // user-revocable
        string issuer; // human-readable issuer label
    }

    /* ---------------------------------------------------------------- */
    /* Storage                                                          */
    /* ---------------------------------------------------------------- */

    /// @notice anchors keyed by commitment hash.
    mapping(bytes32 => Anchor) private _anchors;

    /// @notice list of commitments per owner (for off-chain enumeration).
    mapping(address => bytes32[]) private _ownerAnchors;

    /// @notice nullifier set to prevent proof replay across verifiers.
    mapping(bytes32 => bool) public spentNullifiers;

    /// @notice trusted relationship edges in the decentralized social graph,
    ///         where each edge is the keccak256 of (from, to). Stored as a
    ///         mapping for O(1) existence checks.
    mapping(bytes32 => bool) public socialEdges;

    /* ---------------------------------------------------------------- */
    /* Events                                                           */
    /* ---------------------------------------------------------------- */

    event CredentialAnchored(
        address indexed owner,
        bytes32 indexed commitment,
        ClaimType claimType,
        string issuer,
        uint64 anchoredAt
    );

    event CredentialRevoked(
        address indexed owner,
        bytes32 indexed commitment,
        uint64 revokedAt
    );

    event NullifierSpent(
        address indexed verifier,
        bytes32 indexed nullifier,
        bytes32 indexed commitment,
        uint64 spentAt
    );

    event SocialEdgeAdded(
        address indexed from,
        address indexed to,
        bytes32 indexed edge,
        uint64 addedAt
    );

    event SocialEdgeRemoved(
        address indexed from,
        address indexed to,
        bytes32 indexed edge,
        uint64 removedAt
    );

    /* ---------------------------------------------------------------- */
    /* Errors                                                           */
    /* ---------------------------------------------------------------- */

    error EmptyCommitment();
    error AnchorAlreadyExists();
    error AnchorNotFound();
    error NotAnchorOwner();
    error AlreadyRevoked();
    error NullifierAlreadySpent();
    error SelfEdgeForbidden();
    error EdgeAlreadyExists();
    error EdgeNotFound();

    /* ---------------------------------------------------------------- */
    /* Modifiers                                                        */
    /* ---------------------------------------------------------------- */

    modifier onlyAnchorOwner(bytes32 commitment) {
        Anchor storage a = _anchors[commitment];
        if (a.owner == address(0)) revert AnchorNotFound();
        if (a.owner != msg.sender) revert NotAnchorOwner();
        _;
    }

    /* ---------------------------------------------------------------- */
    /* Anchors                                                          */
    /* ---------------------------------------------------------------- */

    /// @notice Anchors a new credential commitment for the caller.
    /// @param  commitment The off-chain hash of the credential's private data.
    /// @param  claimType  Category of the underlying claim.
    /// @param  issuer     Human-readable issuer label (e.g. "State of CA").
    function anchorCredential(
        bytes32 commitment,
        ClaimType claimType,
        string calldata issuer
    ) external {
        if (commitment == bytes32(0)) revert EmptyCommitment();
        if (_anchors[commitment].owner != address(0)) revert AnchorAlreadyExists();

        _anchors[commitment] = Anchor({
            commitment: commitment,
            claimType: claimType,
            owner: msg.sender,
            anchoredAt: uint64(block.timestamp),
            revoked: false,
            issuer: issuer
        });
        _ownerAnchors[msg.sender].push(commitment);

        emit CredentialAnchored(
            msg.sender,
            commitment,
            claimType,
            issuer,
            uint64(block.timestamp)
        );
    }

    /// @notice Marks an existing anchor as revoked. Only the owner may revoke.
    function revokeCredential(bytes32 commitment)
        external
        onlyAnchorOwner(commitment)
    {
        Anchor storage a = _anchors[commitment];
        if (a.revoked) revert AlreadyRevoked();
        a.revoked = true;
        emit CredentialRevoked(msg.sender, commitment, uint64(block.timestamp));
    }

    /// @notice Returns the full anchor record.
    function getAnchor(bytes32 commitment) external view returns (Anchor memory) {
        Anchor memory a = _anchors[commitment];
        if (a.owner == address(0)) revert AnchorNotFound();
        return a;
    }

    /// @notice Whether a commitment is currently valid (anchored & not revoked).
    function isValidAnchor(bytes32 commitment) external view returns (bool) {
        Anchor storage a = _anchors[commitment];
        return a.owner != address(0) && !a.revoked;
    }

    /// @notice Returns all commitments owned by `who` for off-chain indexing.
    function anchorsOf(address who) external view returns (bytes32[] memory) {
        return _ownerAnchors[who];
    }

    /* ---------------------------------------------------------------- */
    /* Nullifiers                                                       */
    /* ---------------------------------------------------------------- */

    /// @notice Marks a nullifier as spent to prevent replay of the same proof.
    /// @dev    In production, callable by an authorized verifier or directly
    ///         by users committing the result of an off-chain ZK verification.
    function spendNullifier(bytes32 nullifier, bytes32 commitment) external {
        if (spentNullifiers[nullifier]) revert NullifierAlreadySpent();
        spentNullifiers[nullifier] = true;
        emit NullifierSpent(
            msg.sender,
            nullifier,
            commitment,
            uint64(block.timestamp)
        );
    }

    /* ---------------------------------------------------------------- */
    /* Social Graph                                                     */
    /* ---------------------------------------------------------------- */

    /// @dev Deterministic edge id derived from an ordered (from, to) pair.
    function _edgeId(address from, address to) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(from, to));
    }

    /// @notice Adds a directed social edge from msg.sender to `peer`.
    /// @dev    Edges are public booleans on-chain, but the rich relationship
    ///         metadata (labels, weights, etc.) lives in encrypted off-chain
    ///         storage referenced by the user's vault.
    function addSocialEdge(address peer) external {
        if (peer == msg.sender) revert SelfEdgeForbidden();
        bytes32 edge = _edgeId(msg.sender, peer);
        if (socialEdges[edge]) revert EdgeAlreadyExists();
        socialEdges[edge] = true;
        emit SocialEdgeAdded(msg.sender, peer, edge, uint64(block.timestamp));
    }

    /// @notice Removes a previously added social edge owned by msg.sender.
    function removeSocialEdge(address peer) external {
        bytes32 edge = _edgeId(msg.sender, peer);
        if (!socialEdges[edge]) revert EdgeNotFound();
        socialEdges[edge] = false;
        emit SocialEdgeRemoved(msg.sender, peer, edge, uint64(block.timestamp));
    }

    /// @notice Whether a directed edge exists from `from` to `to`.
    function hasSocialEdge(address from, address to) external view returns (bool) {
        return socialEdges[_edgeId(from, to)];
    }
}
