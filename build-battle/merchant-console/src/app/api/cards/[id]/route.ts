import { store } from "@/data/store"
import { CardStatus } from "@/data/types"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/cards/[id]
 * Returns a single card with last4 only (never the full number).
 */
export function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return params.then(({ id }) => {
    const card = store.cards.find((c) => c.id === id)
    if (!card) {
      return NextResponse.json({ message: "Card not found" }, { status: 404 })
    }
    return NextResponse.json({ card })
  })
}

/**
 * PATCH /api/cards/[id]
 * Updates card status (freeze/unfreeze/cancel).
 * Status transitions: active ↔ frozen, either → cancelled (terminal).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const card = store.cards.find((c) => c.id === id)

  if (!card) {
    return NextResponse.json({ message: "Card not found" }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 })
  }

  const { status } = body as { status?: string }

  if (!status) {
    return NextResponse.json({ message: "Status is required" }, { status: 400 })
  }

  // Validate status transition
  const validTransitions: Record<CardStatus, CardStatus[]> = {
    active: ["frozen", "cancelled"],
    frozen: ["active", "cancelled"],
    cancelled: [], // Terminal state
  }

  if (!validTransitions[card.status].includes(status as CardStatus)) {
    return NextResponse.json(
      {
        message: `Cannot transition from ${card.status} to ${status}`,
      },
      { status: 400 },
    )
  }

  card.status = status as CardStatus

  return NextResponse.json({ card })
}
