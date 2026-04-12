"use client";

import ScrollReveal from "./ScrollReveal";

export default function About() {
  return (
    <section id="about" className="min-h-screen flex items-center py-32 md:py-40">
      <div className="max-w-4xl mx-auto px-8">
        <ScrollReveal>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-light leading-tight text-foreground">
            FLEXLAB은
            <br />
            제노레이의 소프트웨어
            <br />
            <span className="gradient-text-animated">연구소</span>입니다.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="mt-16 text-lg md:text-xl text-muted leading-relaxed max-w-2xl">
            의료 영상의 획득부터 AI 진단까지,
            <br />
            환자 치료의 전체 과정을 소프트웨어로 설계합니다.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
