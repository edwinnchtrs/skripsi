import { cloneElement, type ReactElement, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Filter,
  Layers,
  Lightbulb,
  Percent,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

interface Rule {
  id: number;
  antecedent: string;
  consequent: string;
  confidence: number;
  support: number;
  lift: number;
  conviction: number;
  category: string;
  status: 'active' | 'inactive' | 'review';
  impact: 'high' | 'medium' | 'low';
}

const rulesData: Rule[] = [
  { id: 1, antecedent: 'Beban Kerja Tinggi & Kualitas Tidur Rendah', consequent: 'Burnout Tinggi', confidence: 0.92, support: 0.38, lift: 2.85, conviction: 3.2, category: 'Burnout', status: 'active', impact: 'high' },
  { id: 2, antecedent: 'Stres Kronis & Dukungan Sosial Rendah', consequent: 'Risiko Psikosomatis Tinggi', confidence: 0.88, support: 0.32, lift: 2.64, conviction: 2.9, category: 'Psikosomatis', status: 'active', impact: 'high' },
  { id: 3, antecedent: 'Jam Kerja > 50 jam & Istirahat < 6 jam', consequent: 'Burnout Sedang-Tinggi', confidence: 0.85, support: 0.41, lift: 2.31, conviction: 2.5, category: 'Burnout', status: 'active', impact: 'high' },
  { id: 4, antecedent: 'Kepuasan Hidup Rendah & Aktivitas Fisik Rendah', consequent: 'Burnout Sedang', confidence: 0.81, support: 0.29, lift: 2.18, conviction: 2.1, category: 'Burnout', status: 'active', impact: 'medium' },
  { id: 5, antecedent: 'Ketidakpastian Pekerjaan & Konflik Peran', consequent: 'Stres Tinggi', confidence: 0.79, support: 0.35, lift: 2.05, conviction: 1.9, category: 'Stres', status: 'active', impact: 'medium' },
  { id: 6, antecedent: 'Mahasiswa Semester Akhir & Tugas Menumpuk', consequent: 'Burnout Tinggi', confidence: 0.87, support: 0.44, lift: 2.72, conviction: 3.0, category: 'Burnout', status: 'active', impact: 'high' },
  { id: 7, antecedent: 'Lingkungan Kerja Toksik & Feedback Negatif', consequent: 'Turnover Intention', confidence: 0.76, support: 0.25, lift: 2.42, conviction: 2.2, category: 'Organisasi', status: 'review', impact: 'medium' },
  { id: 8, antecedent: 'Kualitas Tidur Rendah & Pola Makan Buruk', consequent: 'Gangguan Psikosomatis', confidence: 0.83, support: 0.31, lift: 2.55, conviction: 2.7, category: 'Psikosomatis', status: 'active', impact: 'high' },
  { id: 9, antecedent: 'Dukungan Sosial Tinggi & Olahraga Teratur', consequent: 'Burnout Rendah', confidence: 0.91, support: 0.42, lift: 2.78, conviction: 3.1, category: 'Protektif', status: 'active', impact: 'high' },
  { id: 10, antecedent: 'Mindfulness Rutin & Work-Life Balance', consequent: 'Stres Rendah', confidence: 0.86, support: 0.36, lift: 2.48, conviction: 2.4, category: 'Protektif', status: 'active', impact: 'medium' },
  { id: 11, antecedent: 'Deadline Ketat & Multitasking Berlebih', consequent: 'Burnout Sedang', confidence: 0.73, support: 0.47, lift: 1.89, conviction: 1.6, category: 'Burnout', status: 'active', impact: 'medium' },
  { id: 12, antecedent: 'Perfeksionisme & Self-Criticism Tinggi', consequent: 'Anxiety & Burnout', confidence: 0.82, support: 0.28, lift: 2.35, conviction: 2.3, category: 'Psikologis', status: 'review', impact: 'low' },
];

const categoryColors: Record<string, string> = {
  Burnout: '#fb7185',
  Psikosomatis: '#fbbf24',
  Protektif: '#34d399',
  Stres: '#38bdf8',
  Organisasi: '#a78bfa',
  Psikologis: '#f472b6',
};

const chartTooltipStyle = {
  background: '#0f172a',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  borderRadius: 12,
  color: '#e2e8f0',
  boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
};

const impactMeta = {
  high: { label: 'Tinggi', className: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200', dot: 'bg-emerald-300' },
  medium: { label: 'Sedang', className: 'border-amber-300/25 bg-amber-400/10 text-amber-200', dot: 'bg-amber-300' },
  low: { label: 'Rendah', className: 'border-rose-300/25 bg-rose-400/10 text-rose-200', dot: 'bg-rose-300' },
};

const statusMeta = {
  active: { label: 'Aktif', className: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' },
  inactive: { label: 'Nonaktif', className: 'border-slate-400/20 bg-slate-400/10 text-slate-300' },
  review: { label: 'Review', className: 'border-amber-300/25 bg-amber-400/10 text-amber-200' },
};

type SortKey = 'lift' | 'confidence' | 'support';

function pct(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/10 ${className}`}>
      {children}
    </section>
  );
}

function ChartShell({ height, children }: { height: number; children: ReactElement }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const update = () => setWidth(Math.max(1, Math.floor(ref.current?.getBoundingClientRect().width || 0)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-w-0" style={{ height }}>
      {width > 1 ? (
        cloneElement(children, { width, height })
      ) : (
        <div className="h-full w-full animate-pulse rounded-xl bg-slate-800/30" />
      )}
    </div>
  );
}

export default function AnalitikRules() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('lift');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const categories = useMemo(() => ['all', ...new Set(rulesData.map((rule) => rule.category))], []);

  const categoryDist = useMemo(() => {
    return categories
      .filter((category) => category !== 'all')
      .map((category) => ({
        name: category,
        value: rulesData.filter((rule) => rule.category === category).length,
        color: categoryColors[category] || '#94a3b8',
      }));
  }, [categories]);

  const scatterRuleData = useMemo(
    () => rulesData.map((rule) => ({
      x: rule.support,
      y: rule.confidence,
      z: rule.lift * 32,
      name: rule.antecedent.length > 34 ? `${rule.antecedent.slice(0, 34)}...` : rule.antecedent,
      lift: rule.lift,
    })),
    [],
  );

  const importanceData = useMemo(
    () => [...rulesData]
      .sort((a, b) => b.lift - a.lift)
      .slice(0, 8)
      .map((rule) => ({
        name: rule.antecedent.length > 34 ? `${rule.antecedent.slice(0, 34)}...` : rule.antecedent,
        lift: Number(rule.lift.toFixed(2)),
        confidence: Number(rule.confidence.toFixed(2)),
      })),
    [],
  );

  const confidenceDistribution = useMemo(
    () => [
      { range: '70-80%', count: rulesData.filter((rule) => rule.confidence >= 0.7 && rule.confidence < 0.8).length },
      { range: '80-85%', count: rulesData.filter((rule) => rule.confidence >= 0.8 && rule.confidence < 0.85).length },
      { range: '85-90%', count: rulesData.filter((rule) => rule.confidence >= 0.85 && rule.confidence < 0.9).length },
      { range: '90%+', count: rulesData.filter((rule) => rule.confidence >= 0.9).length },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return [...rulesData]
      .filter((rule) => catFilter === 'all' || rule.category === catFilter)
      .filter((rule) => !keyword || `${rule.antecedent} ${rule.consequent} ${rule.category}`.toLowerCase().includes(keyword))
      .sort((a, b) => (sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]));
  }, [search, catFilter, sortKey, sortDir]);

  const topRules = useMemo(() => [...rulesData].sort((a, b) => b.lift - a.lift).slice(0, 5), []);

  const stats = useMemo(() => ({
    total: rulesData.length,
    avgConf: pct(rulesData.reduce((sum, rule) => sum + rule.confidence, 0) / rulesData.length),
    avgSupp: pct(rulesData.reduce((sum, rule) => sum + rule.support, 0) / rulesData.length),
    avgLift: (rulesData.reduce((sum, rule) => sum + rule.lift, 0) / rulesData.length).toFixed(2),
    maxLift: Math.max(...rulesData.map((rule) => rule.lift)).toFixed(2),
  }), []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((dir) => (dir === 'desc' ? 'asc' : 'desc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <main className="min-h-screen bg-[#090b12] px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(139,92,246,0.14),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.75),rgba(9,11,18,0.98))]" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5">
        <header className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Analitik asosiasi
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold text-violet-100">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Rules engine
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-normal text-white sm:text-3xl">Analitik & Rules</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Baca pola asosiasi prediktif untuk burnout, risiko psikosomatis, faktor protektif, dan area organisasi yang perlu dipantau.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/50 px-4 text-sm font-semibold text-slate-300 transition hover:border-teal-300/30 hover:text-white"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400"
              >
                <Lightbulb className="h-4 w-4" />
                Generate Rules
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { icon: Layers, label: 'Total Rules', value: stats.total, className: 'text-violet-200 bg-violet-400/10 ring-violet-300/20' },
            { icon: Percent, label: 'Avg Confidence', value: stats.avgConf, className: 'text-emerald-200 bg-emerald-400/10 ring-emerald-300/20' },
            { icon: Target, label: 'Avg Support', value: stats.avgSupp, className: 'text-teal-200 bg-teal-400/10 ring-teal-300/20' },
            { icon: TrendingUp, label: 'Avg Lift', value: stats.avgLift, className: 'text-amber-200 bg-amber-400/10 ring-amber-300/20' },
            { icon: Zap, label: 'Max Lift', value: stats.maxLift, className: 'text-rose-200 bg-rose-400/10 ring-rose-300/20' },
          ].map(({ icon: Icon, label, value, className }) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/10">
              <div className="flex items-center gap-3">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${className}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-400">{label}</p>
                  <p className="mt-1 text-2xl font-bold leading-tight text-white">{value}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <SectionCard className="p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_auto_auto] xl:items-center">
            <label className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari antecedent, consequent, atau kategori..."
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
              />
            </label>

            <div className="flex min-w-0 items-center gap-2 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/50 p-1.5 [scrollbar-width:none]">
              <Filter className="ml-2 h-4 w-4 shrink-0 text-slate-500" />
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCatFilter(category)}
                  className={`h-8 shrink-0 rounded-lg px-3 text-xs font-semibold transition ${
                    catFilter === category
                      ? 'bg-teal-400/15 text-teal-100'
                      : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                  }`}
                >
                  {category === 'all' ? 'Semua' : category}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs font-semibold text-slate-400">
              {filtered.length} rules ditemukan
            </div>
          </div>
        </SectionCard>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <SectionCard className="min-w-0 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Daftar Aturan Asosiasi</h2>
                <p className="mt-1 text-xs text-slate-500">Urutkan berdasarkan confidence, support, atau lift.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'confidence' as const, label: 'Confidence' },
                  { key: 'support' as const, label: 'Support' },
                  { key: 'lift' as const, label: 'Lift' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleSort(item.key)}
                    className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
                      sortKey === item.key
                        ? 'border-violet-300/30 bg-violet-400/10 text-violet-100'
                        : 'border-white/10 bg-slate-950/50 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                    {sortKey === item.key && <span>{sortDir === 'desc' ? 'Down' : 'Up'}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[980px] table-fixed text-sm">
                <thead className="bg-slate-950/65">
                  <tr className="border-b border-white/10 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                    <th className="w-12 px-4 py-3">#</th>
                    <th className="w-[300px] px-4 py-3">Antecedent</th>
                    <th className="w-[260px] px-4 py-3">Consequent</th>
                    <th className="w-28 px-4 py-3 text-center">Conf</th>
                    <th className="w-24 px-4 py-3 text-center">Supp</th>
                    <th className="w-24 px-4 py-3 text-center">Lift</th>
                    <th className="w-28 px-4 py-3 text-center">Impact</th>
                    <th className="w-28 px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filtered.map((rule, index) => (
                    <tr key={rule.id} className="transition hover:bg-white/[0.03]">
                      <td className="px-4 py-4 text-xs font-semibold text-slate-600">{index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="truncate rounded-lg border border-violet-300/15 bg-violet-400/10 px-3 py-2 text-xs font-medium text-violet-100" title={rule.antecedent}>
                          {rule.antecedent}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-0 items-center gap-2">
                          <ArrowRight className="h-4 w-4 shrink-0 text-teal-300" />
                          <div className="truncate rounded-lg border border-teal-300/15 bg-teal-400/10 px-3 py-2 text-xs font-medium text-teal-100" title={rule.consequent}>
                            {rule.consequent}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="mx-auto w-20">
                          <p className="text-sm font-bold text-emerald-200">{pct(rule.confidence)}</p>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" style={{ width: `${rule.confidence * 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-slate-300">{pct(rule.support)}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`font-bold ${rule.lift >= 2.5 ? 'text-emerald-200' : rule.lift >= 2 ? 'text-amber-200' : 'text-slate-300'}`}>
                          {rule.lift.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${impactMeta[rule.impact].className}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${impactMeta[rule.impact].dot}`} />
                          {impactMeta[rule.impact].label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta[rule.status].className}`}>
                          {statusMeta[rule.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="grid gap-5">
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Distribusi Kategori</h2>
                <BarChart3 className="h-4 w-4 text-teal-200" />
              </div>
              <div className="min-w-0">
                <ChartShell height={208}>
                  <PieChart>
                    <Pie data={categoryDist} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
                      {categoryDist.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ChartShell>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {categoryDist.map((item) => (
                  <div key={item.name} className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-950/45 px-2.5 py-2 text-xs text-slate-400">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                    <span className="ml-auto font-semibold text-slate-200">{item.value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard className="p-4">
              <h2 className="text-base font-semibold text-white">Top Rules by Lift</h2>
              <div className="mt-4 space-y-3">
                {topRules.map((rule, index) => (
                  <div key={rule.id} className="flex gap-3 rounded-xl border border-white/10 bg-slate-950/45 p-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-500 text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-200" title={rule.antecedent}>{rule.antecedent}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="truncate text-teal-200">to {rule.consequent}</span>
                        <span className="rounded-full bg-violet-400/10 px-2 py-0.5 font-semibold text-violet-200">Lift {rule.lift.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard className="p-4">
              <h2 className="text-base font-semibold text-white">Confidence Distribution</h2>
              <div className="mt-3 min-w-0">
                <ChartShell height={176}>
                  <BarChart data={confidenceDistribution} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                    <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
                  </BarChart>
                </ChartShell>
              </div>
            </SectionCard>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <SectionCard className="min-w-0 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-white">Support vs Confidence</h2>
            <p className="mt-1 text-xs text-slate-500">Ukuran bubble menunjukkan nilai lift dari tiap rule.</p>
            <div className="mt-4 min-w-0">
              <ChartShell height={320}>
                <ScatterChart margin={{ top: 12, right: 14, bottom: 20, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="x" type="number" name="Support" domain={[0.2, 0.5]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => pct(Number(value))} />
                  <YAxis dataKey="y" type="number" name="Confidence" domain={[0.7, 1]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => pct(Number(value))} />
                  <ZAxis dataKey="z" range={[60, 420]} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value: any, name: string) => [
                      name === 'z' ? Number(value / 32).toFixed(2) : pct(Number(value)),
                      name === 'x' ? 'Support' : name === 'y' ? 'Confidence' : 'Lift',
                    ]}
                  />
                  <Scatter data={scatterRuleData} fill="#8b5cf6" opacity={0.78}>
                    {scatterRuleData.map((item, index) => (
                      <Cell key={index} fill={item.lift >= 2.5 ? '#34d399' : item.lift >= 2 ? '#fbbf24' : '#8b5cf6'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ChartShell>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />Lift &gt;= 2.5</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-300" />Lift &gt;= 2.0</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-400" />Lift &lt; 2.0</span>
            </div>
          </SectionCard>

          <SectionCard className="min-w-0 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-white">Rule Importance</h2>
            <p className="mt-1 text-xs text-slate-500">Perbandingan lift dan confidence pada rule teratas.</p>
            <div className="mt-4 min-w-0">
              <ChartShell height={320}>
                <BarChart data={importanceData} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis type="number" domain={[0, 3.5]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={170} tick={{ fill: '#cbd5e1', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Bar dataKey="lift" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Lift" />
                  <Bar dataKey="confidence" fill="#2dd4bf" radius={[0, 6, 6, 0]} name="Confidence" />
                </BarChart>
              </ChartShell>
            </div>
          </SectionCard>
        </section>

        <SectionCard className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-200">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Insight Operasional</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Rules dengan lift tinggi dan confidence tinggi bisa diprioritaskan untuk rekomendasi intervensi, segmentasi responden, dan evaluasi indikator asesmen.
                </p>
              </div>
            </div>
            <span className="rounded-full border border-teal-300/20 bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-100">
              {topRules.length} rules prioritas
            </span>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
