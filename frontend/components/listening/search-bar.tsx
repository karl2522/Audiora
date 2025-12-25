"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="w-full flex-shrink-0">
      <div className="relative">
        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for songs, artists, albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 md:pl-11 lg:pl-12 pr-3 md:pr-4 h-10 md:h-11 lg:h-12 xl:h-14 rounded-lg md:rounded-xl lg:rounded-2xl bg-background border-border text-sm md:text-base lg:text-lg focus-visible:ring-0 focus-visible:outline-none"
        />
      </div>
    </div>
  )
}

