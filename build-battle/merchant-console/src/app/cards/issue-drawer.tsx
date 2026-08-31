"use client"

import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/Drawer"
import { Input } from "@/components/Input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { parseAmountToMinorUnits } from "@/lib/money"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface Merchant {
  id: string
  name: string
}

interface IssueDrawerProps {
  merchants: Merchant[]
}

const CURRENCIES = ["USD", "EUR", "GBP"] as const

export function IssueDrawer({ merchants }: IssueDrawerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [nickname, setNickname] = useState("")
  const [merchantId, setMerchantId] = useState("")
  const [limitInput, setLimitInput] = useState("")
  const [currency, setCurrency] = useState<string>("USD")

  // Success state - shows the full card number once
  const [createdCard, setCreatedCard] = useState<{
    cardNumber: string
    nickname: string
  } | null>(null)

  const resetForm = () => {
    setNickname("")
    setMerchantId("")
    setLimitInput("")
    setCurrency("USD")
    setError(null)
    setCreatedCard(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
      // Refresh the page to show new card
      if (createdCard) {
        router.refresh()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // Parse limit to minor units
    const limit = parseAmountToMinorUnits(limitInput)
    if (limit === null || limit <= 0) {
      setError("Please enter a valid spend limit")
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          merchantId,
          limit,
          currency,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Failed to create card")
        setIsSubmitting(false)
        return
      }

      // Show success with full card number
      setCreatedCard({
        cardNumber: data.cardNumber,
        nickname: data.card.nickname,
      })
    } catch {
      setError("Failed to create card")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="primary" className="w-full gap-2 py-1.5 sm:w-fit">
          <Plus className="-ml-0.5 size-4 shrink-0" aria-hidden="true" />
          Issue card
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {createdCard ? "Card Created" : "Issue Virtual Card"}
          </DrawerTitle>
        </DrawerHeader>

        {createdCard ? (
          // Success state - show full card number once
          <DrawerBody>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Card issued successfully
              </p>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                {createdCard.nickname}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                Card Number
              </p>
              <p className="mt-2 font-mono text-2xl tracking-wider text-gray-900 dark:text-gray-50">
                {createdCard.cardNumber.replace(/(.{4})/g, "$1 ").trim()}
              </p>
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                This is the only time the full card number will be shown.
                Copy it now.
              </p>
            </div>
          </DrawerBody>
        ) : (
          // Form state
          <form onSubmit={handleSubmit}>
            <DrawerBody className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="nickname"
                  className="block text-sm font-medium text-gray-900 dark:text-gray-50"
                >
                  Nickname
                </label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g., Ad Spend Card"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="merchant"
                  className="block text-sm font-medium text-gray-900 dark:text-gray-50"
                >
                  Merchant
                </label>
                <Select value={merchantId} onValueChange={setMerchantId}>
                  <SelectTrigger className="mt-1" id="merchant">
                    <SelectValue placeholder="Select merchant" />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  htmlFor="limit"
                  className="block text-sm font-medium text-gray-900 dark:text-gray-50"
                >
                  Spend Limit
                </label>
                <Input
                  id="limit"
                  type="text"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  placeholder="e.g., 5000.00"
                  className="mt-1"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum: 50,000.00
                </p>
              </div>

              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium text-gray-900 dark:text-gray-50"
                >
                  Currency
                </label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1" id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DrawerBody>

            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="secondary" type="button">
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmitting}
                disabled={!nickname || !merchantId || !limitInput}
              >
                Issue Card
              </Button>
            </DrawerFooter>
          </form>
        )}

        {createdCard && (
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="primary">Done</Button>
            </DrawerClose>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
