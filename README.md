# SovereignGraph — Privacy-First Social Data Layer

A decentralized identity & social data layer powered by **Zero-Knowledge Proofs**. Users own their credentials in a private vault, anchor immutable commitments on-chain, and disclose only verifiable answers — never the underlying data.

> **Anchor once. Prove anywhere. Disclose nothing.**

---

## ✨ Features

- **Self-Sovereign Identity** — credentials live in a local, persisted vault you fully control.
- **Zero-Knowledge Proofs** — share `true` / `false` results, never the raw data behind them.
- **Consent-First Sharing** — every proof request requires explicit, contextual approval.
- **Immutable Audit Log** — every disclosure is recorded for transparent review.
- **Solidity Registry** — minimal, event-rich `IdentityRegistry.sol` for anchors, revocations, nullifiers, and social edges.
- **Deep Sea aesthetic** — dark navy + emerald, optimized for readability and trust.

---

## 🧱 Tech Stack

| Layer          | Tech                                                 |
| -------------- | ---------------------------------------------------- |
| Frontend       | Next.js 16 (App Router), React 19, TypeScript        |
| Styling        | Tailwind CSS v4, shadcn/ui, framer-motion            |
| State          | Zustand (with `persist` middleware)                  |
| Cryptography   | Web Crypto SHA-256 (simulating Pedersen / Snarkjs)   |
| Validation     | Zod                                                  |
| Smart Contract | Solidity ^0.8.24 (`contracts/IdentityRegistry.sol`)  |

---

## 📁 Project Structure

```
.
├── app/
│   ├── api/generate-proof/route.ts   # Stateless ZK proof endpoint
│   ├── vault/page.tsx                # Private user dashboard
│   ├── globals.css                   # Deep Sea theme tokens
│   ├── layout.tsx                    # Root layout + Privacy Shield header
│   └── page.tsx                      # Landing page
├── components/
│   ├── ZKP-Request-Modal.tsx         # High-fidelity consent modal
│   ├── site-header.tsx               # Privacy Shield navigation
│   ├── vault-dashboard.tsx           # Credentials + Access Log UI
│   └── ui/                           # shadcn/ui primitives
├── contracts/
│   └── IdentityRegistry.sol          # On-chain anchors, revocations, social graph
├── lib/
│   └── zkp-utils.ts                  # Hashing, claim eval, proof generation, verification
├── store/
│   └── useVaultStore.ts              # Zustand vault + consent management
└── README.md
```

---

## 🚀 Getting Started

### 1. Install dependencies
pnpm install
```

### 2. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Demo the flow

1. Click **Connect Identity** in the header.
2. From the Vault, **Anchor a Credential** (e.g. an Age Verification with your DOB).
3. Click **Simulate Verifier Request** and pick a scenario.
4. Approve the request — only the boolean result is "shared".
5. Inspect the **Consent & Access Log** for an immutable audit trail.

---

## 🔐 ZK Proof API

`POST /api/generate-proof`

```json
{
  "credential": {
    "id": "cred_…",
    "type": "age_over",
    "label": "Government ID",
    "issuer": "State of California",
    "privateData": { "dateOfBirth": "1995-01-15" },
    "commitmentHash": "0x…",
    "anchoredAt": "2026-05-03T00:00:00.000Z",
    "revoked": false
  },
  "request": {
    "appName": "Atlas Wines",
    "appOrigin": "atlas-wines.app",
    "statement": "User age ≥ 21",
    "claimType": "age_over",
    "threshold": 21,
    "reason": "Compliance with alcohol-purchase regulations."
  }
}
```

**Response**

```json
{
  "ok": true,
  "verified": true,
  "proof": {
    "proof": "0x…",
    "publicSignals": { "result": true, "threshold": 21, "claimType": "age_over" },
    "commitmentHash": "0x…",
    "verifier": { "name": "Atlas Wines", "origin": "atlas-wines.app" },
    "issuedAt": "2026-05-03T00:00:00.000Z",
    "nullifier": "0x…"
  }
}
```

The endpoint is **stateless**: it never persists any private input.

---

## 🛡 Smart Contract

`contracts/IdentityRegistry.sol` provides:

- `anchorCredential(bytes32 commitment, ClaimType, string issuer)` → emits `CredentialAnchored`
- `revokeCredential(bytes32 commitment)` → emits `CredentialRevoked`
- `spendNullifier(bytes32 nullifier, bytes32 commitment)` → emits `NullifierSpent` (replay-protection)
- `addSocialEdge(address peer)` / `removeSocialEdge(address peer)` → emits `SocialEdgeAdded` / `SocialEdgeRemoved`
- View helpers: `getAnchor`, `isValidAnchor`, `anchorsOf`, `hasSocialEdge`

Every state-changing function emits an event so the social/identity graph can be reconstructed off-chain by indexers.

---

## 🎨 Design Tokens

Defined in [`app/globals.css`](./app/globals.css) — the *Deep Sea* palette:

| Token         | Value      |
| ------------- | ---------- |
| Background    | `#020617`  |
| Surface       | `#0b1424`  |
| Foreground    | `#e2e8f0`  |
| Muted         | `#94a3b8`  |
| **Accent**    | `#10b981`  |

---

<!-- metadata: 1y89moh5vb -->
<!-- metadata: ojfhtg8icv -->
<!-- metadata: a82qpu8f8s -->
<!-- metadata: 5qwkwyl6dx -->
<!-- metadata: sfych5oxbp -->
<!-- metadata: ymx2d97j5e -->
<!-- metadata: 6jp93ajcse -->
<!-- metadata: ubdq5nuu79 -->
<!-- metadata: a2msz4qvnx -->
<!-- metadata: 4ge2bhwk5w -->
## 📦 Deploy

This is a standard Next.js 16 App Router project. Deploy to [Vercel](https://vercel.com/new) with zero configuration:

```bash
vercel deploy
```

---

## 📄 License

MIT © SovereignGraph Protocol
