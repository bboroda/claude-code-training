# SPEC · NWP-201 — Issue virtual cards from the console

> Written before any code. Generated with `/spec`, then edited by a human.
> Load it as context when you build: `@docs/specs/NWP-201-issue-cards.md`

**Ticket:** [NWP-201](../tickets/NWP-201.md)
**Author:** Claude
**Status:** draft

## Problem

Ops issues virtual cards by messaging the platform team, who create them by hand. It takes hours, happens 12-20 times weekly, and last month two cards were created with the wrong spend limit because the request was buried in a Slack thread. Merchants need these for vendor subscriptions, ad spend, and contractor tools.

## Current state

- **No `/cards` route exists.** The sidebar in `src/components/ui/navigation/AppSidebar.tsx:26-51` shows Overview, Payments, Disputes, Payouts — no Cards.
- **No Card type defined.** `src/data/types.ts` has Payment, Refund, Dispute, Payout — no Card.
- **No cards in store.** `src/data/store.ts:16-22` defines Store with payments, refunds, disputes, payouts — no cards array.
- **Existing helpers to reuse:**
  - `src/lib/money.ts:15-23` — `formatMoney(minorUnits, currency)` for display
  - `src/lib/money.ts:46-52` — `parseAmountToMinorUnits(input)` for form input
  - `src/lib/dates.ts:31-36` — `formatDate(iso)` for table dates
  - `src/data/merchants.ts:90` — `merchantById(id)` for lookups
  - `src/data/merchants.ts:7-88` — merchants array for select dropdown
- **UI components available:**
  - `src/components/Drawer.tsx` — Radix Dialog-based drawer for forms
  - `src/components/Select.tsx` — Radix Select for merchant/currency dropdowns
  - `src/components/Input.tsx` — form inputs
  - `src/components/Button.tsx` — primary/secondary/destructive variants
  - `src/components/Table.tsx` — table primitives
  - `src/components/ui/payments/StatusBadge.tsx` — badge pattern to adapt for card status

## Domain rules

| Rule | Source | What breaks if ignored |
| --- | --- | --- |
| Money is integer minor units ($250.00 = 25000) | `CLAUDE.md`, ticket | Cent drift, wrong limits |
| Never store full card number — only last4 + reference (card ID) | `CLAUDE.md`, ticket | PAN persisted, security violation |
| Test BIN `4242` only | `CLAUDE.md`, `.claude/rules/cards.md` | Could generate real-looking PANs |
| Luhn check digit required | ticket | Invalid card numbers |
| Reveal once, mask forever | `CLAUDE.md`, `.claude/rules/cards.md` | PAN exposed in list/detail |
| Status state machine: `active ⇄ frozen`, either → `cancelled` (terminal) | `CLAUDE.md`, `.claude/rules/cards.md` | Invalid transitions |
| Generate on server | `.claude/rules/cards.md` | Client-generated numbers = bug |
| Validate on server | `CLAUDE.md` | Bad data reaches store |
| Limit: 1 to 5,000,000 minor units | ticket | Invalid cards |
| Currency: USD, EUR, GBP only | ticket | Bad currency stored |

## Approach

Add a `/cards` route with list and detail pages, plus an "Issue card" drawer form. Cards are created via POST to `/api/cards`, which generates the number server-side, validates inputs, and returns the full PAN exactly once in the response. **The full number is never stored** — only the card ID (as reference) and last4. The list and detail routes return last4 only, masked as `•••• XXXX` where XXXX is the actual last 4 digits.

The `Card` type includes a `spend` field (integer minor units) that starts at 0 for new cards. Card detail shows spend against the limit.

**Considered and rejected:** A separate success page for the reveal. This adds a route and requires passing the PAN through navigation state. Simpler to show the success UI in the same drawer that submitted the form, then clear it on close.

## File map

