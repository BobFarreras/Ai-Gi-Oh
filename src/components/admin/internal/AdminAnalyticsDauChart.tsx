// src/components/admin/internal/AdminAnalyticsDauChart.tsx - Gráfico SVG de línea de usuarios activos diarios (DAU) de analytics.
import { IDauChartProps } from "@/components/admin/internal/admin-analytics-panel.types";

const WIDTH = 700;
const HEIGHT = 110;
const PADDING = { top: 10, right: 16, bottom: 20, left: 40 };

function buildPath(data: IDauChartProps["data"]): string {
  if (data.length === 0) return "";
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;
  return data
    .map((point, i) => {
      const x = PADDING.left + (i / Math.max(data.length - 1, 1)) * plotW;
      const y = PADDING.top + plotH - (point.count / maxCount) * plotH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildArea(data: IDauChartProps["data"]): string {
  if (data.length === 0) return "";
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;
  const bottom = PADDING.top + plotH;
  const points = data.map((point, i) => {
    const x = PADDING.left + (i / Math.max(data.length - 1, 1)) * plotW;
    const y = PADDING.top + plotH - (point.count / maxCount) * plotH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M${PADDING.left},${bottom} L${points.join(" L")} L${PADDING.left + plotW},${bottom} Z`;
}

export function AdminAnalyticsDauChart({ data }: IDauChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(maxCount * ratio));

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Usuarios Activos Diarios (DAU)</h3>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Gráfico de usuarios activos diarios">
        <defs>
          <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => {
          const y = PADDING.top + plotH - (tick / maxCount) * plotH;
          return (
            <g key={tick}>
              <line x1={PADDING.left} y1={y} x2={WIDTH - PADDING.right} y2={y} stroke="rgb(51,65,85)" strokeWidth="0.5" />
              <text x={PADDING.left - 6} y={y + 3} textAnchor="end" className="fill-slate-500" fontSize="9">{tick}</text>
            </g>
          );
        })}
        <path d={buildArea(data)} fill="url(#dauGrad)" />
        <path d={buildPath(data)} fill="none" stroke="rgb(34,211,238)" strokeWidth="2" strokeLinejoin="round" />
        {data.length <= 15 && data.map((point) => {
          const maxC = Math.max(...data.map((d) => d.count), 1);
          const plotWi = WIDTH - PADDING.left - PADDING.right;
          const idx = data.indexOf(point);
          const x = PADDING.left + (idx / Math.max(data.length - 1, 1)) * plotWi;
          const y = PADDING.top + plotH - (point.count / maxC) * plotH;
          return <circle key={point.date} cx={x} cy={y} r="3" className="fill-cyan-400" />;
        })}
        {data.length > 0 && (
          <>
            <text x={PADDING.left} y={HEIGHT - 4} className="fill-slate-500" fontSize="8">{data[0].date}</text>
            <text x={WIDTH - PADDING.right} y={HEIGHT - 4} textAnchor="end" className="fill-slate-500" fontSize="8">{data[data.length - 1].date}</text>
          </>
        )}
      </svg>
    </div>
  );
}
