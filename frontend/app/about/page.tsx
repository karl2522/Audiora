import { Music2 } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b border-border">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Music2 className="w-6 h-6" />
                        <span className="text-xl font-medium tracking-tighter uppercase">Audiora</span>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight">About Audiora</h1>
                    <p className="text-xl text-muted-foreground">
                        The future of AI-powered music discovery
                    </p>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Our Mission</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Audiora is revolutionizing how people discover and experience music. We believe that music discovery should be intelligent, personalized, and effortless. Our AI-powered platform learns from your listening habits to create the perfect soundtrack for every moment.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">What We Do</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We've built a next-generation music platform that combines cutting-edge AI technology with a beautiful, intuitive interface. Our AI DJs—Nova, Veda, and Kai—each bring their own unique musical perspective, while our core Audiora DJ learns and adapts to your personal taste.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Our Technology</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Built with modern web technologies and powered by advanced AI models, Audiora analyzes your listening patterns, mood preferences, and contextual signals to generate perfectly curated playlists. We leverage decentralized music platforms to ensure artists are fairly compensated while giving you access to a vast library of music.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Free Forever</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We believe great music discovery should be accessible to everyone. That's why Audiora is free to use, with no hidden fees or premium tiers. Our mission is to democratize intelligent music curation.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">The Developer</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Audiora was built with passion by <span className="text-foreground font-semibold">Jared Omen</span>, a full-stack developer creating full-scale applications with modern web technologies, while exploring the exciting world of AI integrations.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            Interested in working together or want to see more of my projects? Visit my portfolio to learn more about my work and get in touch.
                        </p>
                        <a
                            href="https://jaredomen.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity underline font-medium"
                        >
                            Visit jaredomen.com →
                        </a>
                    </section>
                </div>

                {/* CTA */}
                <div className="pt-8 border-t border-border">
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-foreground text-background rounded-full hover:opacity-90 transition-opacity"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </main>
    )
}
