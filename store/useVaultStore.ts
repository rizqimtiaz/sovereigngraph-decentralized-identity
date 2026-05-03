"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  type AccessLogEntry,
  type Credential,
  type GeneratedProof,
  type ProofRequest,
  commitCredential,
  generateLocalProof,
} from "@/lib/zkp-utils"

interface PendingRequest {
  id: string
  request: ProofRequest
  /** ID of the credential we'd use to satisfy the request, if any. */
  matchedCredentialId: string | null
}

interface VaultState {
  /** Mock wallet address — generated locally on first "Connect". */
  walletAddress: string | null
  unlocked: boolean
  /** Anchored credentials in the user's vault. */
  credentials: Credential[]
  /** Audit log of every proof request — approved or denied. */
  accessLog: AccessLogEntry[]
  /** Currently active proof request shown in the modal. */
  pendingRequest: PendingRequest | null

  /* Actions */
  connectWallet: () => void
  disconnectWallet: () => void
  unlockVault: () => void
  lockVault: () => void
  addCredential: (input: {
    type: Credential["type"]
    label: string
    issuer: string
    privateData: Record<string, string | number | boolean>
  }) => Promise<Credential>
  revokeCredential: (id: string) => void
  removeCredential: (id: string) => void
  requestProof: (request: ProofRequest) => string
  resolvePendingRequest: (
    approve: boolean,
  ) => Promise<{ approved: boolean; proof?: GeneratedProof; logEntry: AccessLogEntry }>
  clearPendingRequest: () => void
  clearLog: () => void
  resetVault: () => void
}

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

function randomAddress(): string {
  const hex = "0123456789abcdef"
  let out = "0x"
  for (let i = 0; i < 40; i++) out += hex[Math.floor(Math.random() * 16)]
  return out
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      walletAddress: null,
      unlocked: false,
      credentials: [],
      accessLog: [],
      pendingRequest: null,

      connectWallet: () => {
        const existing = get().walletAddress
        set({
          walletAddress: existing ?? randomAddress(),
          unlocked: true,
        })
      },

      disconnectWallet: () => {
        set({ walletAddress: null, unlocked: false, pendingRequest: null })
      },

      unlockVault: () => set({ unlocked: true }),
      lockVault: () => set({ unlocked: false, pendingRequest: null }),

      addCredential: async ({ type, label, issuer, privateData }) => {
        const id = uid("cred")
        const salt = uid("salt")
        const commitmentHash = await commitCredential(privateData, salt)
        const credential: Credential = {
          id,
          type,
          label,
          issuer,
          privateData,
          commitmentHash,
          anchoredAt: new Date().toISOString(),
          revoked: false,
        }
        set({ credentials: [credential, ...get().credentials] })
        return credential
      },

      revokeCredential: (id) => {
        set({
          credentials: get().credentials.map((c) =>
            c.id === id ? { ...c, revoked: true } : c,
          ),
        })
      },

      removeCredential: (id) => {
        set({ credentials: get().credentials.filter((c) => c.id !== id) })
      },

      requestProof: (request) => {
        const matched =
          get().credentials.find((c) => !c.revoked && c.type === request.claimType) ?? null
        const id = uid("req")
        set({
          pendingRequest: {
            id,
            request,
            matchedCredentialId: matched?.id ?? null,
          },
        })
        return id
      },

      resolvePendingRequest: async (approve) => {
        const pending = get().pendingRequest
        if (!pending) {
          throw new Error("No pending proof request to resolve.")
        }
        const { request, matchedCredentialId } = pending
        const credential = get().credentials.find((c) => c.id === matchedCredentialId) ?? null

        let proof: GeneratedProof | undefined
        let approved = false

        if (approve && credential) {
          proof = await generateLocalProof(credential, request)
          approved = proof.publicSignals.result
        }

        const logEntry: AccessLogEntry = {
          id: uid("log"),
          appName: request.appName,
          appOrigin: request.appOrigin,
          statement: request.statement,
          approved,
          proofHash: proof?.proof,
          timestamp: new Date().toISOString(),
        }

        set({
          accessLog: [logEntry, ...get().accessLog].slice(0, 100),
          pendingRequest: null,
        })

        return { approved, proof, logEntry }
      },

      clearPendingRequest: () => set({ pendingRequest: null }),
      clearLog: () => set({ accessLog: [] }),
      resetVault: () =>
        set({
          credentials: [],
          accessLog: [],
          pendingRequest: null,
        }),
    }),
    {
      name: "sovereigngraph.vault.v1",
      // Don't persist the active modal state across reloads.
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        unlocked: state.unlocked,
        credentials: state.credentials,
        accessLog: state.accessLog,
      }),
    },
  ),
)
