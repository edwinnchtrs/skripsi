import { Gauge } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';
import { radarData } from './data';
import ChartShell from '../../components/ChartShell';

const metrics = [
  ['R2 Score', '0.872'],
  ['Akurasi', '92.7%'],
  ['MAE', '0.128'],
  ['RMSE', '0.176'],
  ['MAPE', '11.23%'],
  ['Status', 'Stabil'],
];

export default function ModelPerformance() {
  return (
    <div className="h-full rounded-lg border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Gauge className="h-4 w-4 text-emerald-200" />
        Performa Model
      </div>
      <p className="mt-1 text-xs text-slate-500">Perbandingan model saat ini dan sebelumnya</p>

      <ChartShell height={205} className="mt-4 overflow-hidden">
        <RadarChart data={radarData} margin={{ top: 12, right: 30, left: 30, bottom: 0 }}>
          <PolarGrid stroke="rgba(148, 163, 184, 0.16)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9 }} />
          <Radar name="Model Saat Ini" dataKey="A" stroke="#34d399" fill="#34d399" fillOpacity={0.32} />
          <Radar name="Model Sebelumnya" dataKey="B" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.12} strokeDasharray="4 2" />
        </RadarChart>
      </ChartShell>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 text-xs font-semibold text-slate-100">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
