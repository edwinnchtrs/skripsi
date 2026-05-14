import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Brain, FileText, FileUp, Settings, User, Users } from 'lucide-react';

const actions = [
  { title: 'Prediksi Individu', desc: 'Buka analisis responden', color: 'text-violet-200', bg: 'bg-violet-400/10', icon: User, path: '/prediksi' },
  { title: 'Data Responden', desc: 'Kelola dan beri terapi', color: 'text-cyan-200', bg: 'bg-cyan-400/10', icon: Users, path: '/responden' },
  { title: 'Laporan Lengkap', desc: 'Analisis dan export', color: 'text-emerald-200', bg: 'bg-emerald-400/10', icon: FileText, path: '/laporan' },
  { title: 'Pengaturan Sistem', desc: 'Atur threshold dan batas', color: 'text-amber-200', bg: 'bg-amber-400/10', icon: Settings, path: '/settings' },
];

export default function RightPanel({ data, loading }: { data: any; loading: boolean }) {
  const navigate = useNavigate();
  const highBurnout = data?.burnoutDist?.Tinggi ?? 0;
  const highPsycho = data?.psychoDist?.Tinggi ?? 0;
  const total = data?.totalRespondents ?? 0;
  const highTotal = highBurnout + highPsycho;

  const earlyWarnings = [
    { label: 'Risiko Burnout Tinggi', count: `${highBurnout} orang`, desc: 'Prioritas intervensi', color: 'rose' },
    { label: 'Risiko Psikosomatis Tinggi', count: `${highPsycho} orang`, desc: 'Butuh monitoring', color: 'amber' },
    { label: 'Total Sinyal Prioritas', count: `${highTotal} catatan`, desc: 'Gabungan indikator tinggi', color: 'cyan' },
  ];

  return (
    <aside className="flex flex-col gap-5">
      <section className="rounded-lg border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Bell className="h-4 w-4 text-rose-200" />
            Early Warning
          </div>
          <button onClick={() => navigate('/responden')} className="text-xs font-semibold text-cyan-200 transition hover:text-cyan-100">
            Lihat semua
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-800" />
            ))
          ) : (
            earlyWarnings.map((item) => {
              const tone = item.color === 'rose'
                ? 'border-rose-300/20 bg-rose-500/10 text-rose-100'
                : item.color === 'amber'
                  ? 'border-amber-300/20 bg-amber-500/10 text-amber-100'
                  : 'border-cyan-300/20 bg-cyan-500/10 text-cyan-100';

              return (
                <button
                  key={item.label}
                  onClick={() => navigate('/responden')}
                  className={`flex w-full gap-3 rounded-lg border p-3 text-left transition hover:brightness-110 ${tone}`}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <span className="block text-xs font-semibold text-slate-100">{item.label}</span>
                    <span className="mt-1 block text-lg font-semibold">{item.count}</span>
                    <span className="block text-xs text-slate-400">{item.desc}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <FileUp className="h-4 w-4 text-violet-200" />
          Quick Actions
        </div>
        <div className="mt-4 space-y-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-cyan-300/30 hover:bg-white/[0.07]"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${action.bg}`}>
                  <Icon className={`h-5 w-5 ${action.color}`} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-100">{action.title}</span>
                  <span className="block text-xs text-slate-500">{action.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
        <div className="text-sm font-semibold text-white">Ringkasan Kuisioner</div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-400">Total Partisipasi</span>
          <span className="font-semibold text-cyan-100">{loading ? '-' : total} User</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-cyan-300" style={{ width: total > 0 ? '100%' : '0%' }} />
        </div>
        <div className="mt-3 flex justify-between text-xs text-slate-500">
          <span>Rata-rata burnout: <span className="text-amber-100">{data?.avgBurnout ? data.avgBurnout.toFixed(1) : '-'}</span></span>
          <span>Target: {loading ? '-' : total}</span>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Brain className="h-4 w-4 text-emerald-200" />
          Informasi Model
        </div>
        <div className="mt-4 space-y-3">
          {[
            ['Algoritma Utama', 'Regresi Linier'],
            ['Pendekatan', 'Quantum Cognition + Regresi'],
            ['Terakhir Dilatih', 'Otomatis update'],
            ['Dataset', `${loading ? '-' : total} sampel`],
            ['Fitur Digunakan', '12 variabel'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <p className="mt-1 text-xs font-semibold text-slate-100">{value}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/model')}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-cyan-300 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          <Brain className="h-4 w-4" />
          Lihat Detail Model
        </button>
      </section>
    </aside>
  );
}
