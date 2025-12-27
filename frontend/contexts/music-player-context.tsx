"use client"

import { createContext, useContext, ReactNode } from "react"
import { useMusicPlayer, UseMusicPlayerReturn } from "@/hooks/use-music-player"

const MusicPlayerContext = createContext<UseMusicPlayerReturn | undefined>(undefined)

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const player = useMusicPlayer()

  return (
    <MusicPlayerContext.Provider value={player}>
      {children}
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayerContext() {
  const context = useContext(MusicPlayerContext)
  if (context === undefined) {
    throw new Error("useMusicPlayerContext must be used within a MusicPlayerProvider")
  }
  return context
}


