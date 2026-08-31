import { CardStatus } from "@/data/types"

const colors: Record<CardStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  frozen: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

export function CardStatusBadge({ status }: { status: CardStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[status]}`}
    >
      {status}
    </span>
  )
}
