"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Wallet,
  Plus,
  ShieldCheck,
  Activity,
  CheckCircle2,
  XCircle,
  Trash2,
  Ban,
  Lock,
  Sparkles,
  ScanLine,
  GraduationCap,
  CalendarCheck2,
  Coins,
  BadgeCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { useVaultStore } from "@/store/useVaultStore"
import { ZKPRequestModal } from "@/components/ZKP-Request-Modal"
import { type ClaimType, claimTypeLabel, shortHash } from "@/lib/zkp-utils"
import { toast } from "sonner"
import { motion } from "framer-motion"

type CredentialDraft =
  | { type: "age_over"; label: string; issuer: string; dateOfBirth: string }
  | { type: "balance_over"; label: string; issuer: string; balance: string }
  | { type: "credential"; label: string; issuer: string; verified: true }
  | { type: "membership"; label: string; issuer: string; verified: true }
  | { type: "education"; label: string; issuer: string; verified: true }

const CLAIM_ICON: Record<ClaimType, typeof ShieldCheck> = {
  age_over: CalendarCheck2,
  balance_over: Coins,
  credential: BadgeCheck,
  membership: ShieldCheck,
  education: GraduationCap,
}

export function VaultDashboard() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const walletAddress = useVaultStore((s) => s.walletAddress)
  const credentials = useVaultStore((s) => s.credentials)
  const accessLog = useVaultStore((s) => s.accessLog)
  const connectWallet = useVaultStore((s) => s.connectWallet)
  const addCredential = useVaultStore((s) => s.addCredential)
  const revokeCredential = useVaultStore((s) => s.revokeCredential)
  const removeCredential = useVaultStore((s) => s.removeCredential)
  const requestProof = useVaultStore((s) => s.requestProof)
  const clearLog = useVaultStore((s) => s.clearLog)

  if (!mounted) {
    // SSR-stable placeholder to avoid hydration mismatch with persisted state
    return <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6" aria-hidden />
  }

  if (!walletAddress) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
        <Card className="border-border bg-card/70">
          <CardContent className="p-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Wallet className="h-6 w-6" aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>Connect to your sovereign identity</EmptyTitle>
                <EmptyDescription>
                  Your vault is generated locally and never leaves your device.
                  Anchor credentials on-chain to start sharing zero-knowledge proofs.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                onClick={() => connectWallet()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Wallet className="mr-2 h-4 w-4" aria-hidden="true" />
                Generate Identity
              </Button>
            </Empty>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <ZKPRequestModal />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
            Sovereign Vault
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Your private identity layer
          </h1>
          <p className="text-sm text-muted-foreground">
            Connected as{" "}
            <span className="font-mono text-foreground">
              {shortHash(walletAddress, 8, 6)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AnchorCredentialDialog onAnchor={async (draft) => {
            await handleAnchor(draft, addCredential)
          }} />
          <DemoRequestMenu onRequest={(claimType) => {
            handleDemoRequest(claimType, requestProof, credentials)
          }} />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={ShieldCheck}
          label="Anchored Credentials"
          value={credentials.filter((c) => !c.revoked).length.toString()}
          hint={`${credentials.filter((c) => c.revoked).length} revoked`}
        />
        <StatCard
          icon={Activity}
          label="Proof Requests"
          value={accessLog.length.toString()}
          hint={`${accessLog.filter((l) => l.approved).length} approved`}
        />
        <StatCard
          icon={Lock}
          label="Data Disclosed"
          value="0 bytes"
          hint="Zero-knowledge by design"
          accent
        />
      </div>

      {/* Credentials */}
      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Anchored Credentials
            </h2>
            <p className="text-xs text-muted-foreground">
              Commitment hashes are immutable on-chain. Private data stays in your vault.
            </p>
          </div>
        </div>

        {credentials.length === 0 ? (
          <Card className="border-border bg-card/60">
            <CardContent className="p-10">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Sparkles className="h-6 w-6" aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No credentials anchored yet</EmptyTitle>
                  <EmptyDescription>
                    Anchor your first credential to begin generating zero-knowledge proofs.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {credentials.map((c) => {
              const Icon = CLAIM_ICON[c.type]
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={`border-border bg-card/70 ${
                      c.revoked ? "opacity-60" : ""
                    }`}
                  >
                    <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/30">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="truncate text-sm font-semibold text-foreground">
                            {c.label}
                          </CardTitle>
                          <CardDescription className="truncate text-xs text-muted-foreground">
                            {c.issuer}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          c.revoked
                            ? "border-destructive/40 bg-destructive/10 text-destructive"
                            : "border-primary/40 bg-primary/10 text-primary"
                        }
                      >
                        {c.revoked ? "Revoked" : claimTypeLabel(c.type)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="rounded-md border border-border bg-secondary/30 p-2.5">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Commitment Hash
                        </div>
                        <div className="font-mono text-xs text-foreground">
                          {shortHash(c.commitmentHash, 14, 10)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          Anchored {new Date(c.anchoredAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          {!c.revoked && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                revokeCredential(c.id)
                                toast.info("Credential revoked", {
                                  description: "Future proofs from this anchor will fail verification.",
                                })
                              }}
                              className="h-7 px-2 text-muted-foreground hover:text-destructive"
                            >
                              <Ban className="mr-1 h-3 w-3" aria-hidden="true" />
                              Revoke
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              removeCredential(c.id)
                              toast.success("Credential removed from vault")
                            }}
                            className="h-7 px-2 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="mr-1 h-3 w-3" aria-hidden="true" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {/* Access log */}
      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Consent &amp; Access Log
            </h2>
            <p className="text-xs text-muted-foreground">
              Every proof request — approved or denied — is recorded immutably for your audit.
            </p>
          </div>
          {accessLog.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                clearLog()
                toast.success("Access log cleared")
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear log
            </Button>
          )}
        </div>

        {accessLog.length === 0 ? (
          <Card className="border-border bg-card/60">
            <CardContent className="p-10">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ScanLine className="h-6 w-6" aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No proof requests yet</EmptyTitle>
                  <EmptyDescription>
                    Try the “Simulate Verifier Request” button to see a zero-knowledge proof flow.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border bg-card/70">
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {accessLog.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start gap-3 px-5 py-4"
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1 ${
                        entry.approved
                          ? "bg-primary/10 text-primary ring-primary/30"
                          : "bg-destructive/10 text-destructive ring-destructive/30"
                      }`}
                    >
                      {entry.approved ? (
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-medium text-foreground">
                          {entry.appName}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {entry.appOrigin}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        “{entry.statement}”
                      </div>
                      {entry.proofHash && (
                        <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                          proof: {shortHash(entry.proofHash, 10, 8)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          entry.approved
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-destructive/40 bg-destructive/10 text-destructive"
                        }
                      >
                        {entry.approved ? "Approved" : "Denied"}
                      </Badge>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Subcomponents                                                       */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = false,
}: {
  icon: typeof ShieldCheck
  label: string
  value: string
  hint?: string
  accent?: boolean
}) {
  return (
    <Card
      className={`border-border ${
        accent ? "bg-primary/5 border-primary/30" : "bg-card/70"
      }`}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-md ring-1 ${
            accent
              ? "bg-primary/15 text-primary ring-primary/40"
              : "bg-secondary text-muted-foreground ring-border"
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="text-xl font-semibold text-foreground">{value}</div>
          {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

function AnchorCredentialDialog({
  onAnchor,
}: {
  onAnchor: (draft: CredentialDraft) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [type, setType] = useState<ClaimType>("age_over")
  const [label, setLabel] = useState("")
  const [issuer, setIssuer] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [balance, setBalance] = useState("")

  function reset() {
    setType("age_over")
    setLabel("")
    setIssuer("")
    setDateOfBirth("")
    setBalance("")
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !issuer.trim()) {
      toast.error("Label and issuer are required")
      return
    }
    let draft: CredentialDraft
    if (type === "age_over") {
      if (!dateOfBirth) {
        toast.error("Date of birth is required for age verification")
        return
      }
      draft = { type, label, issuer, dateOfBirth }
    } else if (type === "balance_over") {
      const n = Number(balance)
      if (!Number.isFinite(n) || n < 0) {
        toast.error("Balance must be a non-negative number")
        return
      }
      draft = { type, label, issuer, balance: balance }
    } else {
      draft = { type, label, issuer, verified: true }
    }
    setSubmitting(true)
    try {
      await onAnchor(draft)
      toast.success("Credential anchored", {
        description: "Commitment hash committed to the IdentityRegistry.",
      })
      reset()
      setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Anchor Credential
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Anchor a new credential</DialogTitle>
          <DialogDescription>
            Private data is hashed locally. Only the commitment is anchored on-chain.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="claim-type">Claim type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ClaimType)}>
              <SelectTrigger id="claim-type" className="bg-secondary/40 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="age_over">Age Verification</SelectItem>
                <SelectItem value="balance_over">Financial Threshold</SelectItem>
                <SelectItem value="credential">Professional Credential</SelectItem>
                <SelectItem value="membership">Membership</SelectItem>
                <SelectItem value="education">Education</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Government ID"
                className="bg-secondary/40 border-border"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issuer">Issuer</Label>
              <Input
                id="issuer"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g. State of California"
                className="bg-secondary/40 border-border"
                required
              />
            </div>
          </div>

          {type === "age_over" && (
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of birth (private)</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="bg-secondary/40 border-border"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Stored only in your vault. Never transmitted.
              </p>
            </div>
          )}

          {type === "balance_over" && (
            <div className="space-y-1.5">
              <Label htmlFor="balance">Account balance (private)</Label>
              <Input
                id="balance"
                type="number"
                min={0}
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="e.g. 12500"
                className="bg-secondary/40 border-border"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Used only to evaluate threshold proofs locally.
              </p>
            </div>
          )}

          {(type === "credential" || type === "membership" || type === "education") && (
            <div className="rounded-md border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
              A boolean attestation will be hashed and anchored. Use the label and
              issuer to describe the credential.
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
              {submitting ? "Anchoring…" : "Anchor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const DEMO_REQUESTS: Array<{
  claimType: ClaimType
  appName: string
  appOrigin: string
  statement: string
  reason: string
  threshold?: number
}> = [
  {
    claimType: "age_over",
    appName: "Atlas Wines",
    appOrigin: "atlas-wines.app",
    statement: "User age ≥ 21",
    reason: "Compliance with alcohol-purchase regulations. We never store DOB.",
    threshold: 21,
  },
  {
    claimType: "balance_over",
    appName: "Lighthouse Mortgages",
    appOrigin: "lighthouse.fi",
    statement: "Account balance ≥ $5,000",
    reason: "Pre-qualification for a loan. Exact balance is not disclosed.",
    threshold: 5000,
  },
  {
    claimType: "credential",
    appName: "GuildHub",
    appOrigin: "guildhub.dev",
    statement: "Holds a verified developer credential",
    reason: "Granting access to private contributor channels.",
  },
  {
    claimType: "education",
    appName: "Kelp.edu",
    appOrigin: "kelp.edu",
    statement: "Holds a verified higher-education credential",
    reason: "Discounted course access for accredited graduates.",
  },
]

function DemoRequestMenu({
  onRequest,
}: {
  onRequest: (claimType: ClaimType) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-border bg-secondary/40 hover:bg-secondary text-foreground"
        >
          <ScanLine className="mr-2 h-4 w-4" aria-hidden="true" />
          Simulate Verifier Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Simulate a third-party verifier</DialogTitle>
          <DialogDescription>
            Pick a scenario. SovereignGraph will route the request through the consent flow
            and only share a zero-knowledge result.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {DEMO_REQUESTS.map((r) => {
            const Icon = CLAIM_ICON[r.claimType]
            return (
              <li key={`${r.appOrigin}-${r.claimType}`}>
                <button
                  type="button"
                  onClick={() => {
                    onRequest(r.claimType)
                    setOpen(false)
                  }}
                  className="group flex w-full items-start gap-3 rounded-md border border-border bg-secondary/30 p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/30">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {r.appName}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {r.appOrigin}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs font-mono text-foreground">
                      {r.statement}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.reason}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

async function handleAnchor(
  draft: CredentialDraft,
  addCredential: ReturnType<typeof useVaultStore.getState>["addCredential"],
) {
  const privateData: Record<string, string | number | boolean> = {}
  if (draft.type === "age_over") privateData.dateOfBirth = draft.dateOfBirth
  else if (draft.type === "balance_over") privateData.balance = Number(draft.balance)
  else privateData.verified = true

  await addCredential({
    type: draft.type,
    label: draft.label,
    issuer: draft.issuer,
    privateData,
  })
}

function handleDemoRequest(
  claimType: ClaimType,
  requestProof: ReturnType<typeof useVaultStore.getState>["requestProof"],
  credentials: ReturnType<typeof useVaultStore.getState>["credentials"],
) {
  const scenario = DEMO_REQUESTS.find((r) => r.claimType === claimType)
  if (!scenario) return

  const hasMatch = credentials.some((c) => !c.revoked && c.type === claimType)
  if (!hasMatch) {
    toast.warning("No matching credential anchored", {
      description: `Anchor a ${claimTypeLabel(claimType)} credential first to satisfy this request.`,
    })
  }

  requestProof({
    claimType,
    appName: scenario.appName,
    appOrigin: scenario.appOrigin,
    statement: scenario.statement,
    reason: scenario.reason,
    threshold: scenario.threshold,
  })
}
