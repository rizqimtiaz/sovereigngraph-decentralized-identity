import type { Metadata } from "next"
import { VaultDashboard } from "@/components/vault-dashboard"

export const metadata: Metadata = {
  title: "Vault — SovereignGraph",
  description:
    "Your private identity vault. Anchor credentials, manage consent, and audit every proof shared.",
}

export default function VaultPage() {
  return (
    <div className="bg-deepsea-grid">
      <VaultDashboard />
    </div>
  )
}
