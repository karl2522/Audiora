import { Music2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Navigation() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 md:px-12 md:py-6 mix-blend-difference">
            <div className="flex items-center gap-2">
                <Music2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                <span className="text-lg md:text-xl font-medium tracking-tighter text-white uppercase">Audiora</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
                <a href="#" className="text-sm font-medium text-white hover:opacity-70 transition-opacity">
                    Features
                </a>
                <a href="#" className="text-sm font-medium text-white hover:opacity-70 transition-opacity">
                    AI DJs
                </a>
                <a href="#" className="text-sm font-medium text-white hover:opacity-70 transition-opacity">
                    About
                </a>
            </div>
            <Button className="px-3 py-1.5 md:px-5 md:py-2 bg-white text-black rounded-full text-xs md:text-sm font-medium hover:bg-opacity-90 transition-all">
                Try Now
            </Button>
        </nav>
    )
}
