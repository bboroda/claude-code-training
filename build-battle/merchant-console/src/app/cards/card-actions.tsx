"use client"

import { Button } from "@/components/Button"
import { CardStatus } from "@/data/types"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface CardActionsProps {
  cardId: string
  status: CardStatus
}

export function CardActions({ cardId, status }: CardActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(status)
  const [error, setError] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: CardStatus) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setCurrentStatus(newStatus)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.message || "Failed to update card status")
      }
    } catch {
      setError("Failed to update card status")
    } finally {
      setIsLoading(false)
    }
  }

  if (currentStatus === "cancelled") {
    return (
      <span className="text-sm text-gray-400">Cancelled</span>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
      )}
      <div className="flex gap-2">
      {currentStatus === "active" ? (
        <Button
          variant="secondary"
          className="py-1 text-xs"
          onClick={() => handleStatusChange("frozen")}
          isLoading={isLoading}
          disabled={isLoading}
        >
          Freeze
        </Button>
      ) : (
        <Button
          variant="secondary"
          className="py-1 text-xs"
          onClick={() => handleStatusChange("active")}
          isLoading={isLoading}
          disabled={isLoading}
        >
          Unfreeze
        </Button>
      )}
      <Button
        variant="destructive"
        className="py-1 text-xs"
        onClick={() => {
          if (window.confirm("Cancel this card? This action cannot be undone.")) {
            handleStatusChange("cancelled")
          }
        }}
        isLoading={isLoading}
        disabled={isLoading}
      >
        Cancel
      </Button>
      </div>
    </div>
  )
}
