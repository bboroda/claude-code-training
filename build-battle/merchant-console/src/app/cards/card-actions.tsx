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

  const handleStatusChange = async (newStatus: CardStatus) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setCurrentStatus(newStatus)
        router.refresh()
      }
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
        onClick={() => handleStatusChange("cancelled")}
        isLoading={isLoading}
        disabled={isLoading}
      >
        Cancel
      </Button>
    </div>
  )
}
