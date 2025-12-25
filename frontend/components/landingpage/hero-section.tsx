"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollAnimation } from "@/components/common/scroll-animation"
import { SignInModal } from "@/components/auth/sign-in-modal"
import { cn } from "@/lib/utils"

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

export function HeroSection() {
    const [isSignInOpen, setIsSignInOpen] = useState(false)
    const imageRef = useRef<HTMLDivElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Animate hero elements on page load
        const timer1 = setTimeout(() => {
            if (imageRef.current) {
                imageRef.current.classList.add("visible")
            }
        }, 200)

        const timer2 = setTimeout(() => {
            if (cardRef.current) {
                cardRef.current.classList.add("visible")
            }
        }, 400)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
        }
    }, [])

    return (
        <>
            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div className="space-y-4 md:space-y-6 text-left pt-16 md:pt-0">
                    <ScrollAnimation>
                        <Badge variant="outline" className="inline-flex items-center gap-2 px-2.5 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-medium tracking-widest uppercase">
                            Developed by Jared Omen
                        </Badge>
                    </ScrollAnimation>
                    <ScrollAnimation delay={0.1}>
                        <h1 className="text-4xl md:text-5xl lg:text-8xl font-light leading-[0.9] tracking-tighter text-pretty">
                            Music that <br />
                            <span className="font-normal italic">knows</span> you.
                        </h1>
                    </ScrollAnimation>
                    <ScrollAnimation delay={0.2}>
                        <p className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
                            A professional music player with AI-powered DJs and intelligent curation. Designed for clarity, built for discovery.
                        </p>
                    </ScrollAnimation>
                    <ScrollAnimation delay={0.3}>
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
                            <Button 
                                size="lg" 
                                onClick={() => window.location.href = '/listening'}
                                className="rounded-full px-6 py-3 md:px-8 md:py-4 text-sm md:text-base hover:scale-105 transition-transform cursor-pointer w-full sm:w-auto"
                            >
                                Start Listening <ArrowRight className="w-4 h-4" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="lg" 
                                onClick={() => setIsSignInOpen(true)}
                                className="rounded-full px-6 py-3 md:px-8 md:py-4 text-sm md:text-base hover:scale-105 transition-transform cursor-pointer w-full sm:w-auto"
                            >
                                Sign in to personalize
                            </Button>
                        </div>
                    </ScrollAnimation>
                </div>
                <div className="relative aspect-square hidden md:block">
                    <div 
                        ref={imageRef}
                        className="scroll-section absolute inset-0 bg-muted rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700"
                    >
                        <Image
                            src="/images/minimalist-abstract-music-waves.jpg"
                            alt="AI Sound waves"
                            width={600}
                            height={600}
                            className="w-full h-full object-cover opacity-80"
                            priority
                        />
                    </div>
                    <Card 
                        ref={cardRef}
                        className="scroll-section absolute -bottom-6 -left-6 p-6 shadow-xl"
                    >
                        <CardContent className="space-y-2 p-0">
                            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Currently Playing</p>
                            <p className="text-sm font-semibold tracking-tight">Ethereal Echoes</p>
                            <p className="text-xs text-muted-foreground">DJ Audiora • Deep House</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <SignInModal open={isSignInOpen} onOpenChange={setIsSignInOpen} />
        </>
    )
}
