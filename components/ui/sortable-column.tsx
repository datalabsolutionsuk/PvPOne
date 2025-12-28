"use client"

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SortableColumnProps {
  title: string
  column: string
  prefix?: string
  className?: string
}

export function SortableColumn({ title, column, prefix = "", className }: SortableColumnProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const sortKey = prefix ? `${prefix}Sort` : "sort"
  const orderKey = prefix ? `${prefix}Order` : "order"

  const currentSort = searchParams.get(sortKey)
  const currentOrder = searchParams.get(orderKey)

  const isSorted = currentSort === column
  const isAsc = currentOrder === "asc"

  const toggleSort = () => {
    const params = new URLSearchParams(searchParams)
    
    // Reset page when sorting changes
    const pageKey = prefix ? `${prefix}Page` : "page"
    params.set(pageKey, "1")

    if (isSorted) {
      if (isAsc) {
        params.set(orderKey, "desc")
      } else {
        params.delete(sortKey)
        params.delete(orderKey)
      }
    } else {
      params.set(sortKey, column)
      params.set(orderKey, "asc")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSort}
      className={cn("-ml-3 h-8 data-[state=open]:bg-accent hover:bg-transparent hover:text-primary", className)}
    >
      <span>{title}</span>
      {isSorted ? (
        isAsc ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  )
}
