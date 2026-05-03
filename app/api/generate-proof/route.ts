import { NextResponse } from "next/server"
import { z } from "zod"
import {
  type Credential,
  type ProofRequest,
  generateLocalProof,
  verifyProof,
} from "@/lib/zkp-utils"

export const runtime = "nodejs"

/**
 * POST /api/generate-proof
 *
 * Body:
 *   {
 *     credential: Credential,
 *     request: ProofRequest
 *   }
 *
 * Response (200):
 *   { ok: true, proof: GeneratedProof, verified: boolean }
 */

const claimTypeSchema = z.enum([
  "age_over",
  "balance_over",
  "credential",
  "membership",
  "education",
])

const credentialSchema = z.object({
  id: z.string().min(1),
  type: claimTypeSchema,
  label: z.string().min(1),
  issuer: z.string().min(1),
  privateData: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  commitmentHash: z.string().regex(/^0x[a-f0-9]+$/i),
  anchoredAt: z.string().min(1),
  revoked: z.boolean(),
})

const requestSchema = z.object({
  appName: z.string().min(1),
  appOrigin: z.string().min(1),
  statement: z.string().min(1),
  claimType: claimTypeSchema,
  threshold: z.number().optional(),
  reason: z.string().min(1),
})

const bodySchema = z.object({
  credential: credentialSchema,
  request: requestSchema,
})

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const credential = parsed.data.credential as Credential
  const request = parsed.data.request as ProofRequest

  try {
    const proof = await generateLocalProof(credential, request)
    const verified = await verifyProof(proof)
    return NextResponse.json({ ok: true, proof, verified }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "SovereignGraph Proof Generator",
    version: "1.0.0",
    method: "POST",
  })
}
