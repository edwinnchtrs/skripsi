import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Clock,
  Gauge,
  HeartPulse,
  Lightbulb,
  Loader2,
  Minus,
  RotateCcw,
  Shield,
  Sparkles,
  Target,
  TimerReset,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import api from '../api';

interface Question {
  id: string;
  text: string;
  construct_type: string;
}

interface Result {
  risk_level: string;
  burnout_score: number;
  psychosomatic_score: number;
  prediction_id: number;
}

interface ResponseItem {
  id: string;
  construct_type: string;
  value: number;
  reaction_time_ms: number;
}

interface PreviousPrediction {
  burnout: number;
  psycho: number;
  risk: string;
}

const answerOptions = [
  { value: 1, label: 'Sangat Tidak Setuju', short: 'STS', tone: 'rose' },
  { value: 2, label: 'Tidak Setuju', short: 'TS', tone: 'orange' },
  { value: 3, label: 'Netral', short: 'N', tone: 'amber' },
  { value: 4, label: 'Setuju', short: 'S', tone: 'emerald' },
  { value: 5, label: 'Sangat Setuju', short: 'SS', tone: 'cyan' },
];

const constructMeta = {
  fatigue: {
    label: 'Kelelahan',
    icon: HeartPulse,
    text: 'text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-400/25',
    helper: 'Energi, keletihan, dan kapasitas pemulihan.',
  },
  cynicism: {
    label: 'Sinisme',
    icon: Shield,
    text: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/25',
    helper: 'Jarak emosional, kejenuhan, dan sikap terhadap aktivitas.',
  },
  efficacy: {
    label: 'Efikasi',
    icon: Target,
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/25',
    helper: 'Keyakinan, performa, dan rasa mampu menyelesaikan tugas.',
  },
  default: {
    label: 'Refleksi',
    icon: Brain,
    text: 'text-indigo-300',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-400/25',
    helper: 'Respons kognitif untuk membaca pola kondisi hari ini.',
  },
};

const riskMeta = {
  Crisis: {
    label: 'Krisis',
    text: 'text-rose-200',
    bg: 'bg-rose-500/15',
    border: 'border-rose-300/35',
    hex: '#fb7185',
  },
  High: {
    label: 'Tinggi',
    text: 'text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-400/30',
    hex: '#fb7185',
  },
  Medium: {
    label: 'Sedang',
    text: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/30',
    hex: '#f59e0b',
  },
  Low: {
    label: 'Rendah',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/30',
    hex: '#34d399',
  },
};

const getConstructMeta = (type: string) =>
  constructMeta[type as keyof typeof constructMeta] ?? constructMeta.default;

const getRiskMeta = (risk: string) =>
  riskMeta[risk as keyof typeof riskMeta] ?? riskMeta.Low;

const formatReactionTime = (ms: number) => {
  if (!Number.isFinite(ms)) return '-';
  return `${(ms / 1000).toFixed(1)}s`;
};

