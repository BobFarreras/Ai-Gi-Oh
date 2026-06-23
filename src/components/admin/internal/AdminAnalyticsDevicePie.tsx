// src/components/admin/internal/AdminAnalyticsDevicePie.tsx - Gráfico SVG de pie/donut de distribución de dispositivos de analytics.
import { IDevicePieProps } from "@/components/admin/internal/admin-analytics-panel.types";

const SIZE = 160;
const CENTER = SIZE / 2;
const RADIUS = 56;
const STROKE_WIDTH = 28;

const PALETTE = [
  "rgb(34,211,238)",
  "rgb(59,130,246)",
  "rgb(168,85,247)",
  "rgb(249,115,22)",
  "rgb(34,197,94)",
  "rgb(236,72,153)",
];

interface ISlice {
  deviceType: string;
  color: string;
  dashArray: string;
  dashOffset: number;
  percent: string;
}

function buildSlices(data: IDevicePieProps["data"], circumference: number): ISlice[] {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  let accumulated = 0;
  return data.map((device, i) => {
    const ratio = device.count / total;
    const dashLength = ratio * circumference;
    const dashOffset = -accumulated * circumference;
    accumulated += ratio;
    return {
      deviceType: device.deviceType,
      color: PALETTE[i % PALETTE.length],
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset,
      percent: (ratio * 100).toFixed(1),
    };
  });
}

export function AdminAnalyticsDevicePie({ data }: IDevicePieProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Distribución de Dispositivos</h3>
        <p className="py-4 text-center text-xs text-slate-500">Sin datos disponibles.</p>
      </div>
    );
  }
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const circumference = 2 * Math.PI * RADIUS;
  const slices = buildSlices(data, circumference);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Distribución de Dispositivos</h3>
      <div className="flex items-center gap-4">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-40 w-40 shrink-0" role="img" aria-label="Gráfico de distribución de dispositivos">
          {slices.map((slice) => (
            <circle
              key={slice.deviceType}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={slice.dashArray}
              strokeDashoffset={slice.dashOffset}
              className="transition-all"
            />
          ))}
          <text x={CENTER} y={CENTER - 4} textAnchor="middle" className="fill-slate-200" fontSize="14" fontWeight="bold">{total}</text>
          <text x={CENTER} y={CENTER + 10} textAnchor="middle" className="fill-slate-500" fontSize="8">total</text>
        </svg>
        <div className="space-y-1.5 text-xs">
          {slices.map((slice) => (
            <div key={slice.deviceType} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="w-20 truncate text-slate-300">{slice.deviceType}</span>
              <span className="text-slate-500">{slice.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
