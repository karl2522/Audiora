"use client"

import { HeroSection } from "@/components/landingpage/hero-section";
import { DjSection } from "@/components/landingpage/dj-section";
import { SuggestionsSection } from "@/components/landingpage/suggestions-section";
import { Navigation } from "@/components/landingpage/navigation";
import { ContactSection } from "@/components/landingpage/contact-section";
import { Footer } from "@/components/landingpage/footer";
import { ScrollAnimation } from "@/components/common/scroll-animation";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-y-auto scroll-smooth bg-background text-foreground">
      <Navigation />

      {/* Hero Section */}
      <section id="hero" className="w-full min-h-screen flex flex-col items-center justify-center px-4 md:px-6 lg:px-12 py-20 md:py-0 bg-pattern-grid-light scroll-mt-20">
        <HeroSection />
      </section>

      {/* AI DJ Section */}
      <section id="ai-djs" className="w-full min-h-screen flex flex-col items-center justify-center px-4 md:px-6 lg:px-12 py-20 md:py-0 bg-foreground text-background bg-pattern-grid-dark scroll-mt-20">
        <DjSection />
      </section>

      {/* Smart Suggestions Section */}
      <section id="features" className="w-full min-h-screen flex flex-col items-center justify-center px-4 md:px-6 lg:px-12 py-20 md:py-0 bg-pattern-grid-light scroll-mt-20">
        <SuggestionsSection />
      </section>

      {/* Contact Section */}
      <section id="contact" className="w-full min-h-screen flex flex-col items-center justify-center px-4 md:px-6 lg:px-12 py-20 md:py-0 bg-foreground text-background bg-pattern-grid-dark scroll-mt-20">
        <ContactSection />
      </section>

      {/* CTA Section */}
      <section id="cta" className="w-full min-h-screen flex flex-col items-center justify-center px-4 md:px-6 lg:px-12 py-20 md:py-0 bg-foreground text-background bg-pattern-grid-dark scroll-mt-20">
        <div className="max-w-4xl text-center space-y-6 md:space-y-8">
          <ScrollAnimation>
            <h2 className="text-3xl md:text-4xl lg:text-7xl font-light tracking-tight text-balance">Your music, re-imagined.</h2>
          </ScrollAnimation>
          <ScrollAnimation delay={0.1}>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of listening. Free forever, powered by intelligence.
            </p>
          </ScrollAnimation>
          <ScrollAnimation delay={0.2}>
            <button className="px-6 py-3 md:px-8 md:py-4 bg-background text-foreground rounded-full text-base md:text-lg hover:opacity-90 transition-opacity cursor-pointer">
              Download Desktop App
            </button>
          </ScrollAnimation>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
