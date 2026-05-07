import { useState, useEffect, useRef } from 'react';
import {
  MessageSquareHeart, Send, Bot, User, BellRing, Clock,
  Info, CheckCircle2, Sparkles, Loader2, AlertCircle,
  Gauge, Zap, Smile, Frown, Meh
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
  Status: string;
  CreatedAt: string;
}

export default function UserCurhat() {
  const [activeTab, setActiveTab] = useState<'chat' | 'notif'>('chat');
  const [curhats, setCurhats] = useState<Curhat[]>([]);
  const [notifications, setNotifications] = useState<TherapyNotif[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData(); }, []);

  // Real-time polling for notifications when on notif tab
  useEffect(() => {
    if (activeTab !== 'notif') return;
    const poll = async () => {
      try {
        const res = await api.get('/user/notifications');
        if (res.data.notifications) {
          setNotifications(prev => {
            const newData = res.data.notifications;
            if (JSON.stringify(prev) !== JSON.stringify(newData)) return newData;
            return prev;
          });
        }
      } catch (_) {}
    };
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [curhats]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chatRes, notifRes] = await Promise.all([
        api.get('/user/curhat'),
        api.get('/user/notifications'),
      ]);
      if (chatRes.data.curhats) setCurhats(chatRes.data.curhats);
      if (notifRes.data.notifications) setNotifications(notifRes.data.notifications);
    } catch (e) { console.error(e); }
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
    } catch (e) { console.error(e); }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const stressLevel = (score: number) => {
    if (score > 0.7) return { label: 'Tinggi', color: '#ef4444', emoji: '😰' };
    if (score > 0.4) return { label: 'Sedang', color: '#f59e0b', emoji: '😟' };
    return { label: 'Rendah', color: '#22c55e', emoji: '😊' };
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const quickReplies = [
    'Aku merasa lelah sekali hari ini...',
    'Bagaimana cara mengatasi stres?',
    'Aku butuh teman bicara',
    'Pekerjaan/kuliahku sangat membebani',
  ];

  const avgStress = curhats.length > 0
    ? curhats.reduce((s, c) => s + c.StressScore, 0) / curhats.length
    : 0;

  const stressTrend = curhats.slice(-8).map((c, i) => ({
    n: i + 1,
    s: c.StressScore,
  }));

  return (
    <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes bounce2 { 0%,80%,100%{transform:translateY(0);opacity:0.5} 40%{transform:translateY(-6px);opacity:1} }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .msg-in { animation: slideIn 0.25s ease-out; }
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
        {curhats.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#131722', border: '1px solid #1e2130', borderRadius: 10, padding: '8px 16px' }}>
            <Gauge size={15} color={stressLevel(avgStress).color} />
            <div>
              <div style={{ fontSize: 10, color: '#8890a4' }}>Rata-rata Stres</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: stressLevel(avgStress).color }}>
                {stressLevel(avgStress).label} ({(avgStress * 100).toFixed(0)}%)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: '#131722', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid #1e2130' }}>
        {[
          { key: 'chat' as const, label: 'Curhat AI', icon: Bot },
          { key: 'notif' as const, label: 'Notifikasi Terapi', icon: BellRing, badge: notifications.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
            background: activeTab === tab.key ? 'rgba(168,85,247,0.18)' : 'transparent',
            color: activeTab === tab.key ? '#c4b5fd' : '#8890a4', display: 'flex', alignItems: 'center', gap: 7, position: 'relative',
          }}>
            <tab.icon size={14} /> {tab.label}
            {tab.badge > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, background: '#ef4444', borderRadius: '50%' }} />
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
            <div style={{ flex: 1, padding: '16px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 420, minHeight: 360 }}>
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
                    {quickReplies.map(q => (
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
                        <div style={{
                          background: 'linear-gradient(135deg, #6366f1, #7c3aed)', padding: '12px 16px',
                          borderRadius: '18px 18px 4px 18px', color: '#fff', fontSize: 13, lineHeight: 1.6,
                        }}>
                          {chat.Text}
                        </div>
                        {/* Stress badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: 9, color: '#4a5068' }}>{formatTime(chat.Timestamp)}</span>
                          <span style={{
                            padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 700,
                            background: stressLevel(chat.StressScore).color + '18',
                            color: stressLevel(chat.StressScore).color,
                          }}>
                            Stres {stressLevel(chat.StressScore).label} {(chat.StressScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.12)',
                        border: '1.5px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end',
                      }}>
                        <User size={15} color="#818cf8" />
                      </div>
                    </div>

                    {/* AI message */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end',
                      }}>
                        <Bot size={16} color="#fff" />
                      </div>
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{
                          background: '#0f1117', border: '1px solid #1e2130',
                          padding: '12px 16px', borderRadius: '18px 18px 18px 4px',
                          fontSize: 13, lineHeight: 1.6,
                        }}>
                          <div style={{ fontSize: 10, color: '#a855f7', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Sparkles size={11} /> NEXUS AI
                          </div>
                          <div style={{ color: '#c0c9e0', whiteSpace: 'pre-wrap' }}>
                            {chat.AIResponse || 'Terima kasih sudah berbagi. Aku di sini untuk mendengarkan.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {sending && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={16} color="#fff" />
                  </div>
                  <div style={{ background: '#0f1117', border: '1px solid #1e2130', padding: '12px 18px', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', animation: 'bounce2 1.2s infinite', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid #1e2130', background: '#0f1117' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Tulis curhatanmu di sini..."
                  disabled={sending}
                  style={{
                    flex: 1, padding: '10px 14px', background: '#131722', border: '1px solid #1e2130',
                    borderRadius: 10, color: '#e2e8f0', fontSize: 13, outline: 'none',
                  }}
                />
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

          {/* Right Panel: Stress Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Stress Trend */}
            {curhats.length > 1 && (
              <div style={card}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>Tren Stres</h4>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={stressTrend} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
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
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: l.color }}>{l.label}</div>
                      <div style={{ fontSize: 9, color: '#8890a4' }}>{l.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div style={{ ...card, fontSize: 10, color: '#8890a4', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <Info size={12} color="#6c63ff" />
                <span style={{ fontWeight: 600, color: '#c0c9e0' }}>Cara Kerja</span>
              </div>
              AI menganalisis kata-katamu menggunakan NLP lexicon-based engine untuk mendeteksi indikator stres seperti kelelahan, kecemasan, dan keputusasaan.
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
              <p style={{ margin: 0, fontSize: 11, color: '#8890a4' }}>Rekomendasi dari admin berdasarkan hasil asesmen</p>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 36 }}>
              <CheckCircle2 size={32} color="#4a5068" />
              <p style={{ color: '#8890a4', fontSize: 13, marginTop: 8 }}>Belum ada notifikasi terapi</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifications.map(n => (
                <div key={n.ID} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#0f1117', borderRadius: 10, border: '1px solid #1e2130', alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Info size={16} color="#fbbf24" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{n.ModuleName}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 700,
                        background: n.Status === 'pending' ? 'rgba(251,191,36,0.15)' : 'rgba(34,197,94,0.15)',
                        color: n.Status === 'pending' ? '#fcd34d' : '#86efac',
                      }}>{n.Status}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#8890a4', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> {new Date(n.CreatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
