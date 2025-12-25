import { Bot, Disc, Mic2, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function DjSection() {
    const djs = [
        { name: "Nova", style: "Deep House & Melodic", icon: <Disc className="w-5 h-5" /> },
        { name: "Veda", style: "Minimalist Techno", icon: <Sparkles className="w-5 h-5" /> },
        { name: "Kai", style: "Chillhop & Lo-fi", icon: <Mic2 className="w-5 h-5" /> },
    ]

    return (
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="relative order-2 md:order-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {djs.map((dj, i) => (
                        <Card
                            key={dj.name}
                            className={cn(
                                "p-4 md:p-8 rounded-2xl md:rounded-3xl border-white/20 bg-white/10 backdrop-blur-sm transition-all hover:bg-white/15",
                                i === 2 && "col-span-1 sm:col-span-2"
                            )}
                        >
                            <CardContent className="p-0">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center mb-3 md:mb-4 text-white">
                                    {dj.icon}
                                </div>
                                <h3 className="text-lg md:text-xl font-medium text-white">{dj.name}</h3>
                                <p className="text-xs md:text-sm text-white/70">{dj.style}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
            <div className="space-y-4 md:space-y-8 order-1 md:order-2">
                <Badge variant="outline" className="inline-flex items-center gap-2 px-2.5 py-1 md:px-3 md:py-1 rounded-full border-white/30 bg-white/10 text-white text-[10px] md:text-xs font-medium tracking-widest uppercase">
                    <Bot className="w-3 h-3" /> AI Personas
                </Badge>
                <h2 className="text-3xl md:text-4xl lg:text-7xl font-light leading-[1.1] md:leading-[1] tracking-tighter text-white">
                    Meet your new <br />
                    <span className="italic">personal</span> DJs.
                </h2>
                <p className="text-base md:text-lg text-white/80 max-w-md">
                    Unlike static playlists, our AI DJs speak, curate, and transition tracks based on your mood, time of day, and
                    listening history.
                </p>
                <ul className="space-y-3 md:space-y-4">
                    <li className="flex items-start gap-3 text-sm border-b border-white/20 pb-3 md:pb-4 text-white">
                        <span className="text-white font-mono font-semibold flex-shrink-0">01</span> 
                        <span>Seamless beat-matching transitions</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm border-b border-white/20 pb-3 md:pb-4 text-white">
                        <span className="text-white font-mono font-semibold flex-shrink-0">02</span> 
                        <span>Real-time commentary and song insights</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-white">
                        <span className="text-white font-mono font-semibold flex-shrink-0">03</span> 
                        <span>Adaptive energy levels that match your activity</span>
                    </li>
                </ul>
            </div>
        </div>
    )
}
