"use client";

import ScrollReveal from "./ScrollReveal";

const technologies = [
  { num: "01", name: "MAF", detail: "Modality Application Framework" },
  { num: "02", name: "Image Processing", detail: "X선 영상 시스템 및 영상 처리 알고리즘" },
  { num: "03", name: "3D Modeling", detail: "CBCT 데이터 기반 3차원 재구성 엔진" },
  { num: "04", name: "AI / ML", detail: "딥러닝 기반 영상 진단 보조 시스템" },
  { num: "05", name: "Viewer UI", detail: "의료 영상 뷰어 인터페이스" },
  { num: "06", name: "PACS Proxy", detail: "영상 저장 전송 시스템 연동" },
  { num: "07", name: "Viewer Engine", detail: "고성능 영상 렌더링 엔진" },
  { num: "08", name: "Dental SW", detail: "치과 영상 관리 소프트웨어" },
];

const products = [
  { label: "SiMD", items: "C-Arm, Mammo, Dental CBCT, Portable" },
  { label: "SaMD", items: "진단 보조 AI, Ceph Analysis, Surgical Guide" },
  { label: "서비스", items: "병원 · 환자 · 영상 관리" },
];

export default function RnD() {
  return (
    <section id="rnd" className="py-32 md:py-40">
      <div className="max-w-4xl mx-auto px-8">
        <ScrollReveal>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-light text-foreground">
            우리가 만드는 <span className="gradient-text-animated">기술</span>
          </h2>
        </ScrollReveal>

        <div className="mt-24 space-y-12">
          {technologies.map((tech, i) => (
            <ScrollReveal key={tech.num} delay={i * 0.05}>
              <div className="group flex items-baseline gap-6 py-4 border-b border-border/50 hover:border-[#2d4a8a]/30 transition-colors">
                <span className="font-mono text-sm text-muted/50 shrink-0">
                  {tech.num}
                </span>
                <div>
                  <span className="text-xl md:text-2xl font-light text-foreground group-hover:text-[#2d4a8a] transition-colors">
                    {tech.name}
                  </span>
                  <p className="mt-1 text-sm text-muted">{tech.detail}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.2}>
          <div className="mt-32" id="products">
            <h3 className="text-2xl md:text-3xl font-light text-foreground mb-12">
              Products
            </h3>
            <div className="space-y-6">
              {products.map((p) => (
                <div key={p.label} className="flex items-baseline gap-4">
                  <span className="text-sm font-mono text-[#2d4a8a] shrink-0 w-12">
                    {p.label}
                  </span>
                  <span className="text-muted">—</span>
                  <span className="text-muted">{p.items}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
