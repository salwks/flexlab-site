"use client";

import ScrollReveal from "./ScrollReveal";

const values = [
  "스스로 결정하라.",
  "단호하게 실행하라.",
  "제대로 만들어라.",
];

export default function Careers() {
  return (
    <section id="careers" className="py-32 md:py-40">
      <div className="max-w-4xl mx-auto px-8">
        <ScrollReveal>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-light leading-tight text-foreground">
            함께 만들어갈
            <br />
            <span className="gradient-text-animated">동료</span>를 찾습니다.
          </h2>
        </ScrollReveal>

        <div className="mt-24 space-y-4">
          {values.map((v, i) => (
            <ScrollReveal key={v} delay={i * 0.15}>
              <p className="text-2xl md:text-4xl font-light text-foreground/80">
                {v}
              </p>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.3}>
          <div className="mt-24 text-sm text-muted space-y-2">
            <p>
              입사지원 → 서류전형 → 면접전형 → 최종합격
            </p>
            <p className="text-muted/60">약 3주 소요</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <div className="mt-16">
            <a
              href="https://www.saramin.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#2d4a8a] hover:underline underline-offset-4 transition-all"
            >
              지원하기
              <span className="text-lg">→</span>
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
