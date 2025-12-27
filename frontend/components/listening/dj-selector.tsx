"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { ChevronDown, Headphones, Loader2, Radio, Sparkles, Zap } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface DJSelectorProps {
  onGenerate: (djId: string) => void
  isGenerating: boolean
}

export function DJSelector({ onGenerate, isGenerating }: DJSelectorProps) {
  const { isAuthenticated } = useAuth()
  const [selectedDJ, setSelectedDJ] = useState<string>('audiora')

  const djs = [
    {
      id: 'audiora',
      name: 'Audiora DJ',
      description: 'Fully personalized based on your listening history',
      icon: Sparkles,
    },
    {
      id: 'nova',
      name: 'Nova',
      description: 'Deep House & Melodic',
      icon: Radio,
    },
    {
      id: 'veda',
      name: 'Veda',
      description: 'Minimalist Techno',
      icon: Zap,
    },
    {
      id: 'kai',
      name: 'Kai',
      description: 'Chillhop & Lo-fi',
      icon: Headphones,
    },
  ]

  const handleGenerateClick = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to generate playlists')
      return
    }

    if (!selectedDJ) {
      toast.error('Please select a DJ first')
      return
    }

    onGenerate(selectedDJ)
  }

  if (!isAuthenticated) {
    return null // Don't show DJ selector if not authenticated
  }

  // Initialize selectedDJ to first DJ if not set
  const currentSelectedDJ = selectedDJ || djs[0].id
  const selectedDJData = djs.find(d => d.id === currentSelectedDJ) || djs[0]
  const SelectedIcon = selectedDJData.icon
  const isGeneratingThis = isGenerating && selectedDJ === currentSelectedDJ

  return (
    <div className="w-full flex-shrink-0 flex gap-2 md:gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex-1 justify-between h-9 md:h-10 lg:h-12 xl:h-14 rounded-lg md:rounded-xl lg:rounded-2xl bg-background border-border text-sm md:text-sm lg:text-base xl:text-lg focus-visible:ring-0 focus-visible:outline-none hover:bg-background cursor-pointer"
          >
            <div className="flex items-center gap-2 md:gap-2.5 lg:gap-3">
              <SelectedIcon className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-foreground flex-shrink-0" />
              <span className="text-foreground">{selectedDJData.name}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-muted-foreground flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-lg md:rounded-xl lg:rounded-2xl bg-background border-border p-1"
        >
          {djs.map((dj, index) => {
            const Icon = dj.icon
            const isFirst = index === 0
            const isLast = index === djs.length - 1

            return (
              <DropdownMenuItem
                key={dj.id}
                className={cn(
                  "p-2 md:p-2 lg:p-3",
                  "focus:bg-muted hover:bg-muted",
                  "cursor-pointer transition-colors",
                  isFirst && "rounded-t-lg md:rounded-t-xl lg:rounded-t-2xl",
                  isLast && "rounded-b-lg md:rounded-b-xl lg:rounded-b-2xl",
                  !isFirst && !isLast && "rounded-none"
                )}
                onSelect={(e) => {
                  e.preventDefault()
                  setSelectedDJ(dj.id)
                }}
              >
                <div className="flex items-center gap-2 md:gap-3 w-full">
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-foreground flex-shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-xs md:text-xs lg:text-sm font-medium text-foreground truncate">
                      {dj.name}
                    </div>
                    <div className="text-[10px] md:text-[10px] lg:text-xs text-muted-foreground truncate">
                      {dj.description}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        onClick={handleGenerateClick}
        disabled={isGenerating}
        className="h-9 md:h-10 lg:h-12 xl:h-14 min-w-[100px] md:min-w-[120px] rounded-lg md:rounded-xl lg:rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:shadow-lg text-sm md:text-sm lg:text-base xl:text-lg px-3 md:px-4 lg:px-6 flex-shrink-0 cursor-pointer"
      >
        {isGeneratingThis ? (
          <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 animate-spin" />
        ) : (
          'Generate'
        )}
      </Button>
    </div>
  )
}

