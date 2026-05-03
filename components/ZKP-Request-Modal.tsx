"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useVaultStore } from "@/store/useVaultStore"
import { claimTypeLabel, shortHash } from "@/lib/zkp-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  ShieldCheck,
  EyeOff,
  Globe2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
} from "lucide-react"

export function ZKPRequestModal() {
  const pendingRequest = useVaultStore((s) => s.pendingRequest)
  const credentials = useVaultStore((s) => s.credentials)
  const resolvePendingRequest = useVaultStore((s) => s.resolvePendingRequest)
  const clearPendingRequest = useVaultStore((s) => s.clearPendingRequest)

  const [submitting, setSubmitting] = useState(false)

  const matchedCredential = useMemo(() => {
    if (!pendingRequest?.matchedCredentialId) return null
    return credentials.find((c) => c.id === pendingRequest.matchedCredentialId) ?? null
  }, [pendingRequest, credentials])

  const open = !!pendingRequest

  async function handleResolve(approve: boolean) {
    if (!pendingRequest) return
    setSubmitting(true)
    try {
      const result = await resolvePendingRequest(approve)
      if (!approve) {
        toast.info("Request denied", {
          description: `No data was shared with ${pendingRequest.request.appName}.`,
        })
      } else if (result.approved) {
        toast.success("Zero-Knowledge Proof shared", {
          description: `${pendingRequest.request.appName} received only the result — never your data.`,
        })
      } else {
        toast.error("Proof condition not met", {
          description: `Your credential could not satisfy "${pendingRequest.request.statement}".`,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resolve request"
      toast.error("Something went wrong", { description: message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !submitting) clearPendingRequest()
      }}
    >
      <DialogContent
        className="sm:max-w-[520px] border-border bg-card text-foreground p-0 overflow-hidden"
        showCloseButton={false}
      >
        <AnimatePresence>
          {pendingRequest && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-primary/10 to-transparent">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 pulse-glow">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogHeader className="space-y-1">
                      <DialogTitle className="text-base font-semibold tracking-tight">
                        Zero-Knowledge Proof Request
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        Review what is being verified before granting consent.
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-primary/40 text-primary bg-primary/10 text-[10px] uppercase tracking-wider"
                  >
                    Consent Required
                  </Badge>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Verifier */}
                <div className="space-y-2">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Requesting Application
                  </div>
                  <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/40 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background ring-1 ring-border">
                      <Globe2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {pendingRequest.request.appName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground font-mono">
                        {pendingRequest.request.appOrigin}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statement */}
                <div className="space-y-2">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Statement to Prove
                  </div>
                  <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                    <div className="font-mono text-sm text-foreground">
                      {pendingRequest.request.statement}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {pendingRequest.request.reason}
                    </div>
                  </div>
                </div>

                {/* Disclosure */}
                <div className="space-y-2">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    What Will Be Shared
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="text-foreground">
                        A cryptographic <span className="font-mono">true / false</span> result
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="text-foreground">
                        Claim type:{" "}
                        <span className="font-mono">
                          {claimTypeLabel(pendingRequest.request.claimType)}
                        </span>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="text-muted-foreground">
                        Your underlying credential data{" "}
                        <span className="font-medium text-foreground">never leaves your vault</span>
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Credential context */}
                <div className="space-y-2">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Credential Used
                  </div>
                  {matchedCredential ? (
                    <div className="rounded-md border border-border bg-secondary/40 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">
                            {matchedCredential.label}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            Issuer: {matchedCredential.issuer}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-primary/40 bg-primary/10 text-primary"
                        >
                          <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
                          Anchored
                        </Badge>
                      </div>
                      <div className="mt-2 font-mono text-[11px] text-muted-foreground">
                        commit: {shortHash(matchedCredential.commitmentHash, 10, 8)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                      <div className="text-foreground">
                        No anchored credential matches{" "}
                        <span className="font-mono">{claimTypeLabel(pendingRequest.request.claimType)}</span>.
                        You can deny this request, or anchor a credential first.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Actions */}
              <div className="flex flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end">
                <Button
                  variant="ghost"
                  onClick={() => handleResolve(false)}
                  disabled={submitting}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  Deny
                </Button>
                <Button
                  onClick={() => handleResolve(true)}
                  disabled={submitting || !matchedCredential}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Generating Proof…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                      Approve &amp; Share Proof
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
