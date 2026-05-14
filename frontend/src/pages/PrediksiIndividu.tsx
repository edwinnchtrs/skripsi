import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Brain,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gauge,
  Loader2,
  Radar,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar as RadarChartShape,
  RadarChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartShell from '../components/ChartShell';
import api from '../api';

interface Responden {
  id: number;
  nama: string;
  username: string;
  latest_burnout: number;
  latest_risk: string;
  latest_psychosomatic: number;
  last_activity: string;
}

interface RealPrediction {
  ID: number;
  BurnoutScore: number;
  PsychosomaticScore: number;
  RiskLevel: string;
  Timestamp: string;
}

interface AssessmentRecord {
  ID?: number;
  InterferenceScore?: number;
  OrderEffectScore?: number;
  CognitiveDissonanceScore?: number;
  Timestamp?: string;
}

interface FormattedPrediction {
  id: number;
  burnout: number;
  psycho: number;
  risk: string;
  date: string;
  timestamp: string;
}

const riskMeta = {
  High: {
    label: 'Tinggi',
    text: 'text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-400/30',
    dot: 'bg-rose-400',
    hex: '#fb7185',
    softHex: '#fb718533',
  },
  Medium: {
    label: 'Sedang',
    text: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/30',
    dot: 'bg-amber-300',
    hex: '#f59e0b',
    softHex: '#f59e0b33',
  },
  Low: {
    label: 'Rendah',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/30',
    dot: 'bg-emerald-300',
    hex: '#34d399',
    softHex: '#34d39933',
  },
  Unknown: {
    label: '-',
    text: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    dot: 'bg-slate-500',
    hex: '#94a3b8',
    softHex: '#94a3b833',
  },
};

const formatPrediction = (prediction: RealPrediction): FormattedPrediction => ({
  id: prediction.ID,
  burnout: prediction.BurnoutScore,
  psycho: prediction.PsychosomaticScore,
  risk: prediction.RiskLevel || 'Unknown',
  date: new Date(prediction.Timestamp).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  }),
  timestamp: prediction.Timestamp,
});

const getRisk = (risk?: string) => riskMeta[risk as keyof typeof riskMeta] ?? riskMeta.Unknown;

