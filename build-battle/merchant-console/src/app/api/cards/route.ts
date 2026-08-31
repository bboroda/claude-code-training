import { merchantById } from "@/data/merchants"
import { store } from "@/data/store"
import { Currency } from "@/data/types"
import { extractLast4, generateCardNumber } from "@/lib/cards"
import { NextRequest, NextResponse } from "next/server"

const VALID_CURRENCIES: Currency[] = ["USD", "EUR", "GBP"]
const MAX_LIMIT = 5_000_000 // 5 million minor units

/**
 * GET /api/cards
 * Returns all cards with last4 only (never the full number).
 */
export function GET() {
  return NextResponse.json({ cards: store.cards })
}

/**
 * POST /api/cards
 * Creates a new card with server-side validation.
 * Returns the full PAN exactly once in the response.
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 })
  }

  const { nickname, merchantId, limit, currency } = body as {
    nickname?: string
    merchantId?: string
    limit?: number
    currency?: string
  }

  // Validate nickname
  if (!nickname || typeof nickname !== "string" || nickname.trim() === "") {
    return NextResponse.json(
      { message: "Nickname is required" },
      { status: 400 },
    )
  }

  // Validate merchant
  if (!merchantId || typeof merchantId !== "string") {
    return NextResponse.json(
      { message: "Merchant is required" },
      { status: 400 },
    )
  }
  const merchant = merchantById(merchantId)
  if (!merchant) {
    return NextResponse.json(
      { message: "Invalid merchant" },
      { status: 400 },
    )
  }

  // Validate limit (must be positive integer, max 5M minor units)
  if (typeof limit !== "number" || !Number.isInteger(limit) || limit <= 0) {
    return NextResponse.json(
      { message: "Limit must be a positive integer" },
      { status: 400 },
    )
  }
  if (limit > MAX_LIMIT) {
    return NextResponse.json(
      { message: `Limit cannot exceed ${MAX_LIMIT} minor units` },
      { status: 400 },
    )
  }

  // Validate currency
  if (!currency || !VALID_CURRENCIES.includes(currency as Currency)) {
    return NextResponse.json(
      { message: "Currency must be USD, EUR, or GBP" },
      { status: 400 },
    )
  }

  // Generate card number server-side
  const cardNumber = generateCardNumber()
  const last4 = extractLast4(cardNumber)

  // Create card
  const card = {
    id: `card_${String(store.cards.length + 1).padStart(4, "0")}`,
    nickname: nickname.trim(),
    merchantId,
    last4,
    limit,
    spend: 0,
    currency: currency as Currency,
    status: "active" as const,
    createdAt: new Date().toISOString(),
  }

  store.cards.push(card)

  // Return card with full PAN (this is the only time it's exposed)
  return NextResponse.json({
    card,
    cardNumber, // Full PAN, shown once only
  })
}
