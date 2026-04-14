import { LOGO_WIDTH, LOGO_HEIGHT } from "../FlexlabLogo/letterPaths";

// Shared logo layout constants — single source of truth
const LOGO_MAX_WIDTH_RATIO = 0.75; // logo uses at most 75% of viewport width
const LOGO_MAX_HEIGHT_RATIO = 0.25; // logo uses at most 25% of viewport height
const LOGO_Y_OFFSET_RATIO = 0.05; // shift up by 5% of viewport height (header compensation)

export interface LogoLayout {
  scale: number;
  ox: number;
  oy: number;
  logoW: number;
  logoH: number;
}

export function computeLogoLayout(viewportW: number, viewportH: number): LogoLayout {
  const maxW = viewportW * LOGO_MAX_WIDTH_RATIO;
  const maxH = viewportH * LOGO_MAX_HEIGHT_RATIO;
  const scale = Math.min(maxW / LOGO_WIDTH, maxH / LOGO_HEIGHT);
  const logoW = LOGO_WIDTH * scale;
  const logoH = LOGO_HEIGHT * scale;
  const ox = (viewportW - logoW) / 2;
  const oy = (viewportH - logoH) / 2 - viewportH * LOGO_Y_OFFSET_RATIO;

  return { scale, ox, oy, logoW, logoH };
}
