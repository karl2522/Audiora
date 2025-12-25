"use client"

import { Mail, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollAnimation } from "@/components/common/scroll-animation"
import { cn } from "@/lib/utils"

export function ContactSection() {
    return (
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            <div className="space-y-6 md:space-y-8">
                <ScrollAnimation>
                    <h2 className="text-3xl md:text-4xl lg:text-6xl font-light tracking-tighter text-white">Get in touch.</h2>
                </ScrollAnimation>
                <ScrollAnimation delay={0.1}>
                    <p className="text-base md:text-lg text-white/80">
                        Have questions about Audiora? Our team is here to help you redefine your listening experience.
                    </p>
                </ScrollAnimation>
                <div className="space-y-4 md:space-y-6">
                    <ScrollAnimation delay={0.2}>
                        <div className="flex items-start gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-4 h-4 md:w-5 md:h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white mb-1">Email</p>
                                <a href="mailto:hello@audiora.ai" className="text-sm text-white/70 hover:text-white transition-colors break-all">
                                    hello@audiora.ai
                                </a>
                            </div>
                        </div>
                    </ScrollAnimation>
                    <ScrollAnimation delay={0.3}>
                        <div className="flex items-start gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                                <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white mb-1">Support</p>
                                <p className="text-sm text-white/70">Live chat available 24/7</p>
                            </div>
                        </div>
                    </ScrollAnimation>
                </div>
            </div>
            <ScrollAnimation delay={0.2}>
                <form className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-white/90 text-sm">
                                Name
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Your name"
                                className="h-11 md:h-12 px-4 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus-visible:ring-white/50 focus-visible:border-white/40 text-sm md:text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white/90 text-sm">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                className="h-11 md:h-12 px-4 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus-visible:ring-white/50 focus-visible:border-white/40 text-sm md:text-base"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message" className="text-white/90 text-sm">
                            Message
                        </Label>
                        <Textarea
                            id="message"
                            placeholder="Tell us what's on your mind..."
                            rows={5}
                            className="px-4 py-3 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl resize-none focus-visible:ring-white/50 focus-visible:border-white/40 text-sm md:text-base"
                        />
                    </div>
                    <Button 
                        type="submit" 
                        className="w-full h-11 md:h-12 rounded-xl font-medium bg-white text-black hover:bg-white/90 transition-all cursor-pointer text-sm md:text-base"
                    >
                        Send Message
                    </Button>
                </form>
            </ScrollAnimation>
        </div>
    )
}
