import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Zap,
} from 'lucide-react';
import api from '../../api';

interface RecoveryPlanItem {
  day: string;
  title: string;
  body: string;
  category: string;
  intensity?: string;
}

interface MicroAction {
  title: string;
  duration: string;
  reason: string;
}

interface ScheduleBlock {
  time: string;
  title: string;
  duration: string;
  reason: string;
}

interface TimelineItem {
  id: number;
  type: string;
  title: string;
  summary: string;
  risk_level: string;
  score: number;
  created_at: string;
  recommended_action: string;
}

interface CheckIn {
  ID: number;
  MoodScore: number;
  EnergyScore: number;
  SleepHours: number;
  StressScore: number;
  Notes: string;
  Timestamp: string;
}

interface SuggestedCheckIn {
  mood_score: number;
  energy_score: number;
  sleep_hours: number;
  stress_score: number;
  notes: string;
  confidence: number;
  reason: string;
}

const riskStyle: Record<string, { className: string; dot: string; label: string }> = {
  Crisis: { className: 'border-rose-400/35 bg-rose-500/10 text-rose-200', dot: 'bg-rose-300', label: 'Krisis' },
  High: { className: 'border-orange-400/35 bg-orange-500/10 text-orange-200', dot: 'bg-orange-300', label: 'Tinggi' },
  Medium: { className: 'border-amber-400/35 bg-amber-500/10 text-amber-200', dot: 'bg-amber-300', label: 'Sedang' },
  Low: { className: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200', dot: 'bg-emerald-300', label: 'Rendah' },
};

const capacityStyle: Record<string, string> = {
  Rendah: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
  Sedang: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  Stabil: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
};

const formatDate = (value?: string) => {
  if (!value || value.startsWith('0001')) return '-';
  return new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const percentValue = (value?: number) => Math.round(Math.max(0, Math.min(value || 0, 1)) * 100);

const scoreLabel = (value: number, reversed = false) => {
  if (reversed) {
    if (value <= 2) return 'Perlu dijaga';
    if (value <= 3) return 'Cukup';
    return 'Baik';
  }
  if (value >= 4) return 'Tinggi';
  if (value >= 3) return 'Sedang';
  return 'Rendah';
};

export default function UserRecoveryPlan() {
  const [riskLevel, setRiskLevel] = useState('Low');
  const [capacityLabel, setCapacityLabel] = useState('Stabil');
  const [aiSummary, setAiSummary] = useState('');
  const [aiSource, setAiSource] = useState('local-fallback');
  const [focus, setFocus] = useState<string[]>([]);
  const [plan, setPlan] = useState<RecoveryPlanItem[]>([]);
  const [microActions, setMicroActions] = useState<MicroAction[]>([]);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [suggestedCheckIn, setSuggestedCheckIn] = useState<SuggestedCheckIn | null>(null);
  const [safetyFlags, setSafetyFlags] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [privacyNote, setPrivacyNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    mood_score: 3,
    energy_score: 3,
    sleep_hours: 7,
    stress_score: 3,
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [planRes, checkinRes] = await Promise.all([
        api.get('/user/recovery-plan'),
        api.get('/user/checkins'),
      ]);
      setRiskLevel(planRes.data.risk_level || 'Low');
      setCapacityLabel(planRes.data.capacity_label || 'Stabil');
      setAiSummary(planRes.data.ai_summary || '');
      setAiSource(planRes.data.ai_source || 'local-fallback');
      setFocus(planRes.data.focus || []);
      setPlan(planRes.data.plan || []);
      setMicroActions(planRes.data.micro_actions || []);
      setSchedule(planRes.data.schedule || []);
      const suggested = planRes.data.suggested_checkin || null;
      setSuggestedCheckIn(suggested);
      if (suggested) {
        setForm({
          mood_score: suggested.mood_score || 3,
          energy_score: suggested.energy_score || 3,
          sleep_hours: suggested.sleep_hours || 7,
          stress_score: suggested.stress_score || 3,
          notes: suggested.notes || '',
        });
      }
      setSafetyFlags(planRes.data.safety_flags || []);
      setTimeline(planRes.data.timeline_preview || []);
      setPrivacyNote(planRes.data.privacy_note || '');
      setCheckins(checkinRes.data.checkins || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const averages = useMemo(() => {
    if (checkins.length === 0) return { mood: 0, energy: 0, stress: 0, sleep: 0 };
    return {
      mood: checkins.reduce((sum, item) => sum + item.MoodScore, 0) / checkins.length,
      energy: checkins.reduce((sum, item) => sum + item.EnergyScore, 0) / checkins.length,
      stress: checkins.reduce((sum, item) => sum + item.StressScore, 0) / checkins.length,
      sleep: checkins.reduce((sum, item) => sum + item.SleepHours, 0) / checkins.length,
    };
  }, [checkins]);

  const latestCheckIn = checkins[0];
  const risk = riskStyle[riskLevel] || riskStyle.Low;

  const applySuggestedCheckIn = () => {
    if (!suggestedCheckIn) return;
    setForm({
      mood_score: suggestedCheckIn.mood_score || 3,
      energy_score: suggestedCheckIn.energy_score || 3,
      sleep_hours: suggestedCheckIn.sleep_hours || 7,
      stress_score: suggestedCheckIn.stress_score || 3,
      notes: suggestedCheckIn.notes || '',
    });
    setToast('Saran check-in AI diterapkan ke form.');
  };

  const submitCheckIn = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/user/checkins', form);
      setForm((prev) => ({ ...prev, notes: '' }));
      setToast('Check-in tersimpan. AI recovery plan diperbarui.');
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#090b12] px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/80">
          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                  <HeartPulse className="h-3.5 w-3.5" />
                  Personal Recovery Plan
                </span>
                <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${capacityStyle[capacityLabel] || capacityStyle.Stabil}`}>
                  Kapasitas {capacityLabel}
                </span>
                <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
                  {aiSource === 'ai' ? 'AI aktif' : 'Mode lokal'}
                </span>
              </div>
              <h1 className="text-2xl font-semibold tracking-normal text-white">Rencana Pemulihan</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Recovery plan ini membaca check-in, timeline risiko, curhat AI, asesmen, dan rekomendasi terapi untuk menyusun langkah yang realistis.
              </p>

              <div className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-100">
                  <Sparkles className="h-4 w-4" />
                  AI recovery coach
                </div>
                <p className="text-sm leading-6 text-slate-300">
                  {aiSummary || 'Belum ada ringkasan AI. Isi check-in atau kuisioner agar rencana makin personal.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl border p-4 ${risk.className}`}>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className={`h-2 w-2 rounded-full ${risk.dot}`} />
                  Risiko saat ini
                </div>
                <p className="mt-3 text-2xl font-semibold">{risk.label}</p>
              </div>
              {[
                { label: 'Mood', value: averages.mood ? averages.mood.toFixed(1) : '-', sub: scoreLabel(averages.mood || 0, true) },
                { label: 'Energi', value: averages.energy ? averages.energy.toFixed(1) : '-', sub: scoreLabel(averages.energy || 0, true) },
                { label: 'Stres', value: averages.stress ? averages.stress.toFixed(1) : '-', sub: scoreLabel(averages.stress || 0) },
                { label: 'Tidur', value: averages.sleep ? `${averages.sleep.toFixed(1)}j` : '-', sub: latestCheckIn ? '7 hari' : 'Belum ada' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        {toast && (
          <div className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200">
            {toast}
          </div>
        )}

        {loading ? (
          <div className="flex h-96 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        ) : (
          <section className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <form onSubmit={submitCheckIn} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-emerald-200" />
                    <div>
                      <h2 className="text-base font-semibold text-white">Check-in AI hari ini</h2>
                      <p className="text-xs text-slate-500">Otomatis dari AI, bisa diedit sebelum disimpan.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={load}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
                    aria-label="Muat ulang"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                </div>

                {suggestedCheckIn && (
                  <div className="mb-4 rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                          <Sparkles className="h-4 w-4" />
                          Saran check-in otomatis
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-400">{suggestedCheckIn.reason}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-cyan-300/20 bg-slate-950/40 px-2.5 py-1 text-[11px] font-semibold text-cyan-100">
                        {percentValue(suggestedCheckIn.confidence)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Mood', value: suggestedCheckIn.mood_score },
                        { label: 'Energi', value: suggestedCheckIn.energy_score },
                        { label: 'Tidur', value: `${suggestedCheckIn.sleep_hours}j` },
                        { label: 'Stres', value: suggestedCheckIn.stress_score },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-white/10 bg-slate-950/50 p-2">
                          <p className="text-[10px] text-slate-500">{item.label}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={applySuggestedCheckIn}
                      className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-400/10 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Pakai ulang saran AI
                    </button>
                  </div>
                )}

                {[
                  { key: 'mood_score', label: 'Mood', low: 'Berat', high: 'Stabil', reversed: true },
                  { key: 'energy_score', label: 'Energi', low: 'Habis', high: 'Penuh', reversed: true },
                  { key: 'stress_score', label: 'Stres', low: 'Rendah', high: 'Tinggi', reversed: false },
                ].map((item) => {
                  const value = form[item.key as keyof typeof form] as number;

                  return (
                    <label key={item.key} className="mb-4 block rounded-lg border border-white/10 bg-slate-950/50 p-3">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-200">{item.label}</span>
                        <span className="text-xs text-slate-500">{scoreLabel(value, item.reversed)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={1}
                          max={5}
                          value={value}
                          onChange={(event) => setForm((prev) => ({ ...prev, [item.key]: Number(event.target.value) }))}
                          className="min-w-0 flex-1 accent-emerald-300"
                        />
                        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-slate-900 text-sm font-semibold text-white">
                          {value}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between text-[11px] text-slate-600">
                        <span>{item.low}</span>
                        <span>{item.high}</span>
                      </div>
                    </label>
                  );
                })}

                <label className="mb-4 block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Tidur semalam</span>
                  <input
                    type="number"
                    min={0}
                    max={16}
                    step={0.5}
                    value={form.sleep_hours}
                    onChange={(event) => setForm((prev) => ({ ...prev, sleep_hours: Number(event.target.value) }))}
                    className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none transition focus:border-emerald-300/40"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Catatan singkat</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                    rows={4}
                    placeholder="Apa yang paling terasa hari ini?"
                    className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/40"
                  />
                </label>

                <button
                  disabled={saving}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-300 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Simpan ke monitoring admin
                </button>
                <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">
                  Check-in tersimpan ke timeline risiko dan sinyal penting akan muncul di Pusat Risiko admin.
                </p>
              </form>

              <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-200" />
                  <h2 className="text-base font-semibold text-white">Micro-action</h2>
                </div>
                <div className="space-y-3">
                  {microActions.map((item) => (
                    <article key={item.title} className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                        <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-slate-400">{item.duration}</span>
                      </div>
                      <p className="text-xs leading-5 text-slate-500">{item.reason}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <section className="space-y-5">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-200" />
                  <h2 className="text-base font-semibold text-white">Fokus presisi</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {focus.map((item, index) => (
                    <div key={item} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                      <span className="text-[11px] font-semibold uppercase text-cyan-200">Fokus {index + 1}</span>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-rose-200" />
                  <h2 className="text-base font-semibold text-white">Rencana 7 hari</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {plan.map((item) => (
                    <article key={item.day} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase text-slate-500">{item.day}</span>
                        <div className="flex gap-1.5">
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-slate-400">{item.category}</span>
                          {item.intensity && (
                            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-200">{item.intensity}</span>
                          )}
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-cyan-200" />
                  <h2 className="text-base font-semibold text-white">Jadwal hari ini</h2>
                </div>
                <div className="space-y-3">
                  {schedule.map((item) => (
                    <article key={`${item.time}-${item.title}`} className="grid grid-cols-[58px_minmax(0,1fr)] gap-3 rounded-lg border border-white/10 bg-slate-950/60 p-3">
                      <div className="text-sm font-semibold text-cyan-200">{item.time}</div>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                          <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-slate-400">{item.duration}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.reason}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-200" />
                  <h2 className="text-base font-semibold text-white">Timeline risiko</h2>
                </div>
                <div className="max-h-[440px] space-y-3 overflow-y-auto pr-1">
                  {timeline.length === 0 ? (
                    <p className="rounded-lg border border-white/10 bg-slate-950/60 p-5 text-sm text-slate-500">Timeline muncul setelah ada asesmen, curhat, atau check-in.</p>
                  ) : (
                    timeline.slice(0, 10).map((item) => {
                      const itemRisk = riskStyle[item.risk_level] || riskStyle.Low;
                      const width = `${percentValue(item.score)}%`;

                      return (
                        <article key={`${item.type}-${item.id}`} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${itemRisk.className}`}>
                              {itemRisk.label}
                            </span>
                            <span className="text-[11px] text-slate-500">{formatDate(item.created_at)}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                          <p className="mt-1 text-xs leading-5 text-slate-400">{item.summary}</p>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div className={`h-full rounded-full ${itemRisk.dot}`} style={{ width }} />
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-5">
                <div className="mb-3 flex items-center gap-2 text-emerald-200">
                  <ShieldCheck className="h-5 w-5" />
                  <h2 className="text-sm font-semibold">Guardrail dan privasi</h2>
                </div>
                <div className="space-y-2">
                  {safetyFlags.map((item) => (
                    <div key={item} className="flex gap-2 text-xs leading-5 text-slate-300">
                      <TimerReset className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-200" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 border-t border-emerald-300/15 pt-4 text-sm leading-6 text-slate-300">{privacyNote}</p>
              </section>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
