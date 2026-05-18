import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  Bell,
  BellRing,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Clock3,
  FileText,
  Gauge,
  Heart,
  History,
  Inbox,
  Info,
  Loader2,
  MessageCircleReply,
  Search,
  Send,
  Shield,
  Sparkles,
  Target,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import api from '../api';

interface Responden {
  id: number;
  nama: string;
  username: string;
  latest_burnout: number;
  latest_risk: string;
  latest_psychosomatic: number;
  last_activity: string;
  latest_mbti_type?: string;
  latest_mbti_title?: string;
  latest_mbti_summary?: string;
}

interface TreatmentReply {
  ID?: number;
  id?: number;
  Text?: string;
  text?: string;
  Mood?: string;
  mood?: string;
  AdminSeen?: boolean;
  admin_seen?: boolean;
  CreatedAt?: string;
  created_at?: string;
}

interface TreatmentHistory {
  ID: number;
  ModuleName: string;
  Category: string;
  Priority: string;
  Duration: string;
  Status: string;
  FollowUpDate: string;
  CreatedAt: string;
  Replies?: TreatmentReply[];
}

interface AdminReply {
  id: number;
  treatment_id: number;
  user_id: number;
  user_name: string;
  username: string;
  text: string;
  mood: string;
  admin_seen: boolean;
  created_at: string;
  module_name: string;
  category: string;
  priority: string;
  status: string;
}

type RiskFilter = 'all' | 'Crisis' | 'High' | 'Medium' | 'Low' | 'empty';
type ModalTab = 'compose' | 'history' | 'replies';
type ReplyFilter = 'unread' | 'all';

