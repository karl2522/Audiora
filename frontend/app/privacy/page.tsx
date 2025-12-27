import { Music2 } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
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
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight">Privacy Policy</h1>
                    <p className="text-muted-foreground">
                        Last updated: December 28, 2024
                    </p>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            At Audiora, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our service.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Information We Collect</h2>
                        <div className="space-y-3">
                            <h3 className="text-xl font-medium">Account Information</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                When you sign in with Google OAuth, we collect your email address, name, and profile picture. We use this information solely for authentication and personalization purposes.
                            </p>

                            <h3 className="text-xl font-medium">Listening Data</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                We collect data about your listening habits, including tracks played, genres, artists, and playback duration. This data is used to improve our AI recommendations and personalize your experience.
                            </p>

                            <h3 className="text-xl font-medium">Usage Data</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                We collect anonymous usage statistics to improve our service, including feature usage, session duration, and error logs.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">How We Use Your Information</h2>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>To provide and improve our AI-powered music recommendations</li>
                            <li>To personalize your listening experience</li>
                            <li>To authenticate your account and maintain security</li>
                            <li>To analyze usage patterns and improve our service</li>
                            <li>To communicate important updates about the service</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Data Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We implement industry-standard security measures to protect your data:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>All data is encrypted in transit using HTTPS/TLS</li>
                            <li>Authentication tokens are stored in secure, httpOnly cookies</li>
                            <li>We use Redis-based rate limiting to prevent abuse</li>
                            <li>Regular security audits and updates</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Data Sharing</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We do not sell, trade, or rent your personal information to third parties. We may share anonymized, aggregated data for research and analytics purposes.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Your Rights</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You have the right to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>Access your personal data</li>
                            <li>Request deletion of your account and data</li>
                            <li>Export your listening history</li>
                            <li>Opt out of data collection (note: this may limit functionality)</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us through our website.
                        </p>
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
