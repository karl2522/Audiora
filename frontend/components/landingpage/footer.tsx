"use client"

import { Separator } from "@/components/ui/separator"
import { Music2 } from "lucide-react"

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

export function Footer() {
    return (
        <footer className="w-full py-12 border-t border-border">
            <div className="max-w-6xl mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="flex items-center gap-2">
                            <Music2 className="w-6 h-6" />
                            <span className="text-xl font-medium tracking-tighter uppercase">Audiora</span>
                        </div>
                        <p className="text-muted-foreground max-w-sm">
                            The professional standard for AI-powered music playback. Built for the next generation of listeners.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a
                                    href="#cta"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        smoothScrollTo('cta')
                                    }}
                                    className="hover:text-foreground transition-colors cursor-pointer"
                                >
                                    Desktop App
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#ai-djs"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        smoothScrollTo('ai-djs')
                                    }}
                                    className="hover:text-foreground transition-colors cursor-pointer"
                                >
                                    AI DJs
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#features"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        smoothScrollTo('features')
                                    }}
                                    className="hover:text-foreground transition-colors cursor-pointer"
                                >
                                    Features
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a href="#" className="hover:text-foreground transition-colors">
                                    About
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-foreground transition-colors">
                                    Privacy
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-foreground transition-colors">
                                    Terms
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <Separator className="mb-12" />
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground">© 2025 Audiora. All rights reserved.</p>
                    <p className="text-xs text-muted-foreground italic">Developed by Jared Omen</p>
                </div>
            </div>
        </footer>
    )
}
