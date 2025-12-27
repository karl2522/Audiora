"use client"

import { SignInModal } from "@/components/auth/sign-in-modal"
import { Button } from "@/components/ui/button"
import { Music2 } from "lucide-react"
import { useState } from "react"

const smoothScrollTo = (elementId: string) => {
    const element = document.getElementById(elementId)
    if (element) {
        const offset = 80 // Account for fixed navigation
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - offset

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        })
    }
}

export function Navigation() {
    const [isSignInOpen, setIsSignInOpen] = useState(false)

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 md:px-12 md:py-6 mix-blend-difference">
            <a
                href="#hero"
                onClick={(e) => {
                    e.preventDefault()
                    smoothScrollTo('hero')
                }}
                className="flex items-center gap-2 cursor-pointer"
            >
                <Music2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                <span className="text-lg md:text-xl font-medium tracking-tighter text-white uppercase">Audiora</span>
            </a>
            <div className="hidden md:flex items-center gap-8">
                <a
                    href="#ai-djs"
                    onClick={(e) => {
                        e.preventDefault()
                        smoothScrollTo('ai-djs')
                    }}
                    className="text-sm font-medium text-white hover:opacity-70 transition-opacity cursor-pointer"
                >
                    AI DJs
                </a>
                <a
                    href="#features"
                    onClick={(e) => {
                        e.preventDefault()
                        smoothScrollTo('features')
                    }}
                    className="text-sm font-medium text-white hover:opacity-70 transition-opacity cursor-pointer"
                >
                    Features
                </a>
                <a
                    href="#contact"
                    onClick={(e) => {
                        e.preventDefault()
                        smoothScrollTo('contact')
                    }}
                    className="text-sm font-medium text-white hover:opacity-70 transition-opacity cursor-pointer"
                >
                    Contact
                </a>
            </div>
            <Button
                onClick={() => setIsSignInOpen(true)}
                className="px-3 py-1.5 md:px-5 md:py-2 bg-white text-black rounded-full text-xs md:text-sm font-medium hover:bg-opacity-90 hover:scale-105 transition-all cursor-pointer"
            >
                Sign In
            </Button>
            <SignInModal open={isSignInOpen} onOpenChange={setIsSignInOpen} />
        </nav>
    )
}
