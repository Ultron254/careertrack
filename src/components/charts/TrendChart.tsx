import type { Accent } from '@/api/schemas/dashboard';
import { accentColour } from '@/components/ui/accent';

interface TrendChartProps {
  points: number[];
  labels: string[];
  accent?: Accent;
}

const WIDTH = 320;
const HEIGHT = 120;

// A single series line with a soft fill underneath and marker dots, scaled so
// the line breathes inside the box rather than touching the edges.
export function TrendChart({ points, labels, accent = 'teal' }: TrendChartProps) {
  const max = Math.max(...points) * 1.15;
  const min = Math.min(...points) * 0.85;
  const span = max - min || 1;

  const coords = points.map((value, index) => ({
    x: +((index / Math.max(1, points.length - 1)) * WIDTH).toFixed(1),
    y: +(HEIGHT - ((value - min) / span) * HEIGHT).toFixed(1),
  }));

  const line = coords.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `0,${HEIGHT} ${line} ${WIDTH},${HEIGHT}`;
  const colour = accentColour[accent];

  return (
    <>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }} role="img" aria-hidden="true">
        <polyline points={area} fill={colour} fillOpacity={0.12} stroke="none" />
        <polyline points={line} fill="none" stroke={colour} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((p, index) => (
          <circle key={index} cx={p.x} cy={p.y} r={4} fill="var(--surface)" stroke={colour} strokeWidth={2.5} />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        {labels.map((label) => (
          <span key={label} style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {label}
          </span>
        ))}
      </div>
    </>
  );
}
