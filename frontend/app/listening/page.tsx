"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MusicPlayer } from "@/components/listening/music-player"
import { SearchBar } from "@/components/listening/search-bar"
import { SuggestionsPanel } from "@/components/listening/suggestions-panel"
import { useRouter } from "next/navigation"

export default function ListeningPage() {
  const router = useRouter()

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground bg-pattern-grid-light">
      {/* Back Button */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 lg:top-8 lg:left-12 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background hover:scale-105 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
      </div>
      
      <div className="w-full h-screen flex flex-col pt-12 md:pt-16 lg:pt-20 px-3 md:px-4 lg:px-6 xl:px-12 pb-3 md:pb-4 lg:pb-8">
        <div className="max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-6 xl:gap-8 min-h-0 overflow-hidden">
          {/* Left Side - Music Player */}
          <div className="flex flex-col gap-2 md:gap-3 lg:gap-4 xl:gap-6 min-h-0 overflow-hidden">
            <SearchBar />
            <div className="flex-1 min-h-0 overflow-hidden">
              <MusicPlayer />
            </div>
          </div>

          {/* Right Side - Suggestions */}
          <div className="flex flex-col gap-2 md:gap-3 lg:gap-4 xl:gap-6 min-h-0 overflow-hidden">
            <SuggestionsPanel />
          </div>
        </div>
      </div>
    </main>
  )
}

