import { useId } from 'react';
import type { Accent } from '@/api/schemas/dashboard';
import { accentColour } from '@/components/ui/accent';

interface TrendChartProps {
  points: number[];
  labels: string[];
  accent?: Accent;
}

interface Point {
  x: number;
  y: number;
}

const WIDTH = 320;
const HEIGHT = 132;
const PAD_TOP = 16;
const PAD_BOTTOM = 12;

// A single series drawn as a smooth curve over a soft gradient, with light
// gridlines and an emphasised latest point. Hand built to match the design and
// avoid a charting dependency.
export function TrendChart({ points, labels, accent = 'teal' }: TrendChartProps) {
  const gradientId = useId();
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const max = Math.max(...points) * 1.08;
  const min = Math.min(...points) * 0.9;
  const span = max - min || 1;

  const coords: Point[] = points.map((value, index) => ({
    x: +((index / Math.max(1, points.length - 1)) * WIDTH).toFixed(2),
    y: +(PAD_TOP + (1 - (value - min) / span) * plotHeight).toFixed(2),
  }));

  const line = smoothPath(coords);
  const area = `${line} L ${WIDTH},${HEIGHT} L 0,${HEIGHT} Z`;
  const colour = accentColour[accent];
  const gridLines = [0, 0.5, 1].map((t) => +(PAD_TOP + t * plotHeight).toFixed(1));

  return (
    <>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colour} stopOpacity="0.24" />
            <stop offset="100%" stopColor={colour} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines.map((y) => (
          <line key={y} x1="0" y1={y} x2={WIDTH} y2={y} stroke="var(--border)" strokeWidth="1" />
        ))}
        <path d={area} fill={`url(#${gradientId})`} stroke="none" />
        <path
          d={line}
          fill="none"
          stroke={colour}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((p, index) => {
          const isLast = index === coords.length - 1;
          return isLast ? (
            <g key={index}>
              <circle cx={p.x} cy={p.y} r="8" fill={colour} fillOpacity="0.16" />
              <circle cx={p.x} cy={p.y} r="4.5" fill={colour} stroke="var(--surface)" strokeWidth="2.5" />
            </g>
          ) : (
            <circle key={index} cx={p.x} cy={p.y} r="3.2" fill="var(--surface)" stroke={colour} strokeWidth="2.25" />
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        {labels.map((label) => (
          <span key={label} style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {label}
          </span>
        ))}
      </div>
    </>
  );
}

// Catmull-Rom to cubic bezier, so the line reads as a natural curve rather than
// straight segments while still passing through every data point.
function smoothPath(pts: Point[]): string {
  if (pts.length < 2) return pts.length ? `M ${pts[0].x},${pts[0].y}` : '';
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x},${p2.y}`;
  }
  return d;
}
