/**
 * SovereignGraph — Zero-Knowledge Proof Utilities
 * ------------------------------------------------
 * These helpers simulate the cryptographic primitives used in a real
 * ZKP-based identity system. In production these would be backed by
 * Circom circuits + Snarkjs (Groth16/PLONK), but the public API and
 * data shape mirrors what application code would consume.
 *
 * NOTE: All randomness here is deterministic-but-opaque enough for a
 * demo. Do NOT use for production cryptography.
 */

export type ClaimType = "age_over" | "balance_over" | "credential" | "membership" | "education"

export interface Credential {
  id: string
  type: ClaimType
  /** Human-readable label, e.g. "Government ID — DOB" */
  label: string
  /** Issuer / authority that signed the underlying attestation */
  issuer: string
  /** The private payload (would be encrypted in production). Never leaves the vault. */
  privateData: Record<string, string | number | boolean>
  /** Hash anchored to the IdentityRegistry on-chain. */
  commitmentHash: string
  /** ISO timestamp when the credential was anchored. */
  anchoredAt: string
  /** Whether the credential has been revoked. */
  revoked: boolean
}

export interface ProofRequest {
  /** dApp / verifier requesting the proof. */
  appName: string
  appOrigin: string
  /** What is being asserted, e.g. "age >= 21". */
  statement: string
  /** Which claim type is required to satisfy the statement. */
  claimType: ClaimType
  /** Optional numeric threshold (for age_over / balance_over). */
  threshold?: number
  /** Why the verifier needs this proof. */
  reason: string
}

export interface GeneratedProof {
  /** SHA-256-like hex hash representing the ZK proof artifact. */
  proof: string
  /** Public signals — values the verifier learns (e.g. just `true`). */
  publicSignals: { result: boolean; threshold?: number; claimType: ClaimType }
  /** The on-chain commitment hash referenced by the proof. */
  commitmentHash: string
  /** Verifier name & origin baked into the proof envelope. */
  verifier: { name: string; origin: string }
  /** Issued timestamp. */
  issuedAt: string
  /** Random nullifier preventing replay. */
  nullifier: string
}

export interface AccessLogEntry {
  id: string
  appName: string
  appOrigin: string
  statement: string
  approved: boolean
  proofHash?: string
  timestamp: string
}

/* ------------------------------------------------------------------ */
/* Hashing — uses Web Crypto when available, deterministic fallback   */
/* ------------------------------------------------------------------ */

/**
 * Computes a SHA-256 hex digest in both browser & node environments.
 * Falls back to a stable non-crypto hash if SubtleCrypto is unavailable.
 */
export async function sha256Hex(input: string): Promise<string> {
  try {
    if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
      const encoded = new TextEncoder().encode(input)
      const buf = await globalThis.crypto.subtle.digest("SHA-256", encoded)
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    }
  } catch {
    /* fall through */
  }
  // Deterministic FNV-1a fallback (NOT cryptographically secure — demo only).
  let h1 = 0x811c9dc5
  let h2 = 0xdeadbeef
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0
  }
  const hex = (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).repeat(4)
  return hex.slice(0, 64)
}

/**
 * Hashes credential private data into a Pedersen-style commitment hash.
 * In production this would use Pedersen / Poseidon hashes inside the circuit.
 */
export async function commitCredential(privateData: Record<string, unknown>, salt: string): Promise<string> {
  const canonical = JSON.stringify(privateData, Object.keys(privateData).sort())
  return "0x" + (await sha256Hex(`${canonical}::${salt}`))
}

/* ------------------------------------------------------------------ */
/* Local proof generation                                             */
/* ------------------------------------------------------------------ */

/**
 * Evaluates a proof request against a credential's private data WITHOUT
 * exposing the underlying values. Returns whether the statement holds.
 */
export function evaluateClaim(credential: Credential, request: ProofRequest): boolean {
  if (credential.revoked) return false
  if (credential.type !== request.claimType) return false

  switch (request.claimType) {
    case "age_over": {
      const dob = credential.privateData.dateOfBirth
      const threshold = request.threshold ?? 18
      if (typeof dob !== "string") return false
      const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      return age >= threshold
    }
    case "balance_over": {
      const bal = credential.privateData.balance
      const threshold = request.threshold ?? 0
      return typeof bal === "number" && bal >= threshold
    }
    case "credential":
    case "membership":
    case "education": {
      const verified = credential.privateData.verified
      return verified === true
    }
    default:
      return false
  }
}

/**
 * Generates a (simulated) ZK proof artifact for a credential against a request.
 * Public signals contain ONLY the boolean result + threshold + claim type.
 */
export async function generateLocalProof(
  credential: Credential,
  request: ProofRequest,
): Promise<GeneratedProof> {
  const result = evaluateClaim(credential, request)
  const nullifier =
    "0x" +
    (await sha256Hex(`${credential.commitmentHash}::${request.appOrigin}::${Date.now()}::${Math.random()}`)).slice(
      0,
      32,
    )

  const proof =
    "0x" +
    (await sha256Hex(
      [
        credential.commitmentHash,
        request.claimType,
        String(request.threshold ?? ""),
        String(result),
        nullifier,
      ].join("|"),
    ))

  return {
    proof,
    publicSignals: {
      result,
      threshold: request.threshold,
      claimType: request.claimType,
    },
    commitmentHash: credential.commitmentHash,
    verifier: { name: request.appName, origin: request.appOrigin },
    issuedAt: new Date().toISOString(),
    nullifier,
  }
}

/* ------------------------------------------------------------------ */
/* Verification (mirrors what an off-chain verifier would do)         */
/* ------------------------------------------------------------------ */

/**
 * Verifies that a proof artifact is internally consistent. In production
 * this would call the snarkjs verifier with a verification key.
 */
export async function verifyProof(p: GeneratedProof): Promise<boolean> {
  if (!p.proof.startsWith("0x") || p.proof.length < 18) return false
  if (!p.commitmentHash.startsWith("0x")) return false
  if (!p.nullifier.startsWith("0x")) return false
  if (typeof p.publicSignals?.result !== "boolean") return false
  // Re-derive a deterministic check signature
  const expected = await sha256Hex(
    [
      p.commitmentHash,
      p.publicSignals.claimType,
      String(p.publicSignals.threshold ?? ""),
      String(p.publicSignals.result),
      p.nullifier,
    ].join("|"),
  )
  return p.proof === "0x" + expected
}

/* ------------------------------------------------------------------ */
/* Display helpers                                                    */
/* ------------------------------------------------------------------ */

export function shortHash(h: string, head = 8, tail = 6): string {
  if (!h) return ""
  if (h.length <= head + tail + 3) return h
  return `${h.slice(0, head)}…${h.slice(-tail)}`
}

export function claimTypeLabel(t: ClaimType): string {
  switch (t) {
    case "age_over":
      return "Age Verification"
    case "balance_over":
      return "Financial Threshold"
    case "credential":
      return "Professional Credential"
    case "membership":
      return "Membership"
    case "education":
      return "Education"
  }
}
