import { AlertTriangle, BarChart2, Brain, Target, TrendingUp, Users } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  badge?: string;
  badgeClass?: string;
  icon: React.ElementType;
  colorClass: string;
  loading?: boolean;
}

function LoadingValue() {
  return <div className="mt-2 h-8 w-28 animate-pulse rounded-md bg-slate-800" />;
}

function StatCard({ label, value, sub, badge, badgeClass, icon: Icon, colorClass, loading }: StatCardProps) {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-lg border border-white/10 bg-slate-950 p-4 shadow-xl shadow-black/10">
      <div className={`absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full blur-2xl ${colorClass}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p>
          {loading ? <LoadingValue /> : <p className="mt-2 truncate text-2xl font-semibold text-white">{value}</p>}
          {!loading && sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
          {!loading && badge && (
            <span className={`mt-3 inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
          <Icon className="h-5 w-5 text-slate-100" />
        </div>
      </div>
    </div>
  );
}

export default function StatCards({ data, loading }: { data: any; loading: boolean }) {
  const totalResp = data?.totalRespondents ?? 0;
  const avgBurnout = data?.avgBurnout ? data.avgBurnout.toFixed(1) : '0';
  const highRisk = data?.highRiskCount ?? 0;
  const highRiskPct = totalResp > 0 ? ((highRisk / totalResp) * 100).toFixed(1) : '0';
  const totalPreds = data?.totalPredictions ?? 0;
  const burnoutLevel = Number(avgBurnout) > 66 ? 'Tinggi' : Number(avgBurnout) > 33 ? 'Sedang' : 'Rendah';
  const burnoutBadge = Number(avgBurnout) > 66
    ? 'bg-rose-500/15 text-rose-100 border border-rose-300/20'
    : Number(avgBurnout) > 33
      ? 'bg-amber-500/15 text-amber-100 border border-amber-300/20'
      : 'bg-emerald-500/15 text-emerald-100 border border-emerald-300/20';

  const cards = [
    {
      label: 'Total Responden',
      value: totalResp.toLocaleString('id-ID'),
      sub: 'User non-admin aktif',
      icon: Users,
      colorClass: 'bg-cyan-400/20',
    },
    {
      label: 'Rata-rata Burnout',
      value: `${avgBurnout} / 100`,
      badge: burnoutLevel,
      badgeClass: burnoutBadge,
      icon: Brain,
      colorClass: 'bg-amber-400/20',
    },
    {
      label: 'Risiko Tinggi',
      value: `${highRisk} (${highRiskPct}%)`,
      sub: 'Dari total responden',
      icon: AlertTriangle,
      colorClass: 'bg-rose-400/20',
    },
    {
      label: 'Akurasi Model',
      value: '92.7%',
      badge: 'Sangat Baik',
      badgeClass: 'bg-emerald-500/15 text-emerald-100 border border-emerald-300/20',
      icon: Target,
      colorClass: 'bg-emerald-400/20',
    },
    {
      label: 'Prediksi Dibuat',
      value: totalPreds.toLocaleString('id-ID'),
      sub: 'Total prediksi tersimpan',
      icon: BarChart2,
      colorClass: 'bg-violet-400/20',
    },
    {
      label: 'Status Operasional',
      value: loading ? '-' : 'Aktif',
      sub: 'Dashboard siap digunakan',
      icon: TrendingUp,
      colorClass: 'bg-sky-400/20',
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} loading={loading} />
      ))}
    </section>
  );
}
