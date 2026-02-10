"use client";

import { useEffect } from "react";
import Image from "next/image";
import { CountdownTimer } from "@/components/countdown-timer";
import { HeroSection } from "@/components/hero-section";
import { PricingSection } from "@/components/pricing-section";
import { AboutSection } from "@/components/about-section";
import { BenefitsSection } from "@/components/benefits-section";
import { ReviewsSection } from "@/components/reviews-section";
import { FAQSection } from "@/components/faq-section";
import { FooterSection } from "@/components/footer-section";
import { usePageViewTracking, usePreserveUTMParams } from "@/hooks/use-utm-tracking";
import { trackFacebookViewContent } from "@/lib/facebook/facebook-client";

import { Suspense } from "react";

function HomeContent() {
  // Preserve UTM params in URL
  usePreserveUTMParams();

  // Track page view
  usePageViewTracking("Landing Page");

  useEffect(() => {
    console.log("[UTMIFY] 🏠 Landing Page carregada");

    // Track Facebook ViewContent
    trackFacebookViewContent("Álbum Panini Copa 2026", 119.9, "BRL");
  }, []);
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-card shadow-sm">
      {/* Header - Panini Logo */}
      <header className="flex items-center justify-center bg-card px-4 py-4">
        <Image
          src="/images/logo-panini-256.png"
          alt="Panini Logo"
          width={150}
          height={54}
          style={{ width: "auto", height: "auto" }}
          priority
        />
      </header>

      {/* Countdown & Urgency */}
      <CountdownTimer />

      {/* CTA - Compra Unica */}
      <div className="px-4 py-3">
        <button
          type="button"
          className="w-full rounded-xl bg-[#f6b21a] px-6 py-3.5 text-sm font-extrabold uppercase tracking-wider text-black shadow-md transition-all hover:bg-[#dda017] active:scale-[0.98]"
        >
          {"COMPRA ÚNICA POR CPF"}
        </button>
      </div>

      {/* Hero Section */}
      <HeroSection />

      {/* Pricing */}
      <PricingSection />

      {/* About Album */}
      <AboutSection />

      {/* Benefits */}
      <BenefitsSection />

      {/* Reviews */}
      <ReviewsSection />

      {/* FAQ */}
      <FAQSection />

      {/* Footer */}
      <FooterSection />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