| File | Add or change | Why |
| --- | --- | --- |
| `src/data/types.ts` | change | Add `Card` type (id, nickname, merchantId, last4, limit, spend, currency, status, createdAt), `CardStatus` |
| `src/data/store.ts` | change | Add `cards: Card[]` to Store |
| `src/lib/cards.ts` | add | Luhn generator, `generateCardNumber()`, `maskCardNumber(last4)` → `•••• XXXX` |
| `src/lib/cards.test.ts` | add | Tests for Luhn, generation, masking (stretch — do after core) |
| `src/app/api/cards/route.ts` | add | GET (list with last4 only), POST (create with validation, return full PAN once) |
| `src/app/api/cards/[id]/route.ts` | add | GET (detail with last4 only), PATCH (status transitions — stretch) |
| `src/app/cards/page.tsx` | add | Card list with issue button |
| `src/app/cards/[id]/page.tsx` | add | Card detail with spend vs limit |
| `src/app/cards/issue-drawer.tsx` | add | Form: nickname, merchant, limit, currency; success shows full PAN |
| `src/components/ui/cards/CardStatusBadge.tsx` | add | Badge for active/frozen/cancelled |
| `src/app/siteConfig.ts` | change | Add `cards: "/cards"` to baseLinks |
| `src/components/ui/navigation/AppSidebar.tsx` | change | Add Cards nav item |

## Plan

Core criteria in priority order — complete each before moving to the next:

### Core (do these first, in this order)

1. **Scaffolding** — Add `Card` type to `types.ts` (id, nickname, merchantId, last4, limit, spend, currency, status, createdAt), `CardStatus` type, `cards: []` to store. Add `generateCardNumber()` and `maskCardNumber()` to `src/lib/cards.ts`. Add sidebar nav and siteConfig entry. Done when: TypeScript compiles, `/cards` route exists (empty).

2. **Issue a card** — Add POST `/api/cards` with server-side validation (reject missing merchant, limit ≤ 0, limit > 5M, currency not in USD/EUR/GBP). Generate card number server-side with 4242 BIN + Luhn. Return full PAN in response. Add issue drawer with form (nickname, merchant, limit, currency). Done when: form submits, card created, full PAN shown once in success UI.

3. **Card list** — Add GET `/api/cards` returning cards with last4 only (never full number). Build `/cards/page.tsx` table: nickname, merchant, masked number (`•••• XXXX`), spend limit, status, created date. Done when: issued card appears in list with all columns.

4. **Card detail** — Add GET `/api/cards/[id]` returning card with last4 only. Build `/cards/[id]/page.tsx` showing full record and spend vs limit. Done when: clicking card opens detail with spend progress.

5. **Polish** — Add `CardStatusBadge` (active=green, frozen=amber, cancelled=gray). Add empty state for card list. Done when: badges render, empty list shows message.

### Stretch (only after core is complete)

6. **Freeze/unfreeze** — Add PATCH `/api/cards/[id]` for status transitions (active ↔ frozen, either → cancelled). Add buttons to list. Done when: status updates without page reload.

7. **Unit tests** — Add `src/lib/cards.test.ts` for Luhn generator and status transitions. Done when: `npm test` passes.

8. **Spend progress bar** — Add visual bar on card detail, amber when spend > 80% of limit.

9. **Empty and error states** — Written copy for empty list, form validation errors, API errors.

## Verification

### Core criteria

| Criterion | How it is proven |
| --- | --- |
| Issue a card (form with nickname, merchant, limit, currency) | Fill form, submit, card appears in list |
| Card list at `/cards` | Visual: nickname, merchant, `•••• XXXX`, limit, status, date columns |
| Card detail with spend vs limit | Click card → see full record, spend against limit shown |
| Generated numbers: 4242 BIN + valid Luhn | Manual: card number starts 4242; verify Luhn with online checker |
| Reveal once, mask forever | Full PAN only in success UI after create; list/detail show `•••• XXXX` only |
| Server-side validation | POST with missing merchant → 400; limit 0 → 400; limit > 5M → 400; currency "JPY" → 400 |

### Stretch criteria

| Criterion | How it is proven |
| --- | --- |
| Freeze/unfreeze without reload | Click freeze → status updates, no page refresh |
| Spend progress bar, amber > 80% | Card with high spend shows amber bar |
| Unit tests | `npm test` exits 0, covers Luhn + status transitions |
| Empty/error states | Empty list shows written message; form shows validation errors |

## Risks

- **Time pressure:** Core criteria are most of the score. Finish all 6 core items before touching stretch goals.
- **Storing full PAN:** Never store the full card number. Store only `last4` and use the card `id` as the reference. The full number exists only in the creation response, never in the database.

## Out of scope

- **Persistence** — cards vanish on server restart (NWP-203). No database, no ORM.
- **Editing limit after issue** — that is NWP-202
- **Auth/roles** — no permissions model
- **Real card network calls** — no issuer integration

## Open questions

None — the ticket and codebase are clear on requirements.
