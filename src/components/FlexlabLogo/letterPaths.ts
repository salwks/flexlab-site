export interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LetterDef {
  char: string;
  segments: LineSegment[];
}

// Each letter cell is ~90 wide, letters spaced at 100-unit intervals.
// Coordinates are absolute. Logo aspect ratio matches the original image.

const W = 80; // standard letter width
const GAP = 100; // letter start-to-start spacing
const H = 140; // letter height

const off = (i: number) => i * GAP;

export const letters: LetterDef[] = [
  {
    // F
    char: "F",
    segments: [
      { x1: off(0), y1: 0, x2: off(0), y2: H },         // vertical stem
      { x1: off(0), y1: 0, x2: off(0) + W, y2: 0 },      // top bar
      { x1: off(0), y1: H * 0.47, x2: off(0) + W * 0.7, y2: H * 0.47 }, // middle bar
    ],
  },
  {
    // L
    char: "L",
    segments: [
      { x1: off(1), y1: 0, x2: off(1), y2: H },          // vertical stem
      { x1: off(1), y1: H, x2: off(1) + W, y2: H },       // bottom bar
    ],
  },
  {
    // E
    char: "E",
    segments: [
      { x1: off(2), y1: 0, x2: off(2), y2: H },          // vertical stem
      { x1: off(2), y1: 0, x2: off(2) + W, y2: 0 },       // top bar
      { x1: off(2), y1: H * 0.47, x2: off(2) + W * 0.75, y2: H * 0.47 }, // middle bar
      { x1: off(2), y1: H, x2: off(2) + W, y2: H },       // bottom bar
    ],
  },
  {
    // X — diagonals
    char: "X",
    segments: [
      { x1: off(3), y1: 0, x2: off(3) + W, y2: H },      // top-left to bottom-right
      { x1: off(3) + W, y1: 0, x2: off(3), y2: H },       // top-right to bottom-left
    ],
  },
  {
    // L (second)
    char: "L",
    segments: [
      { x1: off(4), y1: 0, x2: off(4), y2: H },
      { x1: off(4), y1: H, x2: off(4) + W, y2: H },
    ],
  },
  {
    // A — peaked with crossbar
    char: "A",
    segments: [
      { x1: off(5) + 5, y1: H, x2: off(5) + W / 2, y2: 0 },    // left leg
      { x1: off(5) + W / 2, y1: 0, x2: off(5) + W - 5, y2: H }, // right leg
      { x1: off(5) + 15, y1: H * 0.6, x2: off(5) + W - 15, y2: H * 0.6 }, // crossbar
    ],
  },
  {
    // B — vertical stem + two bumps
    char: "B",
    segments: [
      { x1: off(6), y1: 0, x2: off(6), y2: H },              // vertical stem
      { x1: off(6), y1: 0, x2: off(6) + W * 0.75, y2: 0 },   // top bar
      { x1: off(6) + W * 0.75, y1: 0, x2: off(6) + W * 0.75, y2: H * 0.47 }, // top-right
      { x1: off(6), y1: H * 0.47, x2: off(6) + W * 0.8, y2: H * 0.47 },  // middle bar
      { x1: off(6) + W * 0.8, y1: H * 0.47, x2: off(6) + W * 0.8, y2: H }, // bottom-right
      { x1: off(6), y1: H, x2: off(6) + W * 0.8, y2: H },    // bottom bar
    ],
  },
];

export const LOGO_WIDTH = off(6) + W * 0.8; // rightmost point of B
export const LOGO_HEIGHT = H;

export const allSegments: LineSegment[] = letters.flatMap((l) => l.segments);
