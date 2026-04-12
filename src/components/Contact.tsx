"use client";

import ScrollReveal from "./ScrollReveal";

export default function Contact() {
  return (
    <section id="contact" className="py-32 md:py-40">
      <div className="max-w-4xl mx-auto px-8">
        <ScrollReveal>
          <address className="not-italic text-3xl md:text-5xl lg:text-6xl font-light leading-snug text-foreground">
            서울특별시 강남구
            <br />
            테헤란로114길 38
            <br />
            동일타워 8층
          </address>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="mt-16 space-y-2 font-mono text-sm text-muted">
            <p>
              <a
                href="mailto:genoray@genoray.com"
                className="hover:text-[#2d4a8a] transition-colors"
              >
                genoray@genoray.com
              </a>
            </p>
            <p>
              <a
                href="tel:031-5178-5500"
                className="hover:text-[#2d4a8a] transition-colors"
              >
                031-5178-5500
              </a>
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="mt-16 space-y-2 text-sm text-muted/60">
            <p>본사 — 경기도 성남시 중원구 둔촌대로 80번길 3-15</p>
            <p>공장 — 경기도 성남시 중원구 둔촌대로 541번길 60</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