export default function UserKuisioner() {
  const nav = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [orderType, setOrderType] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [prevPrediction, setPrevPrediction] = useState<PreviousPrediction | null>(null);
  const [selectedVal, setSelectedVal] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);

    try {
      const response = await api.get('/assessment');
      setQuestions(response.data.questions || []);
      setOrderType(response.data.order_type || '');
      startRef.current = Date.now();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const submitAssessment = async (finalResponses: ResponseItem[]) => {
    setSubmitting(true);

    try {
      let previous: PreviousPrediction | null = null;

      try {
        const historyResponse = await api.get('/user/history');
        const predictions = historyResponse.data.predictions || [];

        if (predictions.length > 0) {
          previous = {
            burnout: predictions[0].BurnoutScore,
            psycho: predictions[0].PsychosomaticScore,
            risk: predictions[0].RiskLevel,
          };
        }
      } catch {
        previous = null;
      }

      const response = await api.post('/assessment/submit', {
        order_type: orderType,
        responses: finalResponses,
      });

      setPrevPrediction(previous);
      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert('Gagal mengirim hasil kuisioner. Silakan coba lagi.');
      setAnimating(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = (value: number) => {
    if (animating || questions.length === 0) return;

    setSelectedVal(value);
    setAnimating(true);

    const reactionTime = Date.now() - startRef.current;
    const question = questions[currentIdx];
    const nextResponses = [
      ...responses,
      {
        id: question.id,
        construct_type: question.construct_type,
        value,
        reaction_time_ms: reactionTime,
      },
    ];

    setResponses(nextResponses);

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx((index) => index + 1);
        setSelectedVal(null);
        setAnimating(false);
        startRef.current = Date.now();
      } else {
        submitAssessment(nextResponses);
      }
    }, 340);
  };

  const goBack = () => {
    if (currentIdx === 0 || animating) return;

    setResponses((items) => items.slice(0, -1));
    setCurrentIdx((index) => index - 1);
    setSelectedVal(null);
    startRef.current = Date.now();
  };

  const resetQuestionnaire = () => {
    setResult(null);
    setCurrentIdx(0);
    setResponses([]);
    setSelectedVal(null);
    setPrevPrediction(null);
    setAnimating(false);
    startRef.current = Date.now();
  };

  const progress = questions.length > 0 ? (responses.length / questions.length) * 100 : 0;
  const displayProgress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;
  const currentQuestion = questions[currentIdx];
  const currentMeta = currentQuestion ? getConstructMeta(currentQuestion.construct_type) : constructMeta.default;
  const CurrentIcon = currentMeta.icon;

  const responseStats = useMemo(() => {
    const totalMs = responses.reduce((total, item) => total + item.reaction_time_ms, 0);
    const averageMs = responses.length > 0 ? totalMs / responses.length : 0;
    const averageValue =
      responses.length > 0
        ? responses.reduce((total, item) => total + item.value, 0) / responses.length
        : 0;
    const constructCounts = responses.reduce<Record<string, number>>((acc, item) => {
      acc[item.construct_type] = (acc[item.construct_type] || 0) + 1;
      return acc;
    }, {});

    return { averageMs, averageValue, constructCounts };
  }, [responses]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d14] px-6 text-slate-100">
        <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-2xl shadow-black/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-300" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-normal text-white">Menyiapkan pertanyaan</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Sistem sedang mengambil kuisioner harian dan mengacak urutan asesmen.
          </p>
        </div>
      </div>
    );
  }

  if (submitting && !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d14] px-6 text-slate-100">
        <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-2xl shadow-black/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/10">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-300" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-normal text-white">Menganalisis respons</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Quantum Cognition dan model prediksi sedang membaca pola jawaban, waktu reaksi,
            serta sinyal risiko psikosomatis.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {['Interference', 'Regression', 'Risk map'].map((item) => (
              <div key={item} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3 text-xs text-slate-400">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    const risk = getRiskMeta(result.risk_level);
    const burnoutScore = result.burnout_score || 0;
    const psychoScore = result.psychosomatic_score || 0;
    const gaugePercent = Math.min((burnoutScore / 10) * 100, 100);
    const diff = prevPrediction ? burnoutScore - prevPrediction.burnout : 0;
    const stable = Math.abs(diff) < 0.3;
    const TrendIcon = stable ? Minus : diff > 0 ? TrendingUp : TrendingDown;
    const trendColor = stable ? 'text-slate-400' : diff > 0 ? 'text-rose-300' : 'text-emerald-300';
    const trendLabel = stable
      ? 'Stabil'
      : diff > 0
        ? `Naik ${diff.toFixed(1)}`
        : `Turun ${Math.abs(diff).toFixed(1)}`;
    const recommendations =
      result.risk_level === 'High' || result.risk_level === 'Crisis'
        ? [
            'Ambil jeda pemulihan dan kurangi aktivitas yang paling menguras energi.',
            'Bicarakan kondisi ini dengan orang tepercaya atau pendamping profesional.',
            'Pantau kembali skor harian, terutama jika keluhan fisik ikut meningkat.',
          ]
        : result.risk_level === 'Medium'
          ? [
              'Jadwalkan check-in diri singkat selama beberapa hari ke depan.',
              'Atur prioritas tugas dan sisihkan waktu pemulihan yang benar-benar bebas.',
              'Catat pemicu stres yang paling sering muncul setelah aktivitas harian.',
            ]
          : [
              'Pertahankan ritme tidur, makan, dan aktivitas fisik yang sudah membantu.',
              'Gunakan skor hari ini sebagai baseline untuk membaca perubahan berikutnya.',
              'Tetap lakukan refleksi berkala agar kenaikan risiko terbaca lebih awal.',
            ];

    return (
      <div className="min-h-screen bg-[#0b0d14] px-5 py-6 text-slate-100 md:px-8">
        <div className="mx-auto max-w-6xl space-y-5">
          <header className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
            <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_320px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,197,94,0.20),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(99,102,241,0.18),transparent_26%)]" />
              <div className="relative">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Analisis selesai
                </div>
                <h1 className="text-2xl font-semibold tracking-normal text-white md:text-3xl">
                  Hasil Kuisioner Harian
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Data respons berhasil diproses menjadi skor burnout, risiko psikosomatis,
                  dan rekomendasi tindak lanjut yang bisa kamu pantau dari dashboard.
                </p>
              </div>

              <div className={`relative rounded-xl border p-4 ${risk.border} ${risk.bg}`}>
                <p className="text-xs font-semibold uppercase text-slate-400">Status risiko</p>
                <div className={`mt-2 text-3xl font-semibold ${risk.text}`}>{risk.label}</div>
                <p className="mt-2 text-xs leading-5 text-slate-400">Prediction ID #{result.prediction_id}</p>
              </div>
            </div>
          </header>

          <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Skor utama</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-normal text-white">Burnout gauge</h2>
                </div>
                <Gauge className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              </div>

              <div className="relative mx-auto h-52 w-52">
                <svg className="-rotate-90" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r="74" fill="none" stroke="#1e293b" strokeWidth="14" />
                  <circle
                    cx="90"
                    cy="90"
                    r="74"
                    fill="none"
                    stroke={risk.hex}
                    strokeDasharray={`${465 * (gaugePercent / 100)} 465`}
                    strokeLinecap="round"
                    strokeWidth="14"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-semibold ${risk.text}`}>{burnoutScore.toFixed(1)}</span>
                  <span className="text-xs text-slate-500">dari 10</span>
                </div>
              </div>

              {prevPrediction && (
                <div className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3">
                  <TrendIcon className={`h-4 w-4 ${trendColor}`} aria-hidden="true" />
                  <span className={`text-sm font-semibold ${trendColor}`}>{trendLabel}</span>
                  <span className="text-xs text-slate-500">dari skor sebelumnya {prevPrediction.burnout.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-300" aria-hidden="true" />
                  <h2 className="text-base font-semibold tracking-normal text-white">Breakdown skor</h2>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Burnout', value: burnoutScore, icon: Zap, color: risk.hex },
                    { label: 'Psikosomatis', value: psychoScore, icon: Activity, color: '#22d3ee' },
                    { label: 'Rata-rata respons', value: responseStats.averageValue * 2, icon: Target, color: '#a78bfa' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const width = `${Math.min((item.value / 10) * 100, 100)}%`;

                    return (
                      <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Icon className="h-4 w-4" style={{ color: item.color }} aria-hidden="true" />
                            {item.label}
                          </div>
                          <span className="text-sm font-semibold text-white">{item.value.toFixed(1)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full" style={{ width, backgroundColor: item.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-300" aria-hidden="true" />
                  <h2 className="text-base font-semibold tracking-normal text-white">Rekomendasi</h2>
                </div>

                <div className="space-y-3">
                  {recommendations.map((item) => (
                    <div key={item} className="flex gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                      <p className="text-sm leading-6 text-slate-400">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-5 flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-300" aria-hidden="true" />
                <h2 className="text-base font-semibold tracking-normal text-white">Cara kerja analisis</h2>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    title: 'Reaction time',
                    body: `Rata-rata ${formatReactionTime(responseStats.averageMs)} per pertanyaan sebagai sinyal konsistensi respons.`,
                    icon: TimerReset,
                    color: 'text-cyan-300',
                  },
                  {
                    title: 'Quantum cognition',
                    body: 'Variasi jawaban dan urutan pertanyaan dipakai untuk membaca interference effect.',
                    icon: Brain,
                    color: 'text-violet-300',
                  },
                  {
                    title: 'Prediksi risiko',
                    body: 'Skor burnout dan psikosomatis dihitung lalu diklasifikasikan menjadi status risiko.',
                    icon: Shield,
                    color: 'text-emerald-300',
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.title} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                      <Icon className={`mb-4 h-5 w-5 ${item.color}`} aria-hidden="true" />
                      <h3 className="text-sm font-semibold tracking-normal text-white">{item.title}</h3>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{item.body}</p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-base font-semibold tracking-normal text-white">Aksi berikutnya</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Lanjutkan ke dashboard untuk melihat tren personal, atau ulangi kuisioner jika
                kamu merasa ada jawaban yang kurang mewakili kondisi saat ini.
              </p>
              <div className="mt-5 grid gap-3">
                <button
                  onClick={() => nav('/user/dashboard')}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Lihat dashboard
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={resetQuestionnaire}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Ulangi kuisioner
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d14] px-6 text-slate-100">
        <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-slate-400">
            <ClipboardList className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-lg font-semibold tracking-normal text-white">Belum ada pertanyaan</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Kuisioner harian belum tersedia. Coba buka kembali beberapa saat lagi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d14] px-5 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
          <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_330px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,197,94,0.18),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(45,212,191,0.16),transparent_26%)]" />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Kuisioner harian adaptif
              </div>
              <h1 className="text-2xl font-semibold tracking-normal text-white md:text-3xl">
                Refleksi kondisi hari ini
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Jawab spontan sesuai kondisi saat ini. Sistem membaca nilai jawaban dan
                waktu respons untuk menghasilkan skor burnout dan rekomendasi personal.
              </p>
            </div>

            <div className="relative grid grid-cols-3 gap-3">
              {[
                { label: 'Pertanyaan', value: questions.length, icon: ClipboardList, color: 'text-emerald-300' },
                { label: 'Terjawab', value: responses.length, icon: CheckCircle2, color: 'text-cyan-300' },
                { label: 'Urutan', value: orderType || '-', icon: Brain, color: 'text-violet-300' },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                    <Icon className={`mb-3 h-4 w-4 ${item.color}`} aria-hidden="true" />
                    <div className="truncate text-xl font-semibold text-white">{item.value}</div>
                    <div className="mt-1 text-[11px] leading-4 text-slate-500">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <main className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/20 md:p-6">
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Pertanyaan {currentIdx + 1} dari {questions.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{Math.round(displayProgress)}% menuju hasil analisis</p>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${currentMeta.border} ${currentMeta.bg} ${currentMeta.text}`}>
                  <CurrentIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {currentMeta.label}
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-950">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-indigo-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div key={currentQuestion.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 md:p-7">
              <div className="mb-5 flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${currentMeta.border} ${currentMeta.bg}`}>
                  <CurrentIcon className={`h-6 w-6 ${currentMeta.text}`} aria-hidden="true" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${currentMeta.text}`}>{currentMeta.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{currentMeta.helper}</p>
                </div>
              </div>

              <h2 className="min-h-[88px] text-2xl font-semibold leading-snug tracking-normal text-white md:text-3xl">
                {currentQuestion.text}
              </h2>

              <div className="mt-7 grid gap-3 sm:grid-cols-5">
                {answerOptions.map((option) => {
                  const selected = selectedVal === option.value;
                  const toneClass =
                    option.tone === 'rose'
                      ? 'hover:border-rose-400/40 hover:text-rose-200'
                      : option.tone === 'orange'
                        ? 'hover:border-orange-400/40 hover:text-orange-200'
                        : option.tone === 'amber'
                          ? 'hover:border-amber-400/40 hover:text-amber-200'
                          : option.tone === 'emerald'
                            ? 'hover:border-emerald-400/40 hover:text-emerald-200'
                            : 'hover:border-cyan-400/40 hover:text-cyan-200';
                  const selectedClass =
                    option.tone === 'rose'
                      ? 'border-rose-400/60 bg-rose-500/15 text-rose-200'
                      : option.tone === 'orange'
                        ? 'border-orange-400/60 bg-orange-500/15 text-orange-200'
                        : option.tone === 'amber'
                          ? 'border-amber-400/60 bg-amber-500/15 text-amber-200'
                          : option.tone === 'emerald'
                            ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200'
                            : 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200';

                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      disabled={animating}
                      className={`min-h-[116px] rounded-xl border p-3 text-center transition ${
                        selected
                          ? `${selectedClass} -translate-y-1 shadow-lg shadow-black/20`
                          : `border-slate-800 bg-slate-900 text-slate-400 ${toneClass}`
                      } disabled:cursor-not-allowed disabled:opacity-80`}
                    >
                      <span className="block text-3xl font-semibold">{option.value}</span>
                      <span className="mt-2 block text-xs font-semibold">{option.short}</span>
                      <span className="mt-1 block text-[11px] leading-4">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={goBack}
                  disabled={currentIdx === 0 || animating}
                  className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-medium text-slate-400 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Kembali
                </button>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Pilihan langsung tersimpan setelah diklik
                </div>
              </div>
            </div>
          </main>

          <aside className="space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold tracking-normal text-white">Peta progres</h2>
                  <p className="mt-1 text-xs text-slate-500">Jejak jawaban sesi ini</p>
                </div>
                <Activity className="h-5 w-5 text-cyan-300" aria-hidden="true" />
              </div>

              <div className="grid grid-cols-8 gap-2">
                {questions.map((question, index) => {
                  const answered = index < responses.length;
                  const active = index === currentIdx;
                  const meta = getConstructMeta(question.construct_type);

                  return (
                    <div
                      key={question.id}
                      className={`h-9 rounded-lg border ${
                        answered
                          ? `${meta.border} ${meta.bg}`
                          : active
                            ? 'border-cyan-400/50 bg-cyan-500/10'
                            : 'border-slate-800 bg-slate-950'
                      }`}
                      title={`Pertanyaan ${index + 1}`}
                    />
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-xs text-slate-500">Rata-rata respons</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {responses.length > 0 ? responseStats.averageValue.toFixed(1) : '-'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-xs text-slate-500">Waktu rata-rata</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {responses.length > 0 ? formatReactionTime(responseStats.averageMs) : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-300" aria-hidden="true" />
                <h2 className="text-base font-semibold tracking-normal text-white">Dimensi terjawab</h2>
              </div>

              <div className="space-y-3">
                {(['fatigue', 'cynicism', 'efficacy'] as const).map((type) => {
                  const meta = getConstructMeta(type);
                  const Icon = meta.icon;
                  const count = responseStats.constructCounts[type] || 0;

                  return (
                    <div key={type} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${meta.border} ${meta.bg}`}>
                        <Icon className={`h-4 w-4 ${meta.text}`} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200">{meta.label}</p>
                        <p className="text-xs text-slate-500">{count} respons</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-5">
              <div className="mb-3 flex items-center gap-2 text-emerald-200">
                <Lightbulb className="h-5 w-5" aria-hidden="true" />
                <h2 className="text-sm font-semibold tracking-normal">Tips menjawab</h2>
              </div>
              <p className="text-sm leading-6 text-slate-400">
                Tidak ada jawaban benar atau salah. Pilih yang paling mendekati kondisi
                hari ini agar prediksi lebih jujur dan berguna.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
