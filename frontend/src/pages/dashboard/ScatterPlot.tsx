import { Activity, ScatterChart as ScatterIcon } from 'lucide-react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { tooltipStyle } from './styles';

export default function ScatterPlot({ data, loading }: { data: any[]; loading: boolean }) {
  const chartData = data && data.length > 0 ? data : [];

  return (
    <div className="h-full rounded-lg border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <ScatterIcon className="h-4 w-4 text-cyan-200" />
        Sebaran Risiko
      </div>
      <p className="mt-1 text-xs text-slate-500">Psikosomatis dibanding burnout</p>

      {loading ? (
        <div className="mt-4 flex h-[220px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-sm text-slate-400">
          Memuat data...
        </div>
      ) : chartData.length === 0 ? (
        <div className="mt-4 flex h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.03] text-center">
          <Activity className="h-8 w-8 text-slate-600" />
          <p className="mt-2 text-sm font-semibold text-slate-300">Belum ada data sebaran</p>
        </div>
      ) : (
        <div className="mt-4 h-[220px] min-h-[220px] min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height={220} minWidth={1} minHeight={1}>
            <ScatterChart margin={{ top: 8, right: 8, left: -18, bottom: 18 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.12)" />
              <XAxis
                dataKey="x"
                name="Skor Psikosomatis"
                type="number"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Psikosomatis', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
              />
              <YAxis
                dataKey="y"
                name="Burnout"
                type="number"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Burnout', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={chartData} fill="#67e8f9" opacity={0.72} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
