import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FLEXLAB | Genoray Software Laboratory",
  description:
    "제노레이의 소프트웨어 전문 연구소 FLEXLAB. 의료 영상 AI, 디지털 진단 소프트웨어의 미래를 만듭니다.",
  keywords:
    "FLEXLAB, 제노레이, GENORAY, 의료기기 소프트웨어, SaMD, SiMD, 의료 AI, 디지털 헬스케어",
  openGraph: {
    title: "FLEXLAB | Genoray Software Laboratory",
    description:
      "제노레이의 소프트웨어 전문 연구소. 의료 영상 AI, 디지털 진단 소프트웨어의 미래를 만듭니다.",
    url: "https://flexlab.genoray.com",
    siteName: "FLEXLAB",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
