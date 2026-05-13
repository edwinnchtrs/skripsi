import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  BellRing,
  Bot,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Clock3,
  Gauge,
  Heart,
  History,
  Info,
  Lightbulb,
  Loader2,
  MessageCircleReply,
  MessageSquareHeart,
  Send,
  Shield,
  Smile,
  Sparkles,
  Target,
  TimerReset,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api';

interface Curhat {
  ID: number;
  Text: string;
  AIResponse: string;
  StressScore: number;
  Timestamp: string;
}

interface TherapyNotif {
  ID: number;
  ModuleName: string;
  Category: string;
  Priority: string;
  Duration: string;
  Status: string;
  FollowUpDate: string;
  CreatedAt: string;
}

interface TreatmentReply {
  ID: number;
  TherapyRecommendationID: number;
  UserID: number;
  Text: string;
  Mood: string;
  CreatedAt: string;
}

type TabKey = 'chat' | 'saran';
type SuggestionFilter = 'all' | 'pending' | 'completed';

const categoryConfig: Record<string, { icon: LucideIcon; color: string; label: string; bg: string; border: string }> = {
  konseling: { icon: Heart, color: 'text-rose-300', label: 'Konseling Psikologis', bg: 'bg-rose-500/10', border: 'border-rose-400/25' },
  meditasi: { icon: Brain, color: 'text-violet-300', label: 'Meditasi & Mindfulness', bg: 'bg-violet-500/10', border: 'border-violet-400/25' },
  olahraga: { icon: Activity, color: 'text-emerald-300', label: 'Aktivitas Fisik', bg: 'bg-emerald-500/10', border: 'border-emerald-400/25' },
  istirahat: { icon: Clock, color: 'text-amber-300', label: 'Manajemen Istirahat', bg: 'bg-amber-500/10', border: 'border-amber-400/25' },
  sosial: { icon: Users, color: 'text-cyan-300', label: 'Dukungan Sosial', bg: 'bg-cyan-500/10', border: 'border-cyan-400/25' },
  edukasi: { icon: Info, color: 'text-indigo-300', label: 'Edukasi Kesehatan', bg: 'bg-indigo-500/10', border: 'border-indigo-400/25' },
  general: { icon: Lightbulb, color: 'text-slate-300', label: 'Rekomendasi Umum', bg: 'bg-slate-500/10', border: 'border-slate-600' },
};

