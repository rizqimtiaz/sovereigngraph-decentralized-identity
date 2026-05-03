import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  EyeOff,
  Network,
  Lock,
  ArrowRight,
  KeyRound,
  Fingerprint,
  Server,
  CheckCircle2,
} from "lucide-react"

const features = [
  {
    icon: KeyRound,
    title: "Self-Sovereign Identity",
    body: "Your credentials live in a private vault you control. Anchor cryptographic commitments on-chain — never the data itself.",
  },
  {
    icon: EyeOff,
    title: "Zero-Knowledge Proofs",
    body: "Prove statements like 'over 21' or 'certified developer' without revealing dates of birth, balances, or documents.",
  },
  {
    icon: Network,
    title: "Portable Social Graph",
    body: "Plug your encrypted graph into any new app. Relationships travel with you — no platform owns your connections.",
  },
  {
    icon: ShieldCheck,
    title: "Consent-First Sharing",
    body: "Every proof request requires explicit, contextual consent. Revoke access at any time from a transparent audit log.",
  },
] as const

const flowSteps = [
  {
    n: "01",
    title: "Anchor",
    body: "Hash your credential and commit it to the IdentityRegistry contract.",
  },
  {
    n: "02",
    title: "Request",
    body: "An app asks for a verifiable statement — never the underlying data.",
  },
  {
    n: "03",
    title: "Prove",
    body: "Generate a ZK proof locally and share only the boolean result.",
  },
  {
    n: "04",
    title: "Audit",
    body: "Every disclosure is logged. Revoke anchors and access at any time.",
  },
] as const

export default function HomePage() {
  return (
    <div className="bg-deepsea-grid">
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <div className="flex flex-col items-start gap-6">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary"
          >
            <ShieldCheck className="mr-1.5 h-3 w-3" aria-hidden="true" />
            Privacy-First Social Data Layer
          </Badge>

          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Own your identity.{" "}
            <span className="text-primary">Share proofs, not data.</span>
          </h1>

          <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            SovereignGraph is a decentralized identity & social data layer powered
            by Zero-Knowledge Proofs. Anchor immutable commitments on-chain and
            disclose only verifiable answers — never the credentials behind them.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/vault">
                Open Your Vault
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-border bg-secondary/40 hover:bg-secondary text-foreground"
            >
              <Link href="#how-it-works">How it works</Link>
            </Button>
          </div>

          {/* Trust strip */}
          <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Immutable anchors
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Local proof generation
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Revocable consent
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Zero data custody
            </li>
          </ul>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {features.map((f) => (
            <Card
              key={f.title}
              className="border-border bg-card/60 backdrop-blur transition-colors hover:border-primary/40"
            >
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/30">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Flow */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6"
      >
        <div className="mb-8 flex flex-col gap-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
            Protocol Flow
          </div>
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Anchor once. Prove anywhere. Disclose nothing.
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A single privacy-preserving primitive replaces dozens of bespoke
            verification flows — without ever centralizing your data.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {flowSteps.map((s) => (
            <div
              key={s.n}
              className="rounded-lg border border-border bg-card/60 p-5 transition-colors hover:border-primary/40"
            >
              <div className="font-mono text-xs text-primary">{s.n}</div>
              <div className="mt-3 text-sm font-semibold text-foreground">
                {s.title}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <Card className="border-border bg-card/70">
          <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3 md:p-8">
            <div className="space-y-2 md:col-span-1">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
                Architecture
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                Cryptography you can audit.
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Built on open primitives — Pedersen commitments, Groth16 proofs,
                and a minimal Solidity registry that emits events for every
                identity update.
              </p>
            </div>
            <ul className="md:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  icon: Fingerprint,
                  title: "Vault",
                  body: "Encrypted client-side store of credentials & secrets.",
                },
                {
                  icon: Lock,
                  title: "ZK Circuit",
                  body: "Local proof generation against on-chain commitments.",
                },
                {
                  icon: Server,
                  title: "Verifier API",
                  body: "Stateless route that validates proofs without storing data.",
                },
                {
                  icon: Network,
                  title: "Registry",
                  body: "Immutable Solidity contract for anchors & revocations.",
                },
              ].map((item) => (
                <li
                  key={item.title}
                  className="flex items-start gap-3 rounded-md border border-border bg-secondary/30 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/30">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {item.title}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <div>© {new Date().getFullYear()} SovereignGraph Protocol</div>
          <div className="font-mono">v1.0.0 · Deep Sea</div>
        </div>
      </footer>
    </div>
  )
}