const riskMeta = {
  Crisis: { label: 'Krisis', text: 'text-rose-200', bg: 'bg-rose-500/15', border: 'border-rose-300/35', hex: '#fb7185' },
  High: { label: 'Tinggi', text: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-400/30', hex: '#fb7185' },
  Medium: { label: 'Sedang', text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-400/30', hex: '#f59e0b' },
  Low: { label: 'Rendah', text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-400/30', hex: '#34d399' },
  Unknown: { label: 'Belum ada data', text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-700', hex: '#94a3b8' },
};

const categoryConfig: Record<string, { icon: LucideIcon; label: string; text: string; bg: string; border: string }> = {
  konseling: { icon: Heart, label: 'Konseling Psikologis', text: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-400/25' },
  meditasi: { icon: Brain, label: 'Meditasi & Mindfulness', text: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-400/25' },
  olahraga: { icon: Activity, label: 'Aktivitas Fisik', text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-400/25' },
  istirahat: { icon: Clock, label: 'Manajemen Istirahat', text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-400/25' },
  sosial: { icon: Users, label: 'Dukungan Sosial', text: 'text-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-400/25' },
  edukasi: { icon: Info, label: 'Edukasi Kesehatan Mental', text: 'text-indigo-300', bg: 'bg-indigo-500/10', border: 'border-indigo-400/25' },
  general: { icon: Sparkles, label: 'Rekomendasi Umum', text: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-700' },
};

const categories = [
  { value: 'konseling', label: 'Konseling Psikologis' },
  { value: 'meditasi', label: 'Meditasi & Mindfulness' },
  { value: 'olahraga', label: 'Aktivitas Fisik' },
  { value: 'istirahat', label: 'Manajemen Istirahat' },
  { value: 'sosial', label: 'Dukungan Sosial' },
  { value: 'edukasi', label: 'Edukasi Kesehatan Mental' },
];

const priorityConfig: Record<string, { label: string; className: string; dot: string }> = {
  urgent: { label: 'Urgent', className: 'border-rose-400/30 bg-rose-500/10 text-rose-300', dot: 'bg-rose-300' },
  high: { label: 'Tinggi', className: 'border-orange-400/30 bg-orange-500/10 text-orange-300', dot: 'bg-orange-300' },
  medium: { label: 'Sedang', className: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300', dot: 'bg-cyan-300' },
  low: { label: 'Rendah', className: 'border-slate-600 bg-slate-800/70 text-slate-300', dot: 'bg-slate-400' },
};

const priorities = [
  { value: 'urgent', label: 'URGENT - Segera' },
  { value: 'high', label: 'Tinggi' },
  { value: 'medium', label: 'Sedang' },
  { value: 'low', label: 'Rendah' },
];

const durations = [
  { value: '1_week', label: '1 Minggu' },
  { value: '2_weeks', label: '2 Minggu' },
  { value: '1_month', label: '1 Bulan' },
  { value: '3_months', label: '3 Bulan' },
];

const durationLabel: Record<string, string> = {
  '1_week': '1 Minggu',
  '2_weeks': '2 Minggu',
  '1_month': '1 Bulan',
  '3_months': '3 Bulan',
};

const templates: Record<string, string> = {
  Crisis: 'INTERVENSI KRITIS: 1) Hubungi konselor/psikolog dalam 24 jam. 2) Kurangi beban akademik/kerja secara signifikan. 3) Buat check-in harian dengan pendamping. 4) Libatkan support system terdekat. 5) Evaluasi ulang setelah 3 hari.',
  High: 'RENCANA PENANGANAN: 1) Jadwalkan konseling mingguan. 2) Terapkan manajemen stres terstruktur. 3) Atur ulang prioritas tugas. 4) Aktivitas fisik ringan 3x/minggu. 5) Follow-up dalam 2 minggu.',
  Medium: 'PROGRAM PEMULIHAN: 1) Lakukan check-in diri harian. 2) Terapkan jeda terarah dan teknik pomodoro. 3) Journaling mood singkat. 4) Bergabung dengan dukungan sebaya. 5) Evaluasi bulanan.',
  Low: 'PROGRAM PREVENTIF: 1) Lanjutkan pemantauan harian. 2) Pertahankan rutinitas sehat. 3) Latihan napas 5 menit/hari. 4) Tetap terhubung dengan teman/keluarga. 5) Gunakan asesmen sebagai baseline.',
};

const moodLabel: Record<string, { label: string; className: string }> = {
  better: { label: 'Lebih baik', className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' },
  same: { label: 'Masih sama', className: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300' },
  worse: { label: 'Memburuk', className: 'border-rose-400/30 bg-rose-500/10 text-rose-300' },
};

const getRisk = (risk?: string) => riskMeta[risk as keyof typeof riskMeta] ?? riskMeta.Unknown;
const hasData = (responden: Responden) => Boolean(responden.latest_risk);

const formatDate = (date: string) => {
  if (!date || date.startsWith('0001')) return '-';
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatFullDate = (date?: string) => {
  if (!date || date.startsWith('0001')) return '-';
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const replyId = (reply: TreatmentReply) => reply.id ?? reply.ID ?? 0;
const replyText = (reply: TreatmentReply) => reply.text ?? reply.Text ?? '';
const replyMood = (reply: TreatmentReply) => reply.mood ?? reply.Mood ?? 'same';
const replySeen = (reply: TreatmentReply) => reply.admin_seen ?? reply.AdminSeen ?? false;
const replyDate = (reply: TreatmentReply) => reply.created_at ?? reply.CreatedAt;

export default function Responden() {
  const [data, setData] = useState<Responden[]>([]);
  const [repliesInbox, setRepliesInbox] = useState<AdminReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [replyFilter, setReplyFilter] = useState<ReplyFilter>('unread');
  const [selected, setSelected] = useState<Responden | null>(null);
  const [modalTab, setModalTab] = useState<ModalTab>('compose');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('konseling');
  const [priority, setPriority] = useState('medium');
  const [duration, setDuration] = useState('1_week');
  const [followUpDate, setFollowUpDate] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<TreatmentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [replyReadLoading, setReplyReadLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [respondentsRes, repliesRes] = await Promise.all([
        api.get('/responden'),
        api.get('/admin/treatment-replies').catch(() => ({ data: { replies: [] } })),
      ]);
      setData(respondentsRes.data.respondents || []);
      setRepliesInbox(repliesRes.data.replies || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (userId: number) => {
    setLoadingHistory(true);

    try {
      const response = await api.get(`/admin/users/${userId}/treatments`);
      setHistory(response.data.treatments || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openModal = (responden: Responden, tab: ModalTab = 'compose') => {
    setSelected(responden);
    setModalTab(tab);
    setSent(false);
    setHistory([]);
    setMessage(templates[responden.latest_risk] || templates.Medium);
    setCategory('konseling');
    setPriority(responden.latest_risk === 'Crisis' ? 'urgent' : responden.latest_risk === 'High' ? 'high' : 'medium');
    setDuration('1_week');
    setFollowUpDate('');
    loadHistory(responden.id);
  };

  const openReplyOwner = (reply: AdminReply) => {
    const responden = data.find((item) => item.id === reply.user_id);
    if (responden) {
      openModal(responden, 'replies');
    }
  };

  const handleSend = async () => {
    if (!selected || !message.trim() || sending) return;

    setSending(true);

    try {
      await api.post(`/admin/users/${selected.id}/treatment`, {
        message: message.trim(),
        category,
        priority,
        duration,
        follow_up_date: followUpDate,
      });
      setSent(true);
      setToast({ type: 'success', text: `Rekomendasi terkirim ke ${selected.nama}` });
      loadHistory(selected.id);
      fetchData();
    } catch (error: any) {
      setToast({ type: 'error', text: error.response?.data?.error || 'Gagal mengirim rekomendasi' });
    } finally {
      setSending(false);
    }
  };

  const markReplyRead = async (id: number) => {
    if (!id || replyReadLoading === id) return;
    setReplyReadLoading(id);

    try {
      await api.patch(`/admin/treatment-replies/${id}/read`);
      setRepliesInbox((prev) => prev.map((reply) => (reply.id === id ? { ...reply, admin_seen: true } : reply)));
      setHistory((prev) =>
        prev.map((item) => ({
          ...item,
          Replies: item.Replies?.map((reply) => (replyId(reply) === id ? { ...reply, AdminSeen: true, admin_seen: true } : reply)),
        })),
      );
    } catch {
      setToast({ type: 'error', text: 'Gagal menandai balasan sebagai terbaca' });
    } finally {
      setReplyReadLoading(null);
    }
  };

  const stats = useMemo(() => {
    const withData = data.filter(hasData);
    const high = withData.filter((item) => item.latest_risk === 'High' || item.latest_risk === 'Crisis').length;
    const medium = withData.filter((item) => item.latest_risk === 'Medium').length;
    const low = withData.filter((item) => item.latest_risk === 'Low').length;
    const avgBurnout = withData.length
      ? withData.reduce((sum, item) => sum + item.latest_burnout, 0) / withData.length
      : 0;
    const unreadReplies = repliesInbox.filter((reply) => !reply.admin_seen).length;
    return { withData, high, medium, low, avgBurnout, unreadReplies };
  }, [data, repliesInbox]);

  const filtered = useMemo(() => {
    return data.filter((responden) => {
      const keyword = search.toLowerCase();
      const matchSearch =
        responden.nama.toLowerCase().includes(keyword) ||
        responden.username.toLowerCase().includes(keyword);
      const matchRisk =
        riskFilter === 'all' ||
        (riskFilter === 'empty' && !hasData(responden)) ||
        responden.latest_risk === riskFilter;
      return matchSearch && matchRisk;
    });
  }, [data, riskFilter, search]);

  const filteredReplies = useMemo(() => {
    if (replyFilter === 'unread') return repliesInbox.filter((reply) => !reply.admin_seen);
    return repliesInbox;
  }, [repliesInbox, replyFilter]);

  const selectedReplies = useMemo(() => {
    if (!selected) return [];
    return history.flatMap((item) => (item.Replies || []).map((reply) => ({ reply, treatment: item })));
  }, [history, selected]);

  return (
    <div className="min-h-screen bg-[#0b0d14] px-5 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
          <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_460px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(99,102,241,0.20),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(34,197,94,0.14),transparent_26%),radial-gradient(circle_at_65%_90%,rgba(251,191,36,0.10),transparent_24%)]" />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Admin response center
              </div>
              <h1 className="text-2xl font-semibold tracking-normal text-white md:text-3xl">
                Data Responden
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Pantau risiko burnout, kirim rekomendasi terapi, dan tanggapi balasan user
                dari notifikasi terapi dalam satu ruang kerja admin.
              </p>
            </div>

            <div className="relative grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Responden', value: data.length, icon: Users, color: 'text-indigo-300' },
                { label: 'Data aktif', value: stats.withData.length, icon: CheckCircle2, color: 'text-emerald-300' },
                { label: 'Risiko tinggi', value: stats.high, icon: Shield, color: 'text-rose-300' },
                { label: 'Balasan baru', value: stats.unreadReplies, icon: Inbox, color: 'text-amber-300' },
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

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${
                toast.type === 'success'
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-400/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <main className="space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 focus-within:border-indigo-400/50 focus-within:ring-4 focus-within:ring-indigo-500/10">
                  <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari nama atau username..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
                  />
                  <span className="text-xs text-slate-600">{filtered.length}/{data.length}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all' as const, label: 'Semua' },
                    { key: 'Crisis' as const, label: 'Krisis' },
                    { key: 'High' as const, label: 'Tinggi' },
                    { key: 'Medium' as const, label: 'Sedang' },
                    { key: 'Low' as const, label: 'Rendah' },
                    { key: 'empty' as const, label: 'Tanpa data' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setRiskFilter(item.key)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        riskFilter === item.key
                          ? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200'
                          : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex h-[420px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" aria-hidden="true" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-12 text-center">
                <Users className="mx-auto h-10 w-10 text-slate-600" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold tracking-normal text-white">Responden tidak ditemukan</h2>
                <p className="mt-2 text-sm text-slate-500">Coba ubah kata kunci atau filter risiko.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filtered.map((responden) => {
                  const risk = getRisk(responden.latest_risk);
                  const inboxCount = repliesInbox.filter((reply) => reply.user_id === responden.id && !reply.admin_seen).length;

                  return (
                    <motion.article
                      key={responden.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-xl border bg-slate-900/70 p-5 transition hover:-translate-y-0.5 hover:border-slate-700 ${
                        responden.latest_risk === 'Crisis' ? 'border-rose-400/30' : 'border-slate-800'
                      }`}
                    >
                      <div className="mb-4 flex items-start gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${risk.border} ${risk.bg}`}>
                          <span className={`text-lg font-semibold ${risk.text}`}>{responden.nama.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-base font-semibold tracking-normal text-white">{responden.nama}</h2>
                          <p className="truncate text-xs text-slate-500">@{responden.username} · ID {responden.id}</p>
                          {responden.latest_mbti_type && (
                            <p className="mt-1 inline-flex rounded-full border border-violet-400/25 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-200">
                              MBTI {responden.latest_mbti_type}
                            </p>
                          )}
                        </div>
                        {inboxCount > 0 && (
                          <button
                            onClick={() => openModal(responden, 'replies')}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300"
                          >
                            <BellRing className="h-3.5 w-3.5" />
                            {inboxCount}
                          </button>
                        )}
                      </div>

                      {hasData(responden) ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                              <Gauge className="h-3.5 w-3.5" />
                              Burnout
                            </div>
                            <div className="text-2xl font-semibold text-white">{responden.latest_burnout.toFixed(1)}</div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.min(responden.latest_burnout * 10, 100)}%`, backgroundColor: risk.hex }}
                              />
                            </div>
                          </div>
                          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                              <Activity className="h-3.5 w-3.5" />
                              Psikosomatis
                            </div>
                            <div className="text-2xl font-semibold text-white">{responden.latest_psychosomatic.toFixed(1)}</div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-cyan-300"
                                style={{ width: `${Math.min(responden.latest_psychosomatic * 10, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-5 text-center text-sm text-slate-500">
                          Belum ada data asesmen
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span className={`rounded-full border px-2.5 py-1 font-semibold ${risk.border} ${risk.bg} ${risk.text}`}>
                          {risk.label}
                        </span>
                        <span>Aktivitas: {formatDate(responden.last_activity)}</span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => openModal(responden, 'compose')}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-500 text-sm font-semibold text-white transition hover:bg-indigo-400"
                        >
                          <FileText className="h-4 w-4" />
                          Penanganan
                        </button>
                        <button
                          onClick={() => openModal(responden, 'history')}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                        >
                          <History className="h-4 w-4" />
                          Riwayat
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </main>

          <aside className="space-y-5">
            <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold tracking-normal text-white">Notifikasi balasan</h2>
                  <p className="text-xs text-slate-500">Balasan user dari saran terapi</p>
                </div>
                <Inbox className="h-5 w-5 text-amber-300" />
              </div>

              <div className="mb-4 flex w-fit rounded-lg border border-slate-800 bg-slate-950 p-1">
                {[
                  { key: 'unread' as const, label: `Baru (${stats.unreadReplies})` },
                  { key: 'all' as const, label: `Semua (${repliesInbox.length})` },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setReplyFilter(item.key)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      replyFilter === item.key ? 'bg-amber-500/15 text-amber-200' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">
                {filteredReplies.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-8 text-center">
                    <Bell className="mx-auto h-8 w-8 text-slate-600" />
                    <p className="mt-3 text-sm text-slate-500">Belum ada balasan pada filter ini.</p>
                  </div>
                ) : (
                  filteredReplies.map((reply) => {
                    const mood = moodLabel[reply.mood] || moodLabel.same;
                    const category = categoryConfig[reply.category] || categoryConfig.general;
                    const CategoryIcon = category.icon;

                    return (
                      <article
                        key={reply.id}
                        className={`rounded-xl border p-4 transition ${
                          reply.admin_seen ? 'border-slate-800 bg-slate-950/60' : 'border-amber-400/30 bg-amber-500/10'
                        }`}
                      >
                        <div className="mb-3 flex items-start gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${category.border} ${category.bg}`}>
                            <CategoryIcon className={`h-5 w-5 ${category.text}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold text-white">{reply.user_name || 'User'}</h3>
                            <p className="truncate text-xs text-slate-500">@{reply.username}</p>
                          </div>
                          {!reply.admin_seen && <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />}
                        </div>

                        <p className="line-clamp-3 text-sm leading-6 text-slate-300">{reply.text}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${mood.className}`}>{mood.label}</span>
                          <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-500">
                            {formatFullDate(reply.created_at)}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => openReplyOwner(reply)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 text-xs font-semibold text-slate-300 transition hover:border-indigo-400/40 hover:text-indigo-200"
                          >
                            <MessageCircleReply className="h-3.5 w-3.5" />
                            Buka thread
                          </button>
                          {!reply.admin_seen ? (
                            <button
                              onClick={() => markReplyRead(reply.id)}
                              disabled={replyReadLoading === reply.id}
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-500 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                            >
                              {replyReadLoading === reply.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Terbaca
                            </button>
                          ) : (
                            <span className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-600">
                              Sudah dibaca
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-4 text-base font-semibold tracking-normal text-white">Ringkasan risiko</h2>
              <div className="space-y-4">
                {[
                  { label: 'Tinggi/Krisis', value: stats.high, color: 'bg-rose-300' },
                  { label: 'Sedang', value: stats.medium, color: 'bg-amber-300' },
                  { label: 'Rendah', value: stats.low, color: 'bg-emerald-300' },
                ].map((item) => {
                  const width = `${Math.min((item.value / Math.max(stats.withData.length, 1)) * 100, 100)}%`;
                  return (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500">{item.label}</span>
                        <span className="font-semibold text-white">{item.value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-950">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">Rata-rata burnout</p>
                <p className="mt-1 text-2xl font-semibold text-white">{stats.avgBurnout.toFixed(1)}</p>
              </div>
            </section>
          </aside>
        </section>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={() => !sending && setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-black/60"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-normal text-white">Pusat Penanganan Responden</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {selected.nama} · @{selected.username}
                    {hasData(selected) && (
                      <span className={`ml-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${getRisk(selected.latest_risk).border} ${getRisk(selected.latest_risk).bg} ${getRisk(selected.latest_risk).text}`}>
                        {getRisk(selected.latest_risk).label}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => !sending && setSelected(null)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-900 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs text-slate-500">Burnout</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{hasData(selected) ? selected.latest_burnout.toFixed(1) : '-'}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs text-slate-500">Psikosomatis</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{hasData(selected) ? selected.latest_psychosomatic.toFixed(1) : '-'}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs text-slate-500">Balasan user</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{selectedReplies.length}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs text-slate-500">MBTI terbaru</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{selected.latest_mbti_type || '-'}</p>
                </div>
              </div>

              {selected.latest_mbti_type && (
                <div className="mb-5 rounded-xl border border-violet-400/20 bg-violet-500/10 p-4">
                  <p className="text-xs font-semibold uppercase text-violet-200">
                    {selected.latest_mbti_type} {selected.latest_mbti_title ? `- ${selected.latest_mbti_title}` : ''}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {selected.latest_mbti_summary || 'Belum ada ringkasan MBTI.'}
                  </p>
                </div>
              )}

              <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
                {[
                  { key: 'compose' as const, label: 'Kirim saran', icon: Send },
                  { key: 'history' as const, label: `Riwayat (${history.length})`, icon: History },
                  { key: 'replies' as const, label: `Balasan (${selectedReplies.length})`, icon: Inbox },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setModalTab(tab.key)}
                      className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                        modalTab === tab.key
                          ? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200'
                          : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {sent && modalTab === 'compose' ? (
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-10 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
                  <h3 className="mt-4 text-lg font-semibold tracking-normal text-white">Rekomendasi terkirim</h3>
                  <p className="mt-2 text-sm text-slate-400">{selected.nama} akan menerima saran ini di halaman curhat/notifikasi terapi.</p>
                  <button
                    onClick={() => setSelected(null)}
                    className="mt-5 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    Selesai
                  </button>
                </div>
              ) : modalTab === 'compose' ? (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">Kategori</span>
                        <select
                          value={category}
                          onChange={(event) => setCategory(event.target.value)}
                          className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-100 outline-none focus:border-indigo-400/50"
                        >
                          {categories.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">Prioritas</span>
                        <select
                          value={priority}
                          onChange={(event) => setPriority(event.target.value)}
                          className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-100 outline-none focus:border-indigo-400/50"
                        >
                          {priorities.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">Durasi</span>
                        <select
                          value={duration}
                          onChange={(event) => setDuration(event.target.value)}
                          className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-100 outline-none focus:border-indigo-400/50"
                        >
                          {durations.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">Follow-up</span>
                        <input
                          type="date"
                          value={followUpDate}
                          onChange={(event) => setFollowUpDate(event.target.value)}
                          className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-100 outline-none focus:border-indigo-400/50"
                        />
                      </label>
                    </div>

                    <div>
                      <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">Template cepat</span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(templates).map(([risk, template]) => (
                          <button
                            key={risk}
                            onClick={() => setMessage(template)}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${getRisk(risk).border} ${getRisk(risk).bg} ${getRisk(risk).text}`}
                          >
                            {getRisk(risk).label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">Rencana penanganan</span>
                      <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        rows={9}
                        placeholder="Tulis rekomendasi yang akan dikirim ke user..."
                        className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </label>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelected(null)}
                        className="h-11 flex-1 rounded-lg border border-slate-700 bg-slate-950 text-sm font-semibold text-slate-400 transition hover:text-white"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={!message.trim() || sending}
                        className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-lg bg-indigo-500 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                      >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {sending ? 'Mengirim...' : 'Kirim rekomendasi'}
                      </button>
                    </div>
                  </div>

                  <aside className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-indigo-300" />
                      <h3 className="text-sm font-semibold tracking-normal text-white">Pratinjau notifikasi</h3>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                      <span className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priorityConfig[priority]?.className}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${priorityConfig[priority]?.dot}`} />
                        {priorityConfig[priority]?.label}
                      </span>
                      <p className="text-sm leading-6 text-slate-300">{message.slice(0, 220)}{message.length > 220 ? '...' : ''}</p>
                      {followUpDate && <p className="mt-3 text-xs text-emerald-300">Follow-up: {formatDate(followUpDate)}</p>}
                    </div>
                  </aside>
                </div>
              ) : modalTab === 'history' ? (
                <div>
                  {loadingHistory ? (
                    <div className="flex h-48 items-center justify-center">
                      <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-10 text-center text-sm text-slate-500">
                      Belum ada riwayat penanganan.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => {
                        const priority = priorityConfig[item.Priority] || priorityConfig.medium;
                        const category = categoryConfig[item.Category] || categoryConfig.general;
                        const CategoryIcon = category.icon;
                        return (
                          <article key={item.ID} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <CategoryIcon className={`h-4 w-4 ${category.text}`} />
                              <span className="font-semibold text-white">{category.label}</span>
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priority.className}`}>{priority.label}</span>
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                item.Status === 'completed'
                                  ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'
                                  : 'border-amber-400/25 bg-amber-500/10 text-amber-300'
                              }`}>
                                {item.Status === 'completed' ? 'Selesai' : 'Pending'}
                              </span>
                              <span className="ml-auto text-xs text-slate-500">{formatFullDate(item.CreatedAt)}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.ModuleName}</p>
                            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                              <span>Durasi: {durationLabel[item.Duration] || item.Duration}</span>
                              <span>Follow-up: {formatDate(item.FollowUpDate)}</span>
                              <span>Balasan user: {item.Replies?.length || 0}</span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {loadingHistory ? (
                    <div className="flex h-48 items-center justify-center">
                      <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
                    </div>
                  ) : selectedReplies.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-10 text-center text-sm text-slate-500">
                      Belum ada balasan user untuk rekomendasi terapi.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedReplies.map(({ reply, treatment }) => {
                        const id = replyId(reply);
                        const mood = moodLabel[replyMood(reply)] || moodLabel.same;
                        return (
                          <article key={id} className={`rounded-xl border p-4 ${replySeen(reply) ? 'border-slate-800 bg-slate-900/70' : 'border-amber-400/30 bg-amber-500/10'}`}>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <MessageCircleReply className="h-4 w-4 text-cyan-300" />
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${mood.className}`}>{mood.label}</span>
                              <span className="text-xs text-slate-500">{formatFullDate(replyDate(reply))}</span>
                              {!replySeen(reply) && (
                                <button
                                  onClick={() => markReplyRead(id)}
                                  disabled={replyReadLoading === id}
                                  className="ml-auto inline-flex h-8 items-center gap-2 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
                                >
                                  {replyReadLoading === id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                  Tandai terbaca
                                </button>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{replyText(reply)}</p>
                            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Terkait rekomendasi</p>
                              <p className="line-clamp-2 text-xs leading-5 text-slate-400">{treatment.ModuleName}</p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