const priorityConfig: Record<string, { label: string; className: string; dot: string }> = {
  urgent: { label: 'Urgent', className: 'border-rose-400/30 bg-rose-500/10 text-rose-300', dot: 'bg-rose-300' },
  high: { label: 'Tinggi', className: 'border-orange-400/30 bg-orange-500/10 text-orange-300', dot: 'bg-orange-300' },
  medium: { label: 'Sedang', className: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300', dot: 'bg-cyan-300' },
  low: { label: 'Rendah', className: 'border-slate-600 bg-slate-800/70 text-slate-300', dot: 'bg-slate-400' },
};

const durationLabel: Record<string, string> = {
  '1_week': '1 Minggu',
  '2_weeks': '2 Minggu',
  '1_month': '1 Bulan',
  '3_months': '3 Bulan',
};

const quickPrompts = [
  'Aku merasa sangat lelah hari ini.',
  'Aku bingung harus mulai dari mana.',
  'Aku butuh cara menenangkan diri.',
  'Aku merasa tekanan kuliah/kerja terlalu berat.',
];

const replyTemplates = [
  'Saya sudah mulai mencoba saran ini hari ini.',
  'Saya masih kesulitan menjalankan saran ini, terutama bagian...',
  'Saran ini membantu, tapi saya butuh langkah yang lebih sederhana.',
];

const moodOptions = [
  { key: 'better', label: 'Lebih baik', className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' },
  { key: 'same', label: 'Masih sama', className: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300' },
  { key: 'worse', label: 'Memburuk', className: 'border-rose-400/30 bg-rose-500/10 text-rose-300' },
];

const stressLevel = (score: number) => {
  if (score > 0.7) return { label: 'Tinggi', text: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-400/30', hex: '#fb7185' };
  if (score > 0.4) return { label: 'Sedang', text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-400/30', hex: '#f59e0b' };
  return { label: 'Rendah', text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-400/30', hex: '#34d399' };
};

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const formatFullDate = (date: string) => {
  if (!date || date.startsWith('0001')) return '-';
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function UserCurhat() {
  const [activeTab, setActiveTab] = useState<TabKey>('chat');
  const [curhats, setCurhats] = useState<Curhat[]>([]);
  const [notifications, setNotifications] = useState<TherapyNotif[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedNotif, setExpandedNotif] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [suggestionFilter, setSuggestionFilter] = useState<SuggestionFilter>('all');
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [replyMood, setReplyMood] = useState<Record<number, string>>({});
  const [replyLoading, setReplyLoading] = useState<number | null>(null);
  const [replies, setReplies] = useState<Record<number, TreatmentReply[]>>({});
  const [replyDraftOpen, setReplyDraftOpen] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const [notifRes, unreadRes] = await Promise.all([
          api.get('/user/notifications'),
          api.get('/notifications/unread'),
        ]);
        if (notifRes.data.notifications) setNotifications(notifRes.data.notifications);
        if (unreadRes.data.notifications) setUnreadCount(unreadRes.data.notifications.length);
      } catch {
        // Polling should stay quiet if the session expires or the server is refreshing.
      }
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [curhats, sending]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [chatRes, notifRes, unreadRes] = await Promise.all([
        api.get('/user/curhat'),
        api.get('/user/notifications'),
        api.get('/notifications/unread'),
      ]);

      if (chatRes.data.curhats) setCurhats(chatRes.data.curhats);
      if (notifRes.data.notifications) setNotifications(notifRes.data.notifications);
      if (unreadRes.data.notifications) setUnreadCount(unreadRes.data.notifications.length);

      const unread = unreadRes.data.notifications || [];
      await Promise.all(unread.map((notification: { ID: number }) => api.post(`/notifications/${notification.ID}/read`).catch(() => {})));
    } catch {
      // Keep the page usable even when API data is unavailable.
    } finally {
      setLoading(false);
    }
  };

  const fetchTreatmentReplies = async (id: number) => {
    try {
      const response = await api.get(`/user/treatment/${id}/replies`);
      setReplies((prev) => ({ ...prev, [id]: response.data.replies || [] }));
    } catch {
      setReplies((prev) => ({ ...prev, [id]: prev[id] || [] }));
    }
  };

  const toggleNotification = async (id: number) => {
    const next = expandedNotif === id ? null : id;
    setExpandedNotif(next);

    if (next && !replies[id]) {
      await fetchTreatmentReplies(id);
    }
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    try {
      const response = await api.post('/curhat/submit', { text });
      if (response.data.curhat) setCurhats((prev) => [...prev, response.data.curhat]);
    } catch {
      setInputText(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const markComplete = async (id: number) => {
    setActionLoading(id);

    try {
      const response = await api.patch(`/user/treatment/${id}/status`, { status: 'completed' });
      setNotifications((prev) => prev.map((item) => (item.ID === id ? { ...item, Status: response.data.treatment?.Status || 'completed' } : item)));
    } catch {
      // Leave current status unchanged if the API fails.
    } finally {
      setActionLoading(null);
    }
  };

  const reopenTreatment = async (id: number) => {
    setActionLoading(id);

    try {
      const response = await api.patch(`/user/treatment/${id}/status`, { status: 'pending' });
      setNotifications((prev) => prev.map((item) => (item.ID === id ? { ...item, Status: response.data.treatment?.Status || 'pending' } : item)));
    } catch {
      // Leave current status unchanged if the API fails.
    } finally {
      setActionLoading(null);
    }
  };

  const sendTreatmentReply = async (id: number) => {
    const text = (replyText[id] || '').trim();
    if (!text || replyLoading === id) return;

    setReplyLoading(id);

    try {
      const response = await api.post(`/user/treatment/${id}/replies`, {
        text,
        mood: replyMood[id] || 'same',
      });
      setReplies((prev) => ({ ...prev, [id]: [...(prev[id] || []), response.data.reply] }));
      setReplyText((prev) => ({ ...prev, [id]: '' }));
      setReplyMood((prev) => ({ ...prev, [id]: 'same' }));
      setReplyDraftOpen(null);
    } catch {
      // Draft remains in place so the user can retry.
    } finally {
      setReplyLoading(null);
    }
  };

  const stats = useMemo(() => {
    const avgStress = curhats.length > 0 ? curhats.reduce((sum, item) => sum + item.StressScore, 0) / curhats.length : 0;
    const latestStress = curhats.length > 0 ? curhats[curhats.length - 1].StressScore : 0;
    const pending = notifications.filter((item) => item.Status === 'pending').length;
    const completed = notifications.filter((item) => item.Status === 'completed').length;
    const highStress = curhats.filter((item) => item.StressScore > 0.7).length;
    return { avgStress, latestStress, pending, completed, highStress };
  }, [curhats, notifications]);

  const filteredNotifications = useMemo(() => {
    if (suggestionFilter === 'pending') return notifications.filter((item) => item.Status === 'pending');
    if (suggestionFilter === 'completed') return notifications.filter((item) => item.Status === 'completed');
    return notifications;
  }, [notifications, suggestionFilter]);

  const trendData = useMemo(
    () => curhats.slice(-10).map((item, index) => ({ name: index + 1, stress: Math.round(item.StressScore * 100) })),
    [curhats],
  );

  const avgStressLevel = stressLevel(stats.avgStress);
  const latestStressLevel = stressLevel(stats.latestStress);

  return (
    <div className="min-h-screen bg-[#0b0d14] px-5 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
          <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_420px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(236,72,153,0.18),transparent_28%),radial-gradient(circle_at_86%_10%,rgba(168,85,247,0.18),transparent_25%),radial-gradient(circle_at_72%_85%,rgba(34,211,238,0.10),transparent_24%)]" />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-400/20 bg-pink-500/10 px-3 py-1.5 text-xs font-medium text-pink-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Ruang aman, anonim, dan responsif
              </div>
              <h1 className="text-2xl font-semibold tracking-normal text-white md:text-3xl">
                Ruang Curhat AI
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Ceritakan kondisi kamu, pantau level stres, dan tindak lanjuti saran admin
                dengan balasan, catatan mood, serta status progres yang tersimpan.
              </p>
            </div>

            <div className="relative grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Curhat', value: curhats.length, icon: MessageSquareHeart, color: 'text-pink-300' },
                { label: 'Avg stres', value: `${Math.round(stats.avgStress * 100)}%`, icon: Gauge, color: avgStressLevel.text },
                { label: 'Saran aktif', value: stats.pending, icon: BellRing, color: 'text-amber-300' },
                { label: 'Selesai', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-300' },
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

        <nav className="flex w-fit rounded-xl border border-slate-800 bg-slate-900/70 p-1">
          {[
            { key: 'chat' as const, label: 'Curhat AI', icon: Bot, badge: 0 },
            { key: 'saran' as const, label: 'Saran Admin', icon: BellRing, badge: stats.pending },
          ].map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
                  activeTab === tab.key ? 'bg-pink-500/15 text-pink-200' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {activeTab === 'chat' ? (
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <main className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500">
                    <Bot className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold tracking-normal text-white">Nexus AI Companion</h2>
                    <p className="flex items-center gap-2 text-xs text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      Online dan siap mendengar
                    </p>
                  </div>
                </div>
                <div className={`hidden rounded-full border px-3 py-1.5 text-xs font-semibold md:inline-flex ${latestStressLevel.border} ${latestStressLevel.bg} ${latestStressLevel.text}`}>
                  Stres terbaru {latestStressLevel.label}
                </div>
              </div>

              <div className="flex max-h-[540px] min-h-[430px] flex-col gap-4 overflow-y-auto px-5 py-5">
                {loading ? (
                  <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-slate-500" aria-hidden="true" />
                  </div>
                ) : curhats.length === 0 ? (
                  <div className="m-auto max-w-xl text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-pink-400/20 bg-pink-500/10 text-pink-300">
                      <MessageSquareHeart className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h2 className="mt-5 text-lg font-semibold tracking-normal text-white">Mulai dari satu kalimat</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Tulis apa yang terasa berat. Respons AI akan membantu kamu menamai
                      kondisi dan membaca tingkat stres dari cerita tersebut.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {quickPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => setInputText(prompt)}
                          className="rounded-full border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 transition hover:border-pink-400/40 hover:text-pink-200"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  curhats.map((chat) => {
                    const stress = stressLevel(chat.StressScore);

                    return (
                      <motion.div
                        key={chat.ID}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="flex justify-end gap-3">
                          <div className="max-w-[78%]">
                            <div className="rounded-[20px] rounded-br-md bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-3 text-sm leading-6 text-white">
                              {chat.Text}
                            </div>
                            <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-slate-600">
                              <span>{formatTime(chat.Timestamp)}</span>
                              <span className={`rounded-full border px-2 py-0.5 font-semibold ${stress.border} ${stress.bg} ${stress.text}`}>
                                Stres {stress.label} {Math.round(chat.StressScore * 100)}%
                              </span>
                            </div>
                          </div>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
                            <User className="h-4 w-4" aria-hidden="true" />
                          </div>
                        </div>

                        <div className="flex justify-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500">
                            <Bot className="h-4 w-4 text-white" aria-hidden="true" />
                          </div>
                          <div className="max-w-[78%] rounded-[20px] rounded-bl-md border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm leading-6">
                            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-pink-300">
                              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                              NEXUS AI
                            </div>
                            <p className="whitespace-pre-wrap text-slate-300">
                              {chat.AIResponse || 'Terima kasih sudah berbagi. Aku di sini untuk mendengarkan.'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}

                {sending && (
                  <div className="flex justify-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500">
                      <Bot className="h-4 w-4 text-white" aria-hidden="true" />
                    </div>
                    <div className="flex items-center gap-1 rounded-[20px] rounded-bl-md border border-slate-800 bg-slate-950 px-4 py-3">
                      {[0, 1, 2].map((item) => (
                        <span
                          key={item}
                          className="h-2 w-2 animate-pulse rounded-full bg-pink-300"
                          style={{ animationDelay: `${item * 120}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-slate-800 bg-slate-950/80 p-4">
                <form onSubmit={handleSend} className="flex gap-3">
                  <input
                    ref={inputRef}
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    placeholder="Tulis curhatanmu di sini..."
                    disabled={sending}
                    className="h-12 min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-pink-400/50 focus:ring-4 focus:ring-pink-500/10 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-500 text-white transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </form>
              </div>
            </main>

            <aside className="space-y-5">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold tracking-normal text-white">Monitor stres</h2>
                    <p className="text-xs text-slate-500">Berdasarkan cerita terakhir</p>
                  </div>
                  <Gauge className={`h-5 w-5 ${avgStressLevel.text}`} aria-hidden="true" />
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className={`text-3xl font-semibold ${avgStressLevel.text}`}>{Math.round(stats.avgStress * 100)}%</div>
                  <p className="mt-1 text-sm text-slate-400">Rata-rata stres {avgStressLevel.label}</p>
                </div>

                <div className="mt-4 h-[120px] min-h-[120px] min-w-0 overflow-hidden">
                  {trendData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={120} minWidth={1} minHeight={1}>
                      <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="stressFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          contentStyle={{
                            background: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: 10,
                            color: '#e2e8f0',
                            fontSize: 12,
                          }}
                        />
                        <Area type="monotone" dataKey="stress" stroke="#ec4899" strokeWidth={2} fill="url(#stressFill)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-600">
                      Tren muncul setelah beberapa curhat
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                <h2 className="mb-4 text-base font-semibold tracking-normal text-white">Level stres</h2>
                <div className="space-y-3">
                  {[
                    { icon: Smile, label: 'Rendah', desc: 'Kondisi relatif terkendali', level: stressLevel(0.2) },
                    { icon: AlertCircle, label: 'Sedang', desc: 'Butuh perhatian dan jeda', level: stressLevel(0.55) },
                    { icon: Zap, label: 'Tinggi', desc: 'Perlu dukungan lebih aktif', level: stressLevel(0.85) },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.label} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                        <Icon className={`h-5 w-5 ${item.level.text}`} aria-hidden="true" />
                        <div>
                          <p className={`text-sm font-semibold ${item.level.text}`}>{item.label}</p>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          </section>
        ) : (
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <main className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/20">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-amber-200">
                    <BellRing className="h-5 w-5" aria-hidden="true" />
                    <h2 className="text-lg font-semibold tracking-normal text-white">Saran admin dan terapi</h2>
                  </div>
                  <p className="text-sm leading-6 text-slate-400">
                    Balas saran, catat mood, dan tandai progres agar rencana pemulihan lebih mudah diikuti.
                  </p>
                </div>

                <div className="flex w-fit rounded-lg border border-slate-800 bg-slate-950 p-1">
                  {[
                    { key: 'all' as const, label: 'Semua' },
                    { key: 'pending' as const, label: 'Aktif' },
                    { key: 'completed' as const, label: 'Selesai' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setSuggestionFilter(item.key)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                        suggestionFilter === item.key ? 'bg-amber-500/15 text-amber-200' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-500">
                    <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-normal text-white">Belum ada saran admin</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                    Saran akan muncul setelah admin mengirim rekomendasi berdasarkan asesmen atau kondisi kamu.
                  </p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-10 text-center text-sm text-slate-500">
                  Tidak ada saran pada filter ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => {
                    const category = categoryConfig[notification.Category] || categoryConfig.general;
                    const CategoryIcon = category.icon;
                    const priority = priorityConfig[notification.Priority] || priorityConfig.medium;
                    const expanded = expandedNotif === notification.ID;
                    const completed = notification.Status === 'completed';
                    const treatmentReplies = replies[notification.ID] || [];

                    return (
                      <motion.article
                        key={notification.ID}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`overflow-hidden rounded-xl border bg-slate-950/70 transition ${
                          completed ? 'border-slate-800 opacity-75' : 'border-slate-800 hover:border-amber-400/25'
                        }`}
                      >
                        <button
                          onClick={() => toggleNotification(notification.ID)}
                          className="flex w-full items-start gap-4 p-4 text-left"
                        >
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${category.border} ${category.bg}`}>
                            <CategoryIcon className={`h-6 w-6 ${category.color}`} aria-hidden="true" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-white">{category.label}</span>
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priority.className}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
                                {priority.label}
                              </span>
                              {completed && (
                                <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                                  Selesai
                                </span>
                              )}
                            </div>
                            <p className="line-clamp-2 text-sm leading-6 text-slate-300">{notification.ModuleName}</p>
                            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1.5">
                                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                                {formatFullDate(notification.CreatedAt)}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <TimerReset className="h-3.5 w-3.5" aria-hidden="true" />
                                {durationLabel[notification.Duration] || notification.Duration || '-'}
                              </span>
                              {notification.FollowUpDate && !notification.FollowUpDate.startsWith('0001') && (
                                <span className="inline-flex items-center gap-1.5 text-emerald-300">
                                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                  Follow-up {formatFullDate(notification.FollowUpDate)}
                                </span>
                              )}
                            </div>
                          </div>

                          <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-slate-600 transition ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>

                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mx-4 border-t border-slate-800 pb-4 pt-4">
                                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                                  <div className="space-y-4">
                                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                                      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Rencana dari admin</p>
                                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">{notification.ModuleName}</p>
                                    </div>

                                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                                      <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <MessageCircleReply className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                                          <h3 className="text-sm font-semibold tracking-normal text-white">Balasan dan catatan kamu</h3>
                                        </div>
                                        <button
                                          onClick={() => setReplyDraftOpen(replyDraftOpen === notification.ID ? null : notification.ID)}
                                          className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/15"
                                        >
                                          Tulis balasan
                                        </button>
                                      </div>

                                      {treatmentReplies.length === 0 ? (
                                        <p className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                                          Belum ada balasan. Kamu bisa menulis progres, kendala, atau kebutuhan tindak lanjut.
                                        </p>
                                      ) : (
                                        <div className="space-y-3">
                                          {treatmentReplies.map((reply) => {
                                            const mood = moodOptions.find((item) => item.key === reply.Mood) || moodOptions[1];

                                            return (
                                              <div key={reply.ID} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${mood.className}`}>
                                                    {mood.label}
                                                  </span>
                                                  <span className="text-[11px] text-slate-600">{formatFullDate(reply.CreatedAt)}</span>
                                                </div>
                                                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{reply.Text}</p>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      <AnimatePresence>
                                        {replyDraftOpen === notification.ID && (
                                          <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4"
                                          >
                                            <div className="mb-3 flex flex-wrap gap-2">
                                              {moodOptions.map((mood) => (
                                                <button
                                                  key={mood.key}
                                                  onClick={() => setReplyMood((prev) => ({ ...prev, [notification.ID]: mood.key }))}
                                                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                                    (replyMood[notification.ID] || 'same') === mood.key
                                                      ? mood.className
                                                      : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
                                                  }`}
                                                >
                                                  {mood.label}
                                                </button>
                                              ))}
                                            </div>

                                            <textarea
                                              value={replyText[notification.ID] || ''}
                                              onChange={(event) => setReplyText((prev) => ({ ...prev, [notification.ID]: event.target.value }))}
                                              placeholder="Tulis balasan untuk saran admin..."
                                              rows={4}
                                              className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/10"
                                            />

                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                              <div className="flex flex-wrap gap-2">
                                                {replyTemplates.map((template) => (
                                                  <button
                                                    key={template}
                                                    onClick={() => setReplyText((prev) => ({ ...prev, [notification.ID]: template }))}
                                                    className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-500 transition hover:border-cyan-400/30 hover:text-cyan-200"
                                                  >
                                                    {template}
                                                  </button>
                                                ))}
                                              </div>
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={() => setReplyDraftOpen(null)}
                                                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs font-semibold text-slate-400 transition hover:text-white"
                                                >
                                                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                                                  Batal
                                                </button>
                                                <button
                                                  onClick={() => sendTreatmentReply(notification.ID)}
                                                  disabled={!replyText[notification.ID]?.trim() || replyLoading === notification.ID}
                                                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-cyan-500 px-3 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                                                >
                                                  {replyLoading === notification.ID ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
                                                  Kirim balasan
                                                </button>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>

                                  <aside className="space-y-3">
                                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                                      <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Status progres</p>
                                      {completed ? (
                                        <button
                                          onClick={() => reopenTreatment(notification.ID)}
                                          disabled={actionLoading === notification.ID}
                                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 text-sm font-semibold text-slate-300 transition hover:border-amber-400/40 hover:text-amber-200 disabled:opacity-60"
                                        >
                                          {actionLoading === notification.ID ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <History className="h-4 w-4" aria-hidden="true" />}
                                          Buka lagi
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => markComplete(notification.ID)}
                                          disabled={actionLoading === notification.ID}
                                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                                        >
                                          {actionLoading === notification.ID ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                                          Tandai selesai
                                        </button>
                                      )}
                                    </div>

                                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                                      <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Ringkasan</p>
                                      <div className="space-y-3 text-sm">
                                        <div className="flex justify-between gap-3">
                                          <span className="text-slate-500">Durasi</span>
                                          <span className="font-medium text-slate-200">{durationLabel[notification.Duration] || notification.Duration || '-'}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                          <span className="text-slate-500">Balasan</span>
                                          <span className="font-medium text-slate-200">{treatmentReplies.length}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                          <span className="text-slate-500">Prioritas</span>
                                          <span className="font-medium text-slate-200">{priority.label}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </aside>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </main>

            <aside className="space-y-5">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-300" aria-hidden="true" />
                  <h2 className="text-base font-semibold tracking-normal text-white">Progres saran</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Aktif', value: stats.pending, color: 'bg-amber-300' },
                    { label: 'Selesai', value: stats.completed, color: 'bg-emerald-300' },
                    { label: 'Belum dibaca', value: unreadCount, color: 'bg-pink-300' },
                  ].map((item) => {
                    const total = Math.max(notifications.length, unreadCount, 1);
                    const width = `${Math.min((item.value / total) * 100, 100)}%`;

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
              </div>

              <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-5">
                <div className="mb-3 flex items-center gap-2 text-cyan-200">
                  <Lightbulb className="h-5 w-5" aria-hidden="true" />
                  <h2 className="text-sm font-semibold tracking-normal">Cara memakai balasan</h2>
                </div>
                <p className="text-sm leading-6 text-slate-400">
                  Tulis apa yang sudah dicoba, apa yang masih sulit, dan mood terbaru.
                  Catatan ini tersimpan di rekomendasi tersebut agar progres mudah dilacak.
                </p>
              </div>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}
