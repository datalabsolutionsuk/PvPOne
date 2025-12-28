"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useCallback, useState, useEffect } from "react"

export function SearchInput({ placeholder, className }: { placeholder?: string, className?: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  
  // Local state for immediate input feedback
  const [value, setValue] = useState(searchParams.get('query') || '')

  // Sync with URL if it changes externally (e.g. back button)
  useEffect(() => {
    setValue(searchParams.get('query') || '')
  }, [searchParams])

  // Debounce logic
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      const currentQuery = params.get('query') || ''
      
      // Only update URL if the value is different from what's already in the URL
      if (value !== currentQuery) {
        params.set('page', '1')
        params.set('pendingPage', '1') // Reset pending page too for documents
        if (value) {
          params.set('query', value)
        } else {
          params.delete('query')
        }
        replace(`${pathname}?${params.toString()}`)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [value, searchParams, pathname, replace])

  return (
    <div className={`relative flex flex-1 flex-shrink-0 ${className}`}>
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        className="pl-9 w-full md:w-[300px]"
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        value={value}
      />
    </div>
  )
}
