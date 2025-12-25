"use client"

import { BrainCircuit, Search, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollAnimation } from "@/components/common/scroll-animation"
import { cn } from "@/lib/utils"

export function SuggestionsSection() {
    return (
        <div className="max-w-6xl w-full space-y-10 md:space-y-16">
            <div className="text-center space-y-4 md:space-y-6 max-w-3xl mx-auto px-4">
                <ScrollAnimation>
                    <Badge variant="outline" className="inline-flex items-center gap-2 px-2.5 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-medium tracking-widest uppercase">
                        <Zap className="w-3 h-3" /> Smart Discovery
                    </Badge>
                </ScrollAnimation>
                <ScrollAnimation delay={0.1}>
                    <h2 className="text-3xl md:text-4xl lg:text-7xl font-light leading-[1.1] md:leading-[1] tracking-tighter">
                        Stop searching. <br />
                        Start <span className="italic">hearing</span>.
                    </h2>
                </ScrollAnimation>
                <ScrollAnimation delay={0.2}>
                    <p className="text-base md:text-lg text-muted-foreground">
                        Our algorithm doesn't just look at what you liked. It analyzes frequencies, timbre, and lyrical sentiment to
                        find your next favorite song.
                    </p>
                </ScrollAnimation>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                {[
                    {
                        title: "Predictive Queuing",
                        description: "Audiora anticipates what you want to hear next with 98% accuracy.",
                        icon: <BrainCircuit className="w-5 h-5 md:w-6 md:h-6" />,
                    },
                    {
                        title: "Context Awareness",
                        description: "Morning focus, gym intensity, or late-night study. We adapt.",
                        icon: <Search className="w-5 h-5 md:w-6 md:h-6" />,
                    },
                    {
                        title: "Visual Discovery",
                        description: "Explore music through a generative visual landscape.",
                        icon: <Zap className="w-5 h-5 md:w-6 md:h-6" />,
                    },
                ].map((feature, i) => (
                    <ScrollAnimation key={feature.title} delay={i * 0.1}>
                        <Card className="group p-6 md:p-8 rounded-2xl md:rounded-3xl hover:bg-muted transition-all cursor-default">
                            <CardContent className="p-0">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-foreground text-background flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h4 className="text-lg md:text-xl font-medium mb-2">{feature.title}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                            </CardContent>
                        </Card>
                    </ScrollAnimation>
                ))}
            </div>
        </div>
    )
}
