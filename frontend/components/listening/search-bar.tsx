"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading?: boolean
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Debounce search to avoid too many API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (searchQuery.trim().length === 0) {
      onSearch("")
      return
    }

    debounceTimer.current = setTimeout(() => {
      onSearch(searchQuery.trim())
    }, 800) // 800ms debounce to reduce API calls

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchQuery, onSearch])

  return (
    <div className="w-full flex-shrink-0">
      <div className="relative">
        <Search className="absolute left-3 md:left-3.5 lg:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4 xl:w-5 xl:h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for songs, artists, albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isLoading}
          className="pl-9 md:pl-10 lg:pl-10 xl:pl-12 pr-3 md:pr-4 h-9 md:h-10 lg:h-10 xl:h-14 rounded-lg md:rounded-xl lg:rounded-2xl bg-background border-border text-sm md:text-sm lg:text-base xl:text-lg focus-visible:ring-0 focus-visible:outline-none disabled:opacity-50"
        />
      </div>
    </div>
  )
}

