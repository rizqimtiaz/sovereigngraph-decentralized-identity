"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ShieldCheck, Wallet, LogOut, LayoutDashboard, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useVaultStore } from "@/store/useVaultStore"
import { shortHash } from "@/lib/zkp-utils"

export function SiteHeader() {
  const [mounted, setMounted] = useState(false)
  const walletAddress = useVaultStore((s) => s.walletAddress)
  const credentials = useVaultStore((s) => s.credentials)
  const connectWallet = useVaultStore((s) => s.connectWallet)
  const disconnectWallet = useVaultStore((s) => s.disconnectWallet)

  // Avoid hydration mismatch — Zustand persist hydrates on the client.
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30 transition-colors group-hover:bg-primary/25">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-foreground">
              SovereignGraph
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Privacy Shield
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Home
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link href="/vault">
              <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden="true" />
              Vault
            </Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          {mounted && walletAddress ? (
            <>
              <Badge
                variant="outline"
                className="hidden border-primary/40 bg-primary/10 text-primary sm:inline-flex"
              >
                {credentials.length} anchored
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border bg-secondary/50 font-mono text-xs text-foreground hover:bg-secondary"
                  >
                    <span className="mr-2 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    {shortHash(walletAddress, 6, 4)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Sovereign Identity
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild>
                    <Link href="/vault" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden="true" />
                      Open Vault
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={() => disconnectWallet()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => connectWallet()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Wallet className="mr-2 h-4 w-4" aria-hidden="true" />
              {mounted ? "Connect Identity" : "Connect"}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
