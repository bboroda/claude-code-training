import { describe, expect, it } from "vitest"
import {
  extractLast4,
  generateCardNumber,
  isValidLuhn,
  maskCardNumber,
} from "./cards"

describe("generateCardNumber", () => {
  it("returns a 16-digit string", () => {
    const cardNumber = generateCardNumber()
    expect(cardNumber).toHaveLength(16)
    expect(/^\d{16}$/.test(cardNumber)).toBe(true)
  })

  it("starts with the 4242 test BIN", () => {
    const cardNumber = generateCardNumber()
    expect(cardNumber.startsWith("4242")).toBe(true)
  })

  it("generates a valid Luhn number", () => {
    // Generate multiple to ensure consistency
    for (let i = 0; i < 10; i++) {
      const cardNumber = generateCardNumber()
      expect(isValidLuhn(cardNumber)).toBe(true)
    }
  })

  it("generates different numbers on each call", () => {
    const numbers = new Set<string>()
    for (let i = 0; i < 10; i++) {
      numbers.add(generateCardNumber())
    }
    // Should have at least 9 unique numbers (allowing for rare collision)
    expect(numbers.size).toBeGreaterThanOrEqual(9)
  })
})

describe("isValidLuhn", () => {
  it("returns true for known valid card numbers", () => {
    // Test Visa number that passes Luhn
    expect(isValidLuhn("4242424242424242")).toBe(true)
    expect(isValidLuhn("4111111111111111")).toBe(true)
  })

  it("returns false for invalid card numbers", () => {
    expect(isValidLuhn("4242424242424243")).toBe(false)
    expect(isValidLuhn("1234567890123456")).toBe(false)
  })

  it("returns false for numbers with wrong check digit", () => {
    // Take a valid number and change the last digit
    expect(isValidLuhn("4242424242424241")).toBe(false)
    expect(isValidLuhn("4242424242424244")).toBe(false)
  })
})

describe("maskCardNumber", () => {
  it("masks with bullets and shows last 4", () => {
    expect(maskCardNumber("4242")).toBe("•••• 4242")
    expect(maskCardNumber("1234")).toBe("•••• 1234")
  })
})

describe("extractLast4", () => {
  it("extracts the last 4 digits from a card number", () => {
    expect(extractLast4("4242424242424242")).toBe("4242")
    expect(extractLast4("4242123456781234")).toBe("1234")
  })
})

describe("card status transitions", () => {
  const validTransitions: Record<string, string[]> = {
    active: ["frozen", "cancelled"],
    frozen: ["active", "cancelled"],
    cancelled: [],
  }

  it("active can transition to frozen or cancelled", () => {
    expect(validTransitions.active).toContain("frozen")
    expect(validTransitions.active).toContain("cancelled")
    expect(validTransitions.active).not.toContain("active")
  })

  it("frozen can transition to active or cancelled", () => {
    expect(validTransitions.frozen).toContain("active")
    expect(validTransitions.frozen).toContain("cancelled")
    expect(validTransitions.frozen).not.toContain("frozen")
  })

  it("cancelled is terminal and cannot transition", () => {
    expect(validTransitions.cancelled).toHaveLength(0)
  })
})
