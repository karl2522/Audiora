import { Music2 } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
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
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight">Terms of Service</h1>
                    <p className="text-muted-foreground">
                        Last updated: December 28, 2024
                    </p>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing and using Audiora, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our service.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Use of Service</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Audiora is a free music discovery platform powered by AI. You may use our service for personal, non-commercial purposes only.
                        </p>
                        <div className="space-y-3">
                            <h3 className="text-xl font-medium">You agree to:</h3>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>Provide accurate account information</li>
                                <li>Maintain the security of your account</li>
                                <li>Use the service in compliance with all applicable laws</li>
                                <li>Not attempt to circumvent security measures</li>
                                <li>Not abuse or overload our systems</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Intellectual Property</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Audiora platform, including its design, code, and AI models, is owned by Audiora and protected by copyright and other intellectual property laws. Music content is sourced from decentralized platforms and is subject to their respective licenses.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">User Content</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Your listening history and preferences are stored to provide personalized recommendations. You retain ownership of your data and can request deletion at any time.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Disclaimer of Warranties</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Audiora is provided "as is" without any warranties, express or implied. We do not guarantee uninterrupted or error-free service. We are not responsible for the availability or content of third-party music sources.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Audiora shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Account Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to suspend or terminate accounts that violate these terms or engage in abusive behavior. You may delete your account at any time through your account settings.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Changes to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms. We will notify users of significant changes via email or in-app notification.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Governing Law</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-medium">Contact</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            For questions about these Terms of Service, please contact us through our website.
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
