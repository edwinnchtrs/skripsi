import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  FlaskConical,
  Gauge,
  GitCompare,
  Info,
  Layers,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sigma,
  SlidersHorizontal,
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
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartShell from '../components/ChartShell';
import api from '../api';

interface ModelData {
  r2_score: number;
  accuracy: number;
  mae: number;
  rmse: number;
  mape: number;
  f1_score: number;
  n_samples: number;
  confusion_matrix: Record<string, number>;
  feature_importance: { feature: string; importance: number; color: string }[];
  cross_val_scores: number[];
  model_comparison: { qc_r2: number; lr_r2: number; rf_r2: number; svm_r2: number };
  formula: { burnout: string; psychosomatic: string };
}

type TabKey = 'overview' | 'comparison' | 'details';

const tooltipStyle = {
  background: '#0f172a',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  borderRadius: 12,
  color: '#e2e8f0',
  boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
};

function formatPct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function clampPct(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/10 ${className}`}>
      {children}
    </section>
  );
}

export default function ModelEvaluasi() {
  const [data, setData] = useState<ModelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/model-evaluation');
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat evaluasi model. Pastikan backend aktif dan akun admin masih login.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const derived = useMemo(() => {
    if (!data) return null;

    const cm = data.confusion_matrix || {};
    const confMat = [
      [cm.Low_Low || 0, cm.Low_Medium || 0, cm.Low_High || 0],
      [cm.Medium_Low || 0, cm.Medium_Medium || 0, cm.Medium_High || 0],
      [cm.High_Low || 0, cm.High_Medium || 0, cm.High_High || 0],
    ];
    const totalMatrix = confMat.flat().reduce((sum, value) => sum + value, 0);
    const correctMatrix = confMat.reduce((sum, row, index) => sum + row[index], 0);
    const matrixAccuracy = totalMatrix ? correctMatrix / totalMatrix : data.accuracy;

    const cvChartData = data.cross_val_scores.map((score, index) => ({
      fold: `Fold ${index + 1}`,
      score,
      pct: score * 100,
    }));
    const cvMean = data.cross_val_scores.length
      ? data.cross_val_scores.reduce((sum, score) => sum + score, 0) / data.cross_val_scores.length
      : 0;
    const cvMin = data.cross_val_scores.length ? Math.min(...data.cross_val_scores) : 0;
    const cvMax = data.cross_val_scores.length ? Math.max(...data.cross_val_scores) : 0;
    const cvStability = cvMax - cvMin;

    const compare = data.model_comparison;
    const qcBase = compare.qc_r2 || 0.01;
    const compBarData = [
      { model: 'Quantum Cognition', short: 'QC', r2: compare.qc_r2, acc: data.accuracy, color: '#8b5cf6', rank: 1 },
      { model: 'Random Forest', short: 'RF', r2: compare.rf_r2, acc: (compare.rf_r2 / qcBase) * data.accuracy, color: '#34d399', rank: 2 },
      { model: 'Linear Regression', short: 'LR', r2: compare.lr_r2, acc: (compare.lr_r2 / qcBase) * data.accuracy, color: '#fb7185', rank: 3 },
      { model: 'SVM', short: 'SVM', r2: compare.svm_r2, acc: (compare.svm_r2 / qcBase) * data.accuracy, color: '#fbbf24', rank: 4 },
    ].sort((a, b) => b.r2 - a.r2).map((item, index) => ({ ...item, rank: index + 1 }));

    const radarData = [
      { metric: 'R2', value: clampPct(data.r2_score * 100) },
      { metric: 'Accuracy', value: clampPct(data.accuracy * 100) },
      { metric: 'F1', value: clampPct(data.f1_score * 100) },
      { metric: 'CV Mean', value: clampPct(cvMean * 100) },
      { metric: 'MAPE', value: clampPct(100 - data.mape) },
      { metric: 'RMSE', value: clampPct(100 - data.rmse * 10) },
    ];

    return { confMat, totalMatrix, matrixAccuracy, cvChartData, cvMean, cvMin, cvMax, cvStability, compBarData, radarData };
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090b12] text-slate-100">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-xl shadow-black/20">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-200" />
          <p className="mt-4 text-sm text-slate-400">Memuat evaluasi model...</p>
        </div>
      </div>
    );
  }

  if (!data || data.n_samples === 0) {
    return (
      <main className="min-h-screen bg-[#090b12] px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
        <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_30%),radial-gradient(circle_at_88%_0%,rgba(139,92,246,0.14),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.72),rgba(9,11,18,0.98))]" />
        <div className="mx-auto flex max-w-6xl flex-col gap-5">
          <header className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                    <FlaskConical className="h-3.5 w-3.5" />
                    Model evaluation
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/15 bg-slate-400/10 px-3 py-1 text-xs font-semibold text-slate-300">
                    <Database className="h-3.5 w-3.5" />
                    0 samples
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-normal text-white sm:text-3xl">Model & Evaluasi</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  Dashboard evaluasi sudah siap. Tambahkan data asesmen dan prediksi agar metrik, chart, dan confusion matrix dapat dihitung.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchData}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/50 px-4 text-sm font-semibold text-slate-300 transition hover:border-amber-300/30 hover:text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </header>

          {error && <p className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <SectionCard className="p-6 sm:p-8">
              <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-amber-400/10 text-amber-200 ring-1 ring-amber-300/20">
                  <FlaskConical className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Belum Ada Data Evaluasi</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    Sistem membutuhkan pasangan data asesmen dan hasil prediksi untuk menghitung R2, akurasi, MAE, RMSE, MAPE, F1 score, validasi silang, dan confusion matrix.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      ['Input asesmen', 'Skor F, C, E, I'],
                      ['Prediksi model', 'Burnout dan psikosomatis'],
                      ['Label risiko', 'Rendah, sedang, tinggi'],
                    ].map(([title, desc]) => (
                      <div key={title} className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
                        <p className="text-sm font-semibold text-white">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <div className="grid gap-5">
              <SectionCard className="p-5">
                <h2 className="text-base font-semibold text-white">Kesiapan Pipeline</h2>
                <div className="mt-4 space-y-3">
                  {[
                    ['Assessment records', false],
                    ['Prediction records', false],
                    ['Evaluation metrics', false],
                    ['Model comparison', false],
                  ].map(([label, ok]) => (
                    <div key={String(label)} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2.5">
                      <span className="text-sm text-slate-300">{label}</span>
                      <span className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-300' : 'bg-slate-600'}`} />
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard className="p-5">
                <h2 className="text-base font-semibold text-white">Langkah Berikutnya</h2>
                <ol className="mt-4 space-y-3 text-sm text-slate-400">
                  <li className="rounded-xl bg-slate-950/45 px-3 py-2">1. User mengisi kuisioner harian.</li>
                  <li className="rounded-xl bg-slate-950/45 px-3 py-2">2. Sistem membuat prediksi risiko.</li>
                  <li className="rounded-xl bg-slate-950/45 px-3 py-2">3. Buka ulang halaman ini untuk melihat evaluasi.</li>
                </ol>
              </SectionCard>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const modelMetrics = [
    { label: 'R2 Score', value: data.r2_score, icon: TrendingUp, tone: 'text-violet-200 bg-violet-400/10 ring-violet-300/20', fmt: (value: number) => value.toFixed(3), progress: clampPct(data.r2_score * 100) },
    { label: 'Akurasi', value: data.accuracy, icon: CheckCircle2, tone: 'text-emerald-200 bg-emerald-400/10 ring-emerald-300/20', fmt: formatPct, progress: clampPct(data.accuracy * 100) },
    { label: 'MAE', value: data.mae, icon: Target, tone: 'text-teal-200 bg-teal-400/10 ring-teal-300/20', fmt: (value: number) => value.toFixed(2), progress: clampPct(100 - data.mae * 10) },
    { label: 'RMSE', value: data.rmse, icon: Activity, tone: 'text-amber-200 bg-amber-400/10 ring-amber-300/20', fmt: (value: number) => value.toFixed(2), progress: clampPct(100 - data.rmse * 10) },
    { label: 'MAPE', value: data.mape, icon: BarChart3, tone: 'text-pink-200 bg-pink-400/10 ring-pink-300/20', fmt: (value: number) => `${value.toFixed(1)}%`, progress: clampPct(100 - data.mape) },
    { label: 'F1 Score', value: data.f1_score, icon: Zap, tone: 'text-sky-200 bg-sky-400/10 ring-sky-300/20', fmt: formatPct, progress: clampPct(data.f1_score * 100) },
  ];

  const classLabels = ['Rendah', 'Sedang', 'Tinggi'];

  return (
    <main className="min-h-screen bg-[#090b12] px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_30%),radial-gradient(circle_at_88%_0%,rgba(139,92,246,0.14),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.72),rgba(9,11,18,0.98))]" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5">
        <header className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                  <FlaskConical className="h-3.5 w-3.5" />
                  Model evaluation
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold text-violet-100">
                  <Database className="h-3.5 w-3.5" />
                  {data.n_samples} samples
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Production metrics
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-normal text-white sm:text-3xl">Model & Evaluasi</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Pantau akurasi, stabilitas validasi, confusion matrix, bobot fitur, formula prediksi, dan perbandingan model dalam satu dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={fetchData}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/50 px-4 text-sm font-semibold text-slate-300 transition hover:border-amber-300/30 hover:text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-950/30 transition hover:bg-amber-400"
              >
                <Download className="h-4 w-4" />
                Export Snapshot
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {modelMetrics.map(({ label, value, icon: Icon, tone, fmt, progress }) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/10">
              <div className="flex items-start justify-between gap-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-right text-xs font-medium text-slate-500">{label}</span>
              </div>
              <p className="mt-4 text-2xl font-bold leading-tight text-white">{fmt(value)}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-current text-amber-300" style={{ width: `${progress}%` }} />
              </div>
            </article>
          ))}
        </section>

        <SectionCard className="p-3">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'overview' as const, label: 'Overview', desc: 'Metrik, matrix, dan fitur', icon: BarChart3 },
              { key: 'comparison' as const, label: 'Perbandingan Model', desc: 'QC, RF, LR, dan SVM', icon: GitCompare },
              { key: 'details' as const, label: 'Formula & Detail', desc: 'Bobot, pipeline, dan matrix', icon: Sigma },
            ].map(({ key, label, desc, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex min-w-[220px] flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  activeTab === key
                    ? 'border-amber-300/30 bg-amber-400/10 text-amber-100'
                    : 'border-white/10 bg-slate-950/35 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-0.5 block truncate text-xs opacity-70">{desc}</span>
                </span>
              </button>
            ))}
          </div>
        </SectionCard>

        {activeTab === 'overview' && derived && (
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="grid min-w-0 gap-5">
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <SectionCard className="p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-white">Confusion Matrix</h2>
                      <p className="mt-1 text-xs text-slate-500">Aktual vs prediksi untuk tiga level risiko.</p>
                    </div>
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                      {formatPct(derived.matrixAccuracy)}
                    </span>
                  </div>
                  <div className="grid grid-cols-[64px_repeat(3,minmax(0,1fr))] gap-2">
                    <span />
                    {classLabels.map((label) => (
                      <div key={label} className="rounded-lg bg-slate-950/45 px-2 py-2 text-center text-[11px] font-semibold text-slate-400">
                        Pred {label}
                      </div>
                    ))}
                    {derived.confMat.map((row, rowIndex) => (
                      <MatrixRow key={classLabels[rowIndex]} label={classLabels[rowIndex]} row={row} rowIndex={rowIndex} />
                    ))}
                  </div>
                </SectionCard>

                <SectionCard className="min-w-0 p-4 sm:p-5">
                  <h2 className="text-base font-semibold text-white">Feature Importance</h2>
                  <p className="mt-1 text-xs text-slate-500">Bobot fitur yang berkontribusi terhadap skor prediksi.</p>
                  <ChartShell height={280} className="mt-4">
                    <BarChart data={data.feature_importance} layout="vertical" margin={{ top: 8, right: 18, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" horizontal={false} />
                      <XAxis type="number" domain={[0, 0.6]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`} />
                      <YAxis dataKey="feature" type="category" width={120} tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                      <Bar dataKey="importance" radius={[0, 8, 8, 0]} barSize={18}>
                        {data.feature_importance.map((feature, index) => <Cell key={index} fill={feature.color} />)}
                      </Bar>
                    </BarChart>
                  </ChartShell>
                </SectionCard>
              </div>

              <SectionCard className="min-w-0 p-4 sm:p-5">
                <h2 className="text-base font-semibold text-white">Cross Validation Stability</h2>
                <p className="mt-1 text-xs text-slate-500">Skor validasi per fold dan rata-rata stabilitas model.</p>
                <ChartShell height={260} className="mt-4">
                  <LineChart data={derived.cvChartData} margin={{ top: 12, right: 18, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                    <XAxis dataKey="fold" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatPct(value)} />
                    <Line type="monotone" dataKey="score" stroke="#fbbf24" strokeWidth={2.8} dot={{ r: 4, fill: '#fbbf24' }} name="CV Score" />
                  </LineChart>
                </ChartShell>
              </SectionCard>
            </div>

            <aside className="grid gap-5">
              <SectionCard className="p-4 sm:p-5">
                <h2 className="text-base font-semibold text-white">Kesehatan Model</h2>
                <div className="mt-4 space-y-3">
                  {[
                    ['CV Mean', derived.cvMean.toFixed(3), 'Rata-rata validasi silang'],
                    ['CV Range', derived.cvStability.toFixed(3), 'Semakin kecil semakin stabil'],
                    ['Matrix Total', derived.totalMatrix, 'Total sampel di matrix'],
                    ['Sample DB', data.n_samples, 'Data asesmen dan prediksi'],
                  ].map(([label, value, detail]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">{label}</span>
                        <span className="text-sm font-bold text-white">{value}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{detail}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard className="min-w-0 p-4 sm:p-5">
                <h2 className="text-base font-semibold text-white">Radar Performa</h2>
                <ChartShell height={270} className="mt-3">
                  <RadarChart data={derived.radarData}>
                    <PolarGrid stroke="rgba(148,163,184,0.18)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.26} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </RadarChart>
                </ChartShell>
              </SectionCard>

              <FormulaMiniCard data={data} />
            </aside>
          </section>
        )}

        {activeTab === 'comparison' && derived && (
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <SectionCard className="min-w-0 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-white">Perbandingan R2 dan Akurasi</h2>
              <p className="mt-1 text-xs text-slate-500">Membandingkan model utama dengan baseline dan model alternatif.</p>
              <ChartShell height={380} className="mt-4">
                <BarChart data={derived.compBarData} margin={{ top: 12, right: 18, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="short" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Bar dataKey="r2" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="R2 Score" />
                  <Bar dataKey="acc" fill="#2dd4bf" radius={[8, 8, 0, 0]} name="Accuracy" />
                </BarChart>
              </ChartShell>
            </SectionCard>

            <div className="grid gap-5">
              {derived.compBarData.map((model) => (
                <SectionCard key={model.model} className={`p-4 ${model.rank === 1 ? 'ring-1 ring-amber-300/20' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-slate-950" style={{ backgroundColor: model.color }}>
                      #{model.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-white">{model.model}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {model.model === 'Quantum Cognition'
                          ? 'Model utama dengan kombinasi bobot psikologis dan term quantum.'
                          : 'Model pembanding untuk membaca gap performa terhadap model utama.'}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-slate-950/45 px-3 py-2">
                          <p className="text-[11px] text-slate-500">R2</p>
                          <p className="text-sm font-bold text-white">{model.r2.toFixed(3)}</p>
                        </div>
                        <div className="rounded-lg bg-slate-950/45 px-3 py-2">
                          <p className="text-[11px] text-slate-500">Acc</p>
                          <p className="text-sm font-bold text-white">{formatPct(model.acc)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'details' && derived && (
          <section className="grid gap-5 lg:grid-cols-2">
            <DetailPanel
              title="Metrik Evaluasi"
              icon={Gauge}
              items={[
                ['R2 Score', data.r2_score.toFixed(4)],
                ['Accuracy', formatPct(data.accuracy)],
                ['MAE', data.mae.toFixed(3)],
                ['RMSE', data.rmse.toFixed(3)],
                ['MAPE', `${data.mape.toFixed(2)}%`],
                ['F1 Score', formatPct(data.f1_score)],
                ['Jumlah Sampel', data.n_samples],
                ['CV Folds', data.cross_val_scores.length || 'N/A'],
              ]}
            />
            <DetailPanel
              title="Formula & Bobot"
              icon={Sigma}
              items={[
                ['Fatigue Weight', '0.4'],
                ['Cynicism Weight', '0.3'],
                ['Efficacy Weight', '0.2 x (5 - E)'],
                ['Interference Weight', '0.1'],
                ['NLP Stress Weight', '2.0'],
                ['Clamp Range', '0 - 10'],
                ['Risk Low', '< 4.0'],
                ['Risk Medium', '4.0 - 6.0'],
              ]}
            />
            <DetailPanel
              title="Model Info"
              icon={Brain}
              items={[
                ['Tipe', 'Linear Weighted + Quantum'],
                ['Framework', 'Go Native'],
                ['Input Features', 'F, C, E, I, S'],
                ['Output', 'Burnout + Psycho + Risk'],
                ['Database', 'MySQL via GORM'],
                ['NLP Engine', 'Lexicon-based'],
                ['Quantum Term', 'Interference x 0.1'],
                ['Version', '1.0.0'],
              ]}
            />
            <DetailPanel
              title="Confusion Matrix Detail"
              icon={BarChart3}
              items={[
                ['Rendah -> Rendah', derived.confMat[0][0]],
                ['Rendah -> Sedang', derived.confMat[0][1]],
                ['Rendah -> Tinggi', derived.confMat[0][2]],
                ['Sedang -> Rendah', derived.confMat[1][0]],
                ['Sedang -> Sedang', derived.confMat[1][1]],
                ['Sedang -> Tinggi', derived.confMat[1][2]],
                ['Tinggi -> Rendah', derived.confMat[2][0]],
                ['Tinggi -> Tinggi', derived.confMat[2][2]],
              ]}
            />
            <SectionCard className="p-4 sm:p-5 lg:col-span-2">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-400/10 text-sky-200">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Catatan Interpretasi</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    R2 membaca kemampuan model menjelaskan variasi skor, sementara akurasi dan F1 membaca konsistensi klasifikasi risiko.
                    Nilai error seperti MAE, RMSE, dan MAPE sebaiknya dipantau bersama jumlah sampel agar evaluasi tidak bias pada data kecil.
                  </p>
                </div>
              </div>
            </SectionCard>
          </section>
        )}
      </div>
    </main>
  );
}

function MatrixRow({ label, row, rowIndex }: { label: string; row: number[]; rowIndex: number }) {
  return (
    <>
      <div className="flex items-center justify-end pr-2 text-[11px] font-semibold text-slate-500">Akt {label}</div>
      {row.map((value, colIndex) => {
        const isCorrect = rowIndex === colIndex;
        return (
          <div
            key={`${label}-${colIndex}`}
            className={`rounded-xl border px-2 py-5 text-center text-xl font-bold ${
              isCorrect
                ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200'
                : 'border-rose-300/20 bg-rose-400/10 text-rose-200'
            }`}
          >
            {value}
          </div>
        );
      })}
    </>
  );
}

function FormulaMiniCard({ data }: { data: ModelData }) {
  return (
    <SectionCard className="p-4 sm:p-5">
      <h2 className="text-base font-semibold text-white">Formula Model</h2>
      <div className="mt-4 space-y-3">
        {[
          ['Burnout Score', data.formula.burnout, 'text-violet-200 border-violet-300/20 bg-violet-400/10'],
          ['Psychosomatic Score', data.formula.psychosomatic, 'text-teal-200 border-teal-300/20 bg-teal-400/10'],
        ].map(([label, formula, className]) => (
          <div key={label} className={`rounded-xl border p-3 ${className}`}>
            <p className="text-xs font-semibold">{label}</p>
            <code className="mt-2 block break-words text-xs leading-5 text-slate-200">{formula}</code>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function DetailPanel({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Gauge;
  items: Array<[string, string | number]>;
}) {
  return (
    <SectionCard className="p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-base font-semibold text-white">
        <Icon className="h-5 w-5 text-amber-200" />
        {title}
      </h2>
      <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
        {items.map(([label, value], index) => (
          <div key={label} className={`flex items-center justify-between gap-3 px-4 py-3 ${index % 2 === 0 ? 'bg-slate-950/45' : 'bg-transparent'}`}>
            <span className="text-sm text-slate-400">{label}</span>
            <span className="text-right text-sm font-semibold text-slate-100">{value}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
