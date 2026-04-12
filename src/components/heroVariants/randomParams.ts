// Procedural parameter generation — every visit is unique

const PALETTES = [
  { bg: "#ffffff", fg: "#2d4a8a", accent: "#2563eb", name: "default" },
  { bg: "#ffffff", fg: "#1a1a2e", accent: "#8b5cf6", name: "violet" },
  { bg: "#ffffff", fg: "#064e3b", accent: "#10b981", name: "emerald" },
  { bg: "#ffffff", fg: "#7c2d12", accent: "#ea580c", name: "amber" },
  { bg: "#ffffff", fg: "#1e1b4b", accent: "#6366f1", name: "indigo" },
  { bg: "#0a0a0a", fg: "#ffffff", accent: "#06b6d4", name: "dark-cyan" },
  { bg: "#0a0a0a", fg: "#e2e8f0", accent: "#f472b6", name: "dark-pink" },
  { bg: "#0a0a0a", fg: "#d4d4d8", accent: "#a3e635", name: "dark-lime" },
  { bg: "#faf8f5", fg: "#1a1a2e", accent: "#b45309", name: "warm" },
  { bg: "#f0fdf4", fg: "#14532d", accent: "#22c55e", name: "nature" },
];

export interface HeroParams {
  palette: (typeof PALETTES)[number];
  lineWidth: number;
  logoScale: number; // 0.6 ~ 0.85
  logoPosition: "center" | "left" | "right" | "top" | "bottom";
  springK: number;
  damping: number;
  mouseForce: number;
  particleCount: number;
  timeOfDay: "morning" | "day" | "evening" | "night";
}

function getTimeOfDay(): "morning" | "day" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateParams(): HeroParams {
  const timeOfDay = getTimeOfDay();

  // Bias palette selection by time of day
  let palette: (typeof PALETTES)[number];
  if (timeOfDay === "night" || timeOfDay === "evening") {
    // Prefer dark palettes at night
    const darkPalettes = PALETTES.filter((p) => p.bg === "#0a0a0a");
    palette = Math.random() < 0.7 ? pick(darkPalettes) : pick(PALETTES);
  } else if (timeOfDay === "morning") {
    // Prefer warm/nature tones in morning
    const warmPalettes = PALETTES.filter(
      (p) => p.name === "warm" || p.name === "nature" || p.name === "default",
    );
    palette = Math.random() < 0.6 ? pick(warmPalettes) : pick(PALETTES);
  } else {
    palette = pick(PALETTES);
  }

  const positions: HeroParams["logoPosition"][] = [
    "center", "center", "center", // weighted toward center
    "left", "right",
  ];

  return {
    palette,
    lineWidth: rand(2.5, 5),
    logoScale: rand(0.6, 0.85),
    logoPosition: pick(positions),
    springK: rand(0.06, 0.2),
    damping: rand(0.82, 0.93),
    mouseForce: rand(1.5, 4),
    particleCount: Math.round(rand(1500, 4000)),
    timeOfDay,
  };
}
