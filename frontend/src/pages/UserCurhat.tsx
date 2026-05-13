import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquareHeart, Send, Bot, User, BellRing, Clock,
  Info, CheckCircle2, Sparkles, Loader2, AlertCircle,
  Gauge, Zap, Smile, Frown, Meh, Calendar, Target,
  Flame, Heart, Brain, Activity, ChevronDown, History,
  Shield, ExternalLink, X, Clock3, Users,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import api from '../api';
import { card, sectionTitle } from './dashboard/styles';

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

const catConf: Record<string, { icon: any; color: string; label: string }> = {
  konseling: { icon: Heart, color: '#ef4444', label: 'Konseling Psikologis' },
  meditasi: { icon: Brain, color: '#a855f7', label: 'Meditasi & Mindfulness' },
  olahraga: { icon: Activity, color: '#22c55e', label: 'Aktivitas Fisik' },
  istirahat: { icon: Clock, color: '#f59e0b', label: 'Manajemen Istirahat' },
  sosial: { icon: Users, color: '#3ecfcf', label: 'Dukungan Sosial' },
  edukasi: { icon: Info, color: '#6c63ff', label: 'Edukasi Kesehatan' },
};

export default function UserCurhat() {
  const [activeTab, setActiveTab] = useState<'chat' | 'notif'>('chat');
  const [curhats, setCurhats] = useState<Curhat[]>([]);
  const [notifications, setNotifications] = useState<TherapyNotif[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedNotif, setExpandedNotif] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData(); }, []);

  /* Real-time polling */
  useEffect(() => {
    const poll = async () => {
      try {
        const [notifRes, unreadRes] = await Promise.all([
          api.get('/user/notifications'),
          api.get('/notifications/unread'),
        ]);
        if (notifRes.data.notifications) setNotifications(notifRes.data.notifications);
        if (unreadRes.data.notifications) setUnreadCount(unreadRes.data.notifications.length);
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [curhats]);

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
      for (const n of unread) {
        await api.post(`/notifications/${n.ID}/read`).catch(() => {});
      }
    } catch {}
    finally { setLoading(false); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;
    setInputText('');
    setSending(true);
    try {
      const res = await api.post('/curhat/submit', { text });
      if (res.data.curhat) setCurhats(prev => [...prev, res.data.curhat]);
    } catch {}
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const markComplete = async (id: number) => {
    setActionLoading(id);
    try {
      await api.patch(`/user/treatment/${id}/status`, { status: 'completed' });
      setNotifications(prev => prev.map(n => n.ID === id ? { ...n, Status: 'completed' } : n));
    } catch {}
    finally { setActionLoading(null); }
  };

  const stressLevel = (score: number) => ({
    label: score > 0.7 ? 'Tinggi' : score > 0.4 ? 'Sedang' : 'Rendah',
    color: score > 0.7 ? '#ef4444' : score > 0.4 ? '#f59e0b' : '#22c55e',
  });

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const formatFullDate = (d: string) => {
    if (!d || d.startsWith('0001')) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const priConf: Record<string, { color: string; label: string }> = {
    urgent: { color: '#ef4444', label: 'URGENT' },
    high: { color: '#f59e0b', label: 'Tinggi' },
    medium: { color: '#3ecfcf', label: 'Sedang' },
    low: { color: '#8890a4', label: 'Rendah' },
  };

  const durConf: Record<string, string> = {
    '1_week': '1 Minggu', '2_weeks': '2 Minggu', '1_month': '1 Bulan', '3_months': '3 Bulan',
  };

  const pendings = notifications.filter(n => n.Status === 'pending').length;

  return (
    <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes bounce2 { 0%,80%,100%{transform:translateY(0);opacity:0.5} 40%{transform:translateY(-6px);opacity:1} }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .msg-in { animation: slideIn 0.25s ease-out; }
        .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #1e2130 transparent; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #1e2130; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #ec4899, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquareHeart size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Ruang Curhat AI</h1>
          </div>
          <p style={{ color: '#8890a4', fontSize: 12, margin: '2px 0 0' }}>Curhat anonim dengan AI — setiap kata dianalisis untuk mendeteksi tingkat stresmu</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: '#131722', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid #1e2130' }}>
        {[
          { key: 'chat' as const, label: 'Curhat AI', icon: Bot },
          { key: 'notif' as const, label: 'Notifikasi Terapi', icon: BellRing, badge: pendings },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
            background: activeTab === tab.key ? 'rgba(168,85,247,0.18)' : 'transparent',
            color: activeTab === tab.key ? '#c4b5fd' : '#8890a4', display: 'flex', alignItems: 'center', gap: 7, position: 'relative',
          }}>
            <tab.icon size={14} /> {tab.label}
            {tab.badge > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17, padding: '0 4px', background: '#ef4444', borderRadius: 10, fontSize: 10, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0b0d14' }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'chat' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 12, alignItems: 'start' }}>
          {/* Chat Area */}
          <div style={{ ...card, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            {/* Chat Header */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(168,85,247,0.04)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={17} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>NEXUS AI</div>
                <div style={{ fontSize: 10, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 5, height: 5, background: '#4ade80', borderRadius: '50%' }} /> Online
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: '16px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 420, minHeight: 360 }} className="scrollbar-thin">
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Loader2 size={22} color="#8890a4" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : curhats.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', padding: 20 }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <MessageSquareHeart size={28} color="#a855f7" />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>Ceritakan apa yang kamu rasakan</div>
                  <div style={{ fontSize: 12, color: '#8890a4', marginBottom: 16 }}>AI akan menganalisis tingkat stres dan memberikan respons yang mendukung</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                    {['Aku merasa lelah sekali hari ini...', 'Bagaimana cara mengatasi stres?', 'Aku butuh teman bicara', 'Pekerjaan/kuliahku sangat membebani'].map(q => (
                      <button key={q} onClick={() => setInputText(q)} style={{
                        padding: '6px 12px', borderRadius: 16, background: '#0f1117', border: '1px solid #1e2130',
                        color: '#8890a4', fontSize: 11, cursor: 'pointer', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                curhats.map(chat => (
                  <div key={chat.ID} className="msg-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* User message */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', padding: '12px 16px', borderRadius: '18px 18px 4px 18px', color: '#fff', fontSize: 13, lineHeight: 1.6 }}>
                          {chat.Text}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: 9, color: '#4a5068' }}>{formatTime(chat.Timestamp)}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 700, background: stressLevel(chat.StressScore).color + '18', color: stressLevel(chat.StressScore).color }}>
                            Stres {stressLevel(chat.StressScore).label} {(chat.StressScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end' }}>
                        <User size={15} color="#818cf8" />
                      </div>
                    </div>
                    {/* AI message */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end' }}>
                        <Bot size={16} color="#fff" />
                      </div>
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{ background: '#0f1117', border: '1px solid #1e2130', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', fontSize: 13, lineHeight: 1.6 }}>
                          <div style={{ fontSize: 10, color: '#a855f7', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Sparkles size={11} /> NEXUS AI
                          </div>
                          <div style={{ color: '#c0c9e0', whiteSpace: 'pre-wrap' }}>{chat.AIResponse || 'Terima kasih sudah berbagi. Aku di sini untuk mendengarkan.'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {sending && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={16} color="#fff" />
                  </div>
                  <div style={{ background: '#0f1117', border: '1px solid #1e2130', padding: '12px 18px', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (<div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', animation: 'bounce2 1.2s infinite', animationDelay: `${i * 0.2}s` }} />))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid #1e2130', background: '#0f1117' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
                <input ref={inputRef} value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Tulis curhatanmu di sini..." disabled={sending}
                  style={{ flex: 1, padding: '10px 14px', background: '#131722', border: '1px solid #1e2130', borderRadius: 10, color: '#e2e8f0', fontSize: 13, outline: 'none' }} />
                <button type="submit" disabled={!inputText.trim() || sending} style={{
                  width: 42, height: 42, borderRadius: 10, border: 'none', cursor: (!inputText.trim() || sending) ? 'not-allowed' : 'pointer',
                  background: (!inputText.trim() || sending) ? '#1e2130' : 'linear-gradient(135deg, #a855f7, #ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {sending ? <Loader2 size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} color="#fff" />}
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {curhats.length > 0 && (
              <>
                {/* Stress Gauge */}
                {(() => {
                  const avgStress = curhats.reduce((s, c) => s + c.StressScore, 0) / curhats.length;
                  return (
                    <div style={card}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Gauge size={24} color={stressLevel(avgStress).color} />
                        <div>
                          <div style={{ fontSize: 10, color: '#8890a4' }}>Rata-rata Stres</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: stressLevel(avgStress).color }}>
                            {stressLevel(avgStress).label} ({(avgStress * 100).toFixed(0)}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Stress Trend */}
                {curhats.length > 1 && (
                  <div style={card}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>Tren Stres</h4>
                    <ResponsiveContainer width="100%" height={100}>
                      <AreaChart data={curhats.slice(-8).map((c, i) => ({ n: i + 1, s: c.StressScore }))} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                        <defs>
                          <linearGradient id="stG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="s" stroke="#ef4444" strokeWidth={1.5} fill="url(#stG)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Stats */}
                <div style={card}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div style={{ textAlign: 'center', padding: 8, background: '#0f1117', borderRadius: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{curhats.length}</div>
                      <div style={{ fontSize: 9, color: '#8890a4' }}>Sesi Curhat</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 8, background: '#0f1117', borderRadius: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#a855f7' }}>{pendings}</div>
                      <div style={{ fontSize: 9, color: '#8890a4' }}>Notif Pending</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Stress Level Legend */}
            <div style={card}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px' }}>Level Stres</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: Smile, label: 'Rendah (0-40%)', color: '#22c55e', desc: 'Kondisi baik' },
                  { icon: Meh, label: 'Sedang (40-70%)', color: '#f59e0b', desc: 'Perlu perhatian' },
                  { icon: Frown, label: 'Tinggi (>70%)', color: '#ef4444', desc: 'Butuh dukungan' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: '#0f1117', borderRadius: 6, border: '1px solid #1e2130' }}>
                    <l.icon size={14} color={l.color} />
                    <div><div style={{ fontSize: 10, fontWeight: 600, color: l.color }}>{l.label}</div><div style={{ fontSize: 9, color: '#8890a4' }}>{l.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notif' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BellRing size={18} color="#fbbf24" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Notifikasi Terapi</h3>
              <p style={{ margin: 0, fontSize: 11, color: '#8890a4' }}>
                {pendings > 0 ? (
                  <span><span style={{ color: '#fbbf24', fontWeight: 600 }}>{pendings} rekomendasi</span> menunggu tindakan</span>
                ) : 'Semua rekomendasi telah ditindaklanjuti'}
              </p>
            </div>
            {pendings > 0 && (
              <span style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.12)', color: '#f87171', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, border: '1px solid rgba(239,68,68,0.2)' }}>
                {pendings} pending
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 36 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <CheckCircle2 size={28} color="#4a5068" />
              </div>
              <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Belum ada notifikasi</div>
              <p style={{ color: '#8890a4', fontSize: 12, margin: 0 }}>Admin akan mengirim rekomendasi berdasarkan hasil asesmen Anda</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="scrollbar-thin" >
              {notifications.map(n => {
                const cat = catConf[n.Category] || { icon: Info, color: '#8890a4', label: n.Category || 'Umum' };
                const pri = priConf[n.Priority] || priConf['medium'];
                const expanded = expandedNotif === n.ID;
                const isComplete = n.Status === 'completed';

                return (
                  <motion.div
                    key={n.ID}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: '#0f1117', borderRadius: 10, border: `1px solid ${isComplete ? '#1e2130' : pri.color + '25'}`,
                      overflow: 'hidden', transition: 'all 0.2s',
                      opacity: isComplete ? 0.65 : 1,
                    }}
                  >
                    {/* Notification Header (clickable) */}
                    <div
                      onClick={() => setExpandedNotif(expanded ? null : n.ID)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', cursor: 'pointer' }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: (isComplete ? '#1e2130' : cat.color + '12'), border: `1px solid ${isComplete ? '#1e2130' : cat.color + '20'}`,
                      }}>
                        <cat.icon size={16} color={isComplete ? '#4a5068' : cat.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: isComplete ? '#8890a4' : '#e2e8f0' }}>{cat.label}</span>
                          <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: pri.color + '15', color: pri.color, border: `1px solid ${pri.color}25` }}>{pri.label}</span>
                          {isComplete && (
                            <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.15)' }}>Selesai</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: isComplete ? '#4a5068' : '#8890a4', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {n.ModuleName}
                        </div>
                        <div style={{ fontSize: 9, color: '#4a5068', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock3 size={9} /> {formatFullDate(n.CreatedAt)}</span>
                          {n.FollowUpDate && !isComplete && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#4ade80' }}><Calendar size={9} /> Follow-up: {formatFullDate(n.FollowUpDate)}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {!isComplete && (
                          <button
                            onClick={e => { e.stopPropagation(); markComplete(n.ID); }}
                            disabled={actionLoading === n.ID}
                            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.08)', color: '#4ade80', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                          >
                            {actionLoading === n.ID ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={11} />}
                            Selesai
                          </button>
                        )}
                        <ChevronDown size={14} color="#4a5068" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '0 14px 14px', borderTop: '1px solid #1e2130', margin: '0 14px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                              <div>
                                <span style={{ fontSize: 9, color: '#4a5068', textTransform: 'uppercase', letterSpacing: 0.5 }}>Durasi</span>
                                <div style={{ fontSize: 11, color: '#c0c9e0', marginTop: 2 }}>{durConf[n.Duration] || n.Duration}</div>
                              </div>
                              <div>
                                <span style={{ fontSize: 9, color: '#4a5068', textTransform: 'uppercase', letterSpacing: 0.5 }}>Follow-up</span>
                                <div style={{ fontSize: 11, color: '#4ade80', marginTop: 2 }}>{n.FollowUpDate ? formatFullDate(n.FollowUpDate) : '-'}</div>
                              </div>
                            </div>
                            <div style={{ marginTop: 10 }}>
                              <span style={{ fontSize: 9, color: '#4a5068', textTransform: 'uppercase', letterSpacing: 0.5 }}>Rencana Penanganan</span>
                              <div style={{ fontSize: 11, color: '#8890a4', lineHeight: 1.6, marginTop: 4, whiteSpace: 'pre-wrap', background: '#0a0d14', padding: '8px 10px', borderRadius: 6, border: '1px solid #1e2130' }}>
                                {n.ModuleName}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