const formatDateTime = (date: string) => {
  if (!date || date.startsWith('0001')) return '-';

  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const hasData = (responden: Responden) => Boolean(responden.latest_risk);

export default function PrediksiIndividu() {
  const [users, setUsers] = useState<Responden[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [history, setHistory] = useState<FormattedPrediction[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');
  const [detailModal, setDetailModal] = useState<FormattedPrediction | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);

    try {
      const response = await api.get('/responden');
      setUsers(response.data.respondents || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchHistory = async (id: number) => {
    setLoading(true);
    setHistory([]);
    setAssessments([]);

    try {
      const response = await api.get(`/responden/${id}/history`);
      const predictions = (response.data.predictions || [])
        .map((prediction: RealPrediction) => formatPrediction(prediction))
        .reverse();

      setHistory(predictions);
      setAssessments(response.data.assessments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return users;

    const keyword = search.toLowerCase();
    return users.filter(
      (user) =>
        user.nama.toLowerCase().includes(keyword) ||
        user.username.toLowerCase().includes(keyword),
    );
  }, [users, search]);

  const selected = users.find((user) => user.id === selectedId);
  const latest = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const latestAssessment = assessments[assessments.length - 1];

  const maxScore = useMemo(() => {
    if (history.length === 0) return 100;

    const highest = Math.max(...history.map((item) => Math.max(item.burnout, item.psycho)));
    return Math.max(100, Math.ceil(highest / 10) * 10);
  }, [history]);

  const trend = useMemo(() => {
    if (!latest || !previous) {
      return { type: 'steady', label: 'Belum cukup data', delta: 0, color: 'text-slate-400' };
    }

    const delta = latest.burnout - previous.burnout;

    if (delta > 0) {
      return { type: 'up', label: 'Meningkat', delta, color: 'text-rose-300' };
    }

    if (delta < 0) {
      return { type: 'down', label: 'Menurun', delta, color: 'text-emerald-300' };
    }

    return { type: 'steady', label: 'Stabil', delta, color: 'text-slate-400' };
  }, [latest, previous]);

  const cohortSummary = useMemo(() => {
    const withData = users.filter(hasData);
    const high = withData.filter((user) => user.latest_risk === 'High').length;
    const medium = withData.filter((user) => user.latest_risk === 'Medium').length;
    const low = withData.filter((user) => user.latest_risk === 'Low').length;
    const averageBurnout =
      withData.length > 0
        ? withData.reduce((total, user) => total + (user.latest_burnout || 0), 0) / withData.length
        : 0;

    return { withData, high, medium, low, averageBurnout };
  }, [users]);

  const riskDistribution = useMemo(
    () => [
      { label: 'Tinggi', value: cohortSummary.high, color: '#fb7185' },
      { label: 'Sedang', value: cohortSummary.medium, color: '#f59e0b' },
      { label: 'Rendah', value: cohortSummary.low, color: '#34d399' },
    ],
    [cohortSummary.high, cohortSummary.low, cohortSummary.medium],
  );

  const radarData = useMemo(() => {
    const interference = latestAssessment?.InterferenceScore ?? 0;
    const orderEffect = latestAssessment?.OrderEffectScore ?? 0;
    const dissonance = latestAssessment?.CognitiveDissonanceScore ?? 0;

    return [
      { axis: 'Burnout', value: latest?.burnout ?? 0 },
      { axis: 'Psiko', value: latest?.psycho ?? 0 },
      { axis: 'Interferensi', value: Math.abs(interference) * 100 },
      { axis: 'Order', value: Math.abs(orderEffect) * 100 },
      { axis: 'Dissonance', value: Math.abs(dissonance) * 100 },
    ];
  }, [latest, latestAssessment]);

  const suggestedActions = useMemo(() => {
    if (!latest) return [];

    if (latest.risk === 'High') {
      return [
        'Jadwalkan konseling atau pendampingan akademik dalam 24-48 jam.',
        'Kurangi beban aktivitas berisiko tinggi dan pantau ulang skor harian.',
        'Prioritaskan intervensi psikosomatis jika keluhan fisik ikut naik.',
      ];
    }

    if (latest.risk === 'Medium') {
      return [
        'Aktifkan check-in berkala dan modul terapi adaptif selama satu minggu.',
        'Pantau perubahan burnout setelah responden mengambil jeda terarah.',
        'Bandingkan topik curhat dengan pola skor asesmen terakhir.',
      ];
    }

    return [
      'Pertahankan ritme refleksi harian dan asesmen berkala.',
      'Gunakan data sebagai baseline untuk membaca kenaikan risiko lebih awal.',
      'Dorong kebiasaan pemulihan kecil sebelum tekanan akademik meningkat.',
    ];
  }, [latest]);

  const selectUser = (id: number) => {
    setSelectedId(id);
    fetchHistory(id);
    setShowDropdown(false);
    setSearch('');
  };

  const clearSelection = () => {
    setSelectedId(null);
    setHistory([]);
    setAssessments([]);
    setDetailModal(null);
  };

  return (
    <div className="min-h-screen bg-[#0b0d14] px-5 py-6 text-slate-100 md:px-8">
      <header className="mb-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
        <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_340px] md:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(99,102,241,0.22),transparent_28%),radial-gradient(circle_at_78%_10%,rgba(20,184,166,0.18),transparent_24%)]" />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Modul prediksi individual
            </div>
            <h1 className="text-2xl font-semibold tracking-normal text-white md:text-3xl">
              Prediksi Individu
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Pilih satu responden untuk melihat tren burnout, sinyal psikosomatis, skor
              kognitif, rekomendasi tindak lanjut, dan riwayat prediksi dari data asesmen.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-3">
            {[
              { label: 'Responden', value: users.length, icon: Users, color: 'text-indigo-300' },
              { label: 'Memiliki data', value: cohortSummary.withData.length, icon: CheckCircle2, color: 'text-emerald-300' },
              { label: 'Risiko tinggi', value: cohortSummary.high, icon: ShieldAlert, color: 'text-rose-300' },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <Icon className={`mb-3 h-4 w-4 ${item.color}`} aria-hidden="true" />
                  <div className="text-xl font-semibold text-white">{item.value}</div>
                  <div className="mt-1 text-[11px] leading-4 text-slate-500">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {!selectedId ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/20">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
                  <Search className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold tracking-normal text-white">Pilih responden</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Cari nama atau username, lalu buka laporan prediksi personal.
                </p>
              </div>
              {loadingUsers && (
                <div className="flex items-center gap-2 rounded-full border border-slate-800 px-3 py-1.5 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Memuat
                </div>
              )}
            </div>

            <div ref={dropdownRef} className="relative">
              <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 focus-within:border-indigo-400/60 focus-within:ring-4 focus-within:ring-indigo-500/10">
                <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setShowDropdown(true);
                    setHoverIdx(-1);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      setHoverIdx((index) => Math.min(index + 1, filtered.length - 1));
                    }

                    if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      setHoverIdx((index) => Math.max(index - 1, -1));
                    }

                    if (event.key === 'Enter' && hoverIdx >= 0 && filtered[hoverIdx]) {
                      selectUser(filtered[hoverIdx].id);
                    }

                    if (event.key === 'Escape') {
                      setShowDropdown(false);
                    }
                  }}
                  placeholder="Cari nama atau username responden..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
                />
              </div>

              {showDropdown && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/40">
                  {filtered.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      {loadingUsers ? 'Memuat responden...' : 'Tidak ada responden ditemukan'}
                    </div>
                  ) : (
                    filtered.map((user, index) => {
                      const risk = getRisk(user.latest_risk);
                      const active = hoverIdx === index;

                      return (
                        <button
                          key={user.id}
                          onClick={() => selectUser(user.id)}
                          onMouseEnter={() => setHoverIdx(index)}
                          className={`flex w-full items-center gap-3 border-b border-slate-900 px-4 py-3 text-left transition ${
                            active ? 'bg-slate-900' : 'hover:bg-slate-900/70'
                          }`}
                        >
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${risk.border} ${risk.bg} ${risk.text}`}>
                            <span className="text-sm font-semibold">{user.nama.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-slate-100">{user.nama}</div>
                            <div className="truncate text-xs text-slate-500">@{user.username}</div>
                          </div>
                          {hasData(user) ? (
                            <>
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${risk.border} ${risk.bg} ${risk.text}`}>
                                {risk.label}
                              </span>
                              <span className="w-12 text-right text-xs font-semibold text-slate-400">
                                {user.latest_burnout?.toFixed(1)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-600">Belum ada data</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                { label: 'Rata-rata burnout', value: cohortSummary.averageBurnout.toFixed(1), icon: Gauge, color: 'text-indigo-300' },
                { label: 'Risiko sedang', value: cohortSummary.medium, icon: Activity, color: 'text-amber-300' },
                { label: 'Risiko rendah', value: cohortSummary.low, icon: CheckCircle2, color: 'text-emerald-300' },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                    <Icon className={`mb-4 h-5 w-5 ${item.color}`} aria-hidden="true" />
                    <div className="text-2xl font-semibold text-white">{item.value}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-normal text-white">Sebaran risiko</h2>
                <p className="text-xs text-slate-500">Ringkasan seluruh responden</p>
              </div>
              <BarChart3 className="h-5 w-5 text-indigo-300" aria-hidden="true" />
            </div>

            <div className="space-y-4">
              {riskDistribution.map((item) => {
                const total = Math.max(cohortSummary.withData.length, 1);
                const width = `${Math.min((item.value / total) * 100, 100)}%`;

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-semibold text-white">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-950">
                      <div className="h-full rounded-full" style={{ width, backgroundColor: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Catatan sistem</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Data di halaman ini diambil dari endpoint responden dan riwayat prediksi.
                Pilih satu responden untuk melihat analisis lebih rinci.
              </p>
            </div>
          </aside>
        </section>
      ) : (
        <section>
          <div className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={clearSelection}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-medium text-slate-300 transition hover:border-indigo-400/60 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Kembali
              </button>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-500/10 text-indigo-200">
                <User className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-normal text-white">{selected?.nama}</h2>
                <p className="text-xs text-slate-500">
                  @{selected?.username} · ID {selected?.id}
                </p>
              </div>
            </div>

            {latest && (
              <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${getRisk(latest.risk).border} ${getRisk(latest.risk).bg} ${getRisk(latest.risk).text}`}>
                <span className={`h-2 w-2 rounded-full ${getRisk(latest.risk).dot}`} />
                Risiko {getRisk(latest.risk).label}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex h-[420px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70">
              <div className="text-center">
                <Loader2 className="mx-auto h-9 w-9 animate-spin text-indigo-300" aria-hidden="true" />
                <p className="mt-3 text-sm text-slate-500">Memuat riwayat prediksi...</p>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-400">
                <Clock className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-normal text-white">Belum ada data</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Responden ini belum memiliki riwayat prediksi. Ajak responden menyelesaikan
                asesmen terlebih dahulu agar laporan personal dapat dibuat.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
              <aside className="space-y-5">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Skor terkini</p>
                      <h3 className="mt-1 text-lg font-semibold tracking-normal text-white">Burnout monitor</h3>
                    </div>
                    <Gauge className="h-5 w-5 text-indigo-300" aria-hidden="true" />
                  </div>

                  <div className="relative mx-auto h-44 w-44">
                    <svg className="-rotate-90" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="66" fill="none" stroke="#1e293b" strokeWidth="14" />
                      <circle
                        cx="80"
                        cy="80"
                        r="66"
                        fill="none"
                        stroke={getRisk(latest.risk).hex}
                        strokeDasharray={`${414 * Math.min(latest.burnout / maxScore, 1)} 414`}
                        strokeLinecap="round"
                        strokeWidth="14"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-semibold ${getRisk(latest.risk).text}`}>
                        {latest.burnout.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500">dari {maxScore}</span>
                    </div>
                  </div>

                  <div className={`mt-4 flex items-center justify-center gap-2 text-sm font-semibold ${trend.color}`}>
                    {trend.type === 'up' && <TrendingUp className="h-4 w-4" aria-hidden="true" />}
                    {trend.type === 'down' && <TrendingDown className="h-4 w-4" aria-hidden="true" />}
                    {trend.type === 'steady' && <Activity className="h-4 w-4" aria-hidden="true" />}
                    {trend.label}
                    {trend.delta !== 0 && <span>({trend.delta > 0 ? '+' : ''}{trend.delta.toFixed(1)})</span>}
                  </div>
                </div>

                <div className="grid gap-3">
                  {[
                    { label: 'Psikosomatis', value: latest.psycho.toFixed(1), icon: Activity, color: 'text-cyan-300' },
                    { label: 'Total prediksi', value: history.length, icon: CalendarClock, color: 'text-indigo-300' },
                    { label: 'Total asesmen', value: assessments.length, icon: Target, color: 'text-violet-300' },
                    {
                      label: 'Interferensi',
                      value: latestAssessment?.InterferenceScore?.toFixed(2) ?? '-',
                      icon: Brain,
                      color: 'text-amber-300',
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950">
                          <Icon className={`h-5 w-5 ${item.color}`} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">{item.label}</p>
                          <p className="text-lg font-semibold text-white">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-300" aria-hidden="true" />
                    <h3 className="text-sm font-semibold tracking-normal text-white">Rekomendasi tindak lanjut</h3>
                  </div>
                  <div className="space-y-3">
                    {suggestedActions.map((action) => (
                      <div key={action} className="flex gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                        <p className="text-xs leading-5 text-slate-400">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="space-y-5">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_330px]">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-indigo-300" aria-hidden="true" />
                          <h3 className="text-base font-semibold tracking-normal text-white">Tren skor prediksi</h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Burnout dan psikosomatis dari waktu ke waktu</p>
                      </div>
                      <div className="flex w-fit rounded-lg border border-slate-800 bg-slate-950 p-1">
                        {(['area', 'bar'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setChartMode(mode)}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                              chartMode === mode
                                ? 'bg-indigo-500/20 text-indigo-200'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {mode === 'area' ? 'Area' : 'Bar'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4 flex gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-400" />
                        Burnout
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Psikosomatis
                      </span>
                    </div>

                    <ChartShell height={320} className="overflow-hidden">
                      {chartMode === 'area' ? (
                        <AreaChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                          <defs>
                            <linearGradient id="burnoutFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.32} />
                              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="psychoFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#34d399" stopOpacity={0.24} />
                              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis domain={[0, maxScore]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              background: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: 10,
                              color: '#e2e8f0',
                              fontSize: 12,
                            }}
                          />
                          <Area type="monotone" dataKey="burnout" name="Burnout" stroke="#818cf8" strokeWidth={3} fill="url(#burnoutFill)" dot={{ r: 4, fill: '#818cf8' }} />
                          <Area type="monotone" dataKey="psycho" name="Psikosomatis" stroke="#34d399" strokeWidth={3} fill="url(#psychoFill)" dot={{ r: 4, fill: '#34d399' }} />
                        </AreaChart>
                      ) : (
                        <BarChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barGap={4}>
                          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis domain={[0, maxScore]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              background: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: 10,
                              color: '#e2e8f0',
                              fontSize: 12,
                            }}
                          />
                          <Bar dataKey="burnout" name="Burnout" fill="#818cf8" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="psycho" name="Psikosomatis" fill="#34d399" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      )}
                    </ChartShell>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold tracking-normal text-white">Radar risiko</h3>
                        <p className="text-xs text-slate-500">Profil skor terakhir</p>
                      </div>
                      <Radar className="h-5 w-5 text-cyan-300" aria-hidden="true" />
                    </div>
                    <ChartShell height={290} className="overflow-hidden">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="axis" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <RadarChartShape dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.18} strokeWidth={2} />
                        <Tooltip
                          contentStyle={{
                            background: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: 10,
                            color: '#e2e8f0',
                            fontSize: 12,
                          }}
                        />
                      </RadarChart>
                    </ChartShell>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold tracking-normal text-white">Riwayat prediksi</h3>
                        <p className="text-xs text-slate-500">{history.length} catatan tersimpan</p>
                      </div>
                      <Clock className="h-5 w-5 text-indigo-300" aria-hidden="true" />
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                            <th className="px-3 py-3 font-medium">Tanggal</th>
                            <th className="px-3 py-3 font-medium">Burnout</th>
                            <th className="px-3 py-3 font-medium">Psikosomatis</th>
                            <th className="px-3 py-3 font-medium">Status</th>
                            <th className="px-3 py-3 font-medium">Detail</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history
                            .slice()
                            .reverse()
                            .map((prediction) => {
                              const risk = getRisk(prediction.risk);

                              return (
                                <tr key={prediction.id} className="border-b border-slate-900 transition hover:bg-slate-950/70">
                                  <td className="px-3 py-3 text-xs text-slate-400">{prediction.date}</td>
                                  <td className="px-3 py-3">
                                    <div className="flex items-center gap-3">
                                      <span className="w-12 text-sm font-semibold text-white">{prediction.burnout.toFixed(1)}</span>
                                      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-950">
                                        <div
                                          className="h-full rounded-full"
                                          style={{
                                            width: `${Math.min((prediction.burnout / maxScore) * 100, 100)}%`,
                                            backgroundColor: risk.hex,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-slate-300">{prediction.psycho.toFixed(1)}</td>
                                  <td className="px-3 py-3">
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${risk.border} ${risk.bg} ${risk.text}`}>
                                      {risk.label}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3">
                                    <button
                                      onClick={() => setDetailModal(prediction)}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-indigo-400/60 hover:text-indigo-200"
                                    >
                                      Detail
                                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-violet-300" aria-hidden="true" />
                      <h3 className="text-base font-semibold tracking-normal text-white">Sinyal kognitif</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Interference score', value: latestAssessment?.InterferenceScore?.toFixed(3) ?? '-', color: 'bg-indigo-400' },
                        { label: 'Order effect', value: latestAssessment?.OrderEffectScore?.toFixed(3) ?? '-', color: 'bg-cyan-400' },
                        { label: 'Cognitive dissonance', value: latestAssessment?.CognitiveDissonanceScore?.toFixed(3) ?? '-', color: 'bg-amber-300' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs text-slate-500">{item.label}</span>
                            <span className="text-sm font-semibold text-white">{item.value}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div className={`h-full w-2/3 rounded-full ${item.color}`} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-lg border border-indigo-400/20 bg-indigo-500/10 p-4">
                      <p className="text-xs font-semibold uppercase text-indigo-200">Interpretasi</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Skor kognitif membantu melihat inkonsistensi jawaban dan efek urutan
                        pertanyaan sebagai konteks tambahan untuk prediksi burnout.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {detailModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-black/50"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-normal text-white">Detail prediksi</h3>
                <p className="text-xs text-slate-500">{detailModal.date}</p>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-900 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Skor burnout', value: detailModal.burnout.toFixed(2), valueClass: getRisk(detailModal.risk).text },
                { label: 'Skor psikosomatis', value: detailModal.psycho.toFixed(2), valueClass: 'text-cyan-300' },
                { label: 'Status risiko', value: getRisk(detailModal.risk).label, valueClass: getRisk(detailModal.risk).text },
                { label: 'ID prediksi', value: `#${detailModal.id}`, valueClass: 'text-slate-200' },
                { label: 'Timestamp', value: formatDateTime(detailModal.timestamp), valueClass: 'text-slate-200' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-3">
                  <span className="text-xs text-slate-500">{item.label}</span>
                  <span className={`text-sm font-semibold ${item.valueClass}`}>{item.value}</span>
                </div>
              ))}

              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Level burnout</span>
                  <span className={`font-semibold ${getRisk(detailModal.risk).text}`}>
                    {detailModal.burnout.toFixed(1)} / {maxScore}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((detailModal.burnout / maxScore) * 100, 100)}%`,
                      backgroundColor: getRisk(detailModal.risk).hex,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>Rendah</span>
                  <span>Sedang</span>
                  <span>Tinggi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
