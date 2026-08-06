import { useId } from 'react';
import type { Accent } from '@/Types/dashboard';
import { accentColour } from '@/Components/ui/accent';

interface TrendChartProps {
  points: number[];
  labels: string[];
  accent?: Accent;
  showValues?: boolean;
}

interface Point {
  x: number;
  y: number;
}

const WIDTH = 320;
const HEIGHT = 140;
const PAD_LEFT = 28;
const PAD_TOP = 22;
const PAD_BOTTOM = 12;
const PAD_RIGHT = 6;

const formatValue = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

// A single series drawn as a smooth curve over a soft gradient, with a labelled
// Y axis, light gridlines and an emphasised latest point. Hand built to avoid
// a charting dependency.
export function TrendChart({
  points,
  labels,
  accent = 'teal',
  showValues = true,
}: TrendChartProps) {
  const gradientId = useId();
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const max = Math.max(...points) * 1.08;
  const min = Math.min(...points) * 0.9;
  const span = max - min || 1;

  const coords: Point[] = points.map((value, index) => ({
    x: +(PAD_LEFT + (index / Math.max(1, points.length - 1)) * plotWidth).toFixed(2),
    y: +(PAD_TOP + (1 - (value - min) / span) * plotHeight).toFixed(2),
  }));

  const line = smoothPath(coords);
  const area = `${line} L ${WIDTH - PAD_RIGHT},${HEIGHT - PAD_BOTTOM} L ${PAD_LEFT},${HEIGHT - PAD_BOTTOM} Z`;
  const colour = accentColour[accent];
  const axisTicks = [0, 0.5, 1].map((t) => ({
    y: +(PAD_TOP + t * plotHeight).toFixed(1),
    value: max - t * span,
  }));

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
        {axisTicks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PAD_LEFT}
              y1={tick.y}
              x2={WIDTH - PAD_RIGHT}
              y2={tick.y}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={PAD_LEFT - 6}
              y={tick.y + 3.5}
              textAnchor="end"
              fontSize="10"
              fontWeight="600"
              fill="var(--text-muted)"
            >
              {formatValue(tick.value)}
            </text>
          </g>
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
          const anchor = index === 0 ? 'start' : isLast ? 'end' : 'middle';
          return (
            <g key={index}>
              {showValues && (
                <text
                  x={p.x}
                  y={p.y - 11}
                  textAnchor={anchor}
                  fontSize="11"
                  fontWeight="700"
                  fill={isLast ? colour : 'var(--text-soft)'}
                >
                  {formatValue(points[index])}
                </text>
              )}
              {isLast ? (
                <>
                  <circle cx={p.x} cy={p.y} r="8" fill={colour} fillOpacity="0.16" />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    fill={colour}
                    stroke="var(--surface)"
                    strokeWidth="2.5"
                  />
                </>
              ) : (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3.2"
                  fill="var(--surface)"
                  stroke={colour}
                  strokeWidth="2.25"
                />
              )}
              <title>{`${labels[index] ?? ''}: ${formatValue(points[index])}`}</title>
            </g>
          );
        })}
      </svg>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingLeft: PAD_LEFT,
          paddingRight: PAD_RIGHT,
        }}
      >
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
