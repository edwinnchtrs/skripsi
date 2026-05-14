import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import { Activity, CircleDot } from 'lucide-react';
import { tooltipStyle } from './styles';
import ChartShell from '../../components/ChartShell';

function DonutCard({
  title,
  data,
  total,
  loading,
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
  total: number;
  loading?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <CircleDot className="h-4 w-4 text-emerald-200" />
        {title}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center">
        <div className="relative h-[170px] min-h-[170px] min-w-0 overflow-hidden">
          {loading ? (
            <div className="h-full w-full animate-pulse rounded-full bg-slate-800" />
          ) : total === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-full border border-dashed border-white/10 text-center">
              <Activity className="h-7 w-7 text-slate-600" />
              <p className="mt-2 text-xs text-slate-500">Belum ada data</p>
            </div>
          ) : (
            <ChartShell height={170}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={74} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                  {data.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ChartShell>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-white">{loading ? '-' : total.toLocaleString('id-ID')}</span>
            <span className="text-xs text-slate-500">Total</span>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-8 animate-pulse rounded-md bg-slate-800" />
            ))
          ) : (
            data.map((item) => {
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
              return (
                <div key={item.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-semibold text-white">{item.value} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function DonutCharts({ data, loading }: { data: any; loading: boolean }) {
  const total = data?.totalRespondents ?? 0;
  const bRendah = data?.burnoutDist?.Rendah ?? 0;
  const bSedang = data?.burnoutDist?.Sedang ?? 0;
  const bTinggi = data?.burnoutDist?.Tinggi ?? 0;
  const totalB = bRendah + bSedang + bTinggi;
  const pRendah = data?.psychoDist?.Rendah ?? 0;
  const pSedang = data?.psychoDist?.Sedang ?? 0;
  const pTinggi = data?.psychoDist?.Tinggi ?? 0;
  const totalP = pRendah + pSedang + pTinggi;

  const burnoutDist = [
    { name: 'Rendah', value: bRendah, color: '#34d399' },
    { name: 'Sedang', value: bSedang, color: '#fbbf24' },
    { name: 'Tinggi', value: bTinggi, color: '#fb7185' },
  ];

  const psychoDist = [
    { name: 'Rendah', value: pRendah, color: '#34d399' },
    { name: 'Sedang', value: pSedang, color: '#fbbf24' },
    { name: 'Tinggi', value: pTinggi, color: '#fb7185' },
  ];

  return (
    <div className="grid h-full gap-5 2xl:grid-cols-2">
      <DonutCard title="Distribusi Burnout" data={burnoutDist} total={totalB || total} loading={loading} />
      <DonutCard title="Distribusi Psikosomatis" data={psychoDist} total={totalP || total} loading={loading} />
    </div>
  );
}
