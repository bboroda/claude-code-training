/**
 * Card number utilities.
 *
 * Generated numbers use the 4242 test BIN and a valid Luhn check digit.
 * The full number is returned exactly once (at creation) and never stored.
 */

const TEST_BIN = "4242"

/**
 * Calculate Luhn check digit for a partial card number.
 * The input should be the first 15 digits; this returns the 16th.
 */
function luhnCheckDigit(partial: string): string {
  const digits = partial.split("").map(Number).reverse()
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i]
    if (i % 2 === 0) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  const check = (10 - (sum % 10)) % 10
  return String(check)
}

/**
 * Validate a card number using Luhn algorithm.
 */
export function isValidLuhn(cardNumber: string): boolean {
  const digits = cardNumber.split("").map(Number).reverse()
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i]
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

/**
 * Generate a 16-digit card number starting with the 4242 test BIN.
 * Returns the full PAN — caller must ensure it's only shown once.
 */
export function generateCardNumber(): string {
  // 4242 + 11 random digits + 1 check digit = 16 digits
  let partial = TEST_BIN
  for (let i = 0; i < 11; i++) {
    partial += Math.floor(Math.random() * 10)
  }
  return partial + luhnCheckDigit(partial)
}

/**
 * Mask a card number for display. Only last 4 digits are shown.
 */
export function maskCardNumber(last4: string): string {
  return `•••• ${last4}`
}

/**
 * Extract the last 4 digits from a full card number.
 */
export function extractLast4(cardNumber: string): string {
  return cardNumber.slice(-4)
}
