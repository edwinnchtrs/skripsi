import { useState, useEffect, useRef } from 'react';
import {
  MessageSquareHeart,
  Send,
  Bot,
  User,
  BellRing,
  Clock,
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import api from '../api';

interface Curhat {
  ID: number;
  Text: string;
  AIResponse: string;
  StressScore: number;
  Timestamp: string;
}

interface Notification {
  ID: number;
  ModuleName: string;
  Status: string;
  CreatedAt: string;
}

const BG = 'rgba(15, 17, 30, 0.98)';
const CARD = 'rgba(30, 35, 55, 0.85)';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const TEXT_MUTED = '#64748b';
const GRADIENT_USER = 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)';
const GRADIENT_AI = 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)';
const GRADIENT_HEADER = 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)';

export default function UserCurhat() {
  const [activeTab, setActiveTab] = useState<'chat' | 'notif'>('chat');
  const [curhats, setCurhats] = useState<Curhat[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (activeTab === 'chat') scrollToBottom(); }, [curhats, activeTab]);

  const fetchData = async () => {
    try {
      const [chatRes, notifRes] = await Promise.all([
        api.get('/user/curhat'),
        api.get('/user/notifications')
      ]);
      if (chatRes.data.curhats) setCurhats(chatRes.data.curhats);
      if (notifRes.data.notifications) setNotifications(notifRes.data.notifications);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const currentText = inputText;
    setInputText('');
    setLoadingChat(true);
    try {
      const res = await api.post('/curhat/submit', { text: currentText });
      if (res.data.curhat) setCurhats(prev => [...prev, res.data.curhat]);
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setLoadingChat(false);
    }
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const stressColor = (score: number) => {
    if (score > 0.7) return '#f87171';
    if (score > 0.4) return '#fbbf24';
    return '#4ade80';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      padding: '32px 24px',
      fontFamily: "'Inter', sans-serif",
      color: TEXT_PRIMARY,
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ===== HEADER ===== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, flexShrink: 0,
            background: GRADIENT_HEADER,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 30px -5px rgba(236,72,153,0.45)'
          }}>
            <MessageSquareHeart size={30} color="#fff" />
          </div>
          <div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, margin: '0 0 4px 0',
              color: TEXT_PRIMARY, letterSpacing: '-0.5px',
              lineHeight: 1.2
            }}>
              Ruang Curhat Anonim
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: TEXT_SECONDARY, fontWeight: 400 }}>
              Ceritakan keluh kesahmu tanpa ragu · AI kami siap mendengarkan dan merespons
            </p>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <div style={{
          display: 'flex', gap: 4,
          background: 'rgba(255,255,255,0.04)',
          padding: 4, borderRadius: 14,
          border: `1px solid ${BORDER}`,
          width: 'fit-content'
        }}>
          {[
            { key: 'chat', icon: <Bot size={15} />, label: 'Curhat AI' },
            { key: 'notif', icon: <BellRing size={15} />, label: 'Notifikasi Admin', badge: notifications.length > 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'chat' | 'notif')}
              style={{
                padding: '9px 20px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.2s ease',
                position: 'relative',
                color: activeTab === tab.key ? '#fff' : TEXT_MUTED,
                background: activeTab === tab.key
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(236,72,153,0.3) 100%)'
                  : 'transparent',
                boxShadow: activeTab === tab.key ? '0 2px 12px rgba(168,85,247,0.2)' : 'none',
              }}
            >
              {tab.icon}
              <span style={{ color: activeTab === tab.key ? '#fff' : TEXT_MUTED }}>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  width: 7, height: 7, background: '#ef4444',
                  borderRadius: '50%', position: 'absolute', top: 8, right: 8
                }} />
              )}
            </button>
          ))}
        </div>

        {/* ===== CHAT TAB ===== */}
        {activeTab === 'chat' && (
          <div style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 24,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 540
          }}>
            {/* Chat Header Bar */}
            <div style={{
              padding: '16px 24px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(168,85,247,0.06)'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: GRADIENT_AI,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(168,85,247,0.4)'
              }}>
                <Bot size={20} color="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: TEXT_PRIMARY }}>Konselor AI</p>
                <p style={{ margin: 0, fontSize: 12, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
                  Online · Siap mendengarkan
                </p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#a855f7" />
                <span style={{ fontSize: 12, color: TEXT_MUTED }}>Powered by GPT-4o</span>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, padding: '24px 20px',
              overflowY: 'auto', display: 'flex',
              flexDirection: 'column', gap: 20,
              minHeight: 380, maxHeight: 460
            }}>
              {curhats.length === 0 ? (
                <div style={{
                  margin: 'auto', textAlign: 'center', padding: 40,
                }}>
                  <div style={{
                    width: 70, height: 70, margin: '0 auto 20px',
                    borderRadius: '50%',
                    background: 'rgba(168,85,247,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <MessageSquareHeart size={34} color="#a855f7" opacity={0.6} />
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY }}>
                    Mulai percakapan
                  </p>
                  <p style={{ margin: 0, fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                    Ceritakan apa yang kamu rasakan hari ini.<br />
                    AI konselor kami akan merespons dengan penuh empati.
                  </p>
                </div>
              ) : (
                curhats.map((chat) => (
                  <div key={chat.ID} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* User bubble */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <div style={{ maxWidth: '72%' }}>
                        <div style={{
                          background: GRADIENT_USER,
                          padding: '12px 16px',
                          borderRadius: '18px 18px 4px 18px',
                          color: '#fff',
                          fontSize: 14,
                          lineHeight: 1.6,
                          boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
                        }}>
                          <p style={{ margin: 0, color: '#fff' }}>{chat.Text}</p>
                          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.65)', textAlign: 'right' }}>
                            {formatTime(chat.Timestamp)}
                          </p>
                        </div>
                        {/* Stress indicator */}
                        <div style={{
                          display: 'flex', justifyContent: 'flex-end',
                          alignItems: 'center', gap: 4, marginTop: 4
                        }}>
                          <span style={{ fontSize: 11, color: TEXT_MUTED }}>Stres terdeteksi:</span>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            color: stressColor(chat.StressScore)
                          }}>
                            {(chat.StressScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(99,102,241,0.2)',
                        border: '2px solid rgba(99,102,241,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <User size={17} color="#818cf8" />
                      </div>
                    </div>

                    {/* AI bubble */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: GRADIENT_AI,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(236,72,153,0.35)'
                      }}>
                        <Bot size={17} color="#fff" />
                      </div>
                      <div style={{ maxWidth: '72%' }}>
                        <div style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(168,85,247,0.2)',
                          padding: '12px 16px',
                          borderRadius: '18px 18px 18px 4px',
                          fontSize: 14,
                          lineHeight: 1.6,
                        }}>
                          <p style={{ margin: 0, color: TEXT_PRIMARY }}>
                            {chat.AIResponse || 'Terima kasih sudah berbagi ceritamu.'}
                          </p>
                          <p style={{ margin: '6px 0 0', fontSize: 11, color: TEXT_MUTED }}>
                            {formatTime(chat.Timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Loading / Typing indicator */}
              {loadingChat && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: GRADIENT_AI,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bot size={17} color="#fff" />
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    padding: '14px 20px',
                    borderRadius: '18px 18px 18px 4px',
                    display: 'flex', alignItems: 'center', gap: 5
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#a855f7',
                        animation: 'bounce 1.2s infinite',
                        animationDelay: `${i * 0.2}s`
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <div style={{
              padding: '16px 20px',
              borderTop: `1px solid ${BORDER}`,
              background: 'rgba(10, 12, 22, 0.6)'
            }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Ketik curhatanmu di sini..."
                  disabled={loadingChat}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${inputText ? 'rgba(168,85,247,0.5)' : BORDER}`,
                    borderRadius: 14,
                    padding: '13px 18px',
                    color: TEXT_PRIMARY,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    caretColor: '#a855f7',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.6)'}
                  onBlur={e => e.target.style.borderColor = inputText ? 'rgba(168,85,247,0.5)' : BORDER}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || loadingChat}
                  style={{
                    width: 50, height: 50,
                    borderRadius: 14,
                    border: 'none',
                    cursor: !inputText.trim() || loadingChat ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    background: !inputText.trim() || loadingChat
                      ? 'rgba(255,255,255,0.08)'
                      : GRADIENT_AI,
                    boxShadow: !inputText.trim() || loadingChat
                      ? 'none'
                      : '0 4px 15px rgba(168,85,247,0.4)',
                  }}
                >
                  <Send size={19} color={!inputText.trim() || loadingChat ? TEXT_MUTED : '#fff'} />
                </button>
              </form>
              <p style={{ margin: '8px 0 0', fontSize: 11, color: TEXT_MUTED, textAlign: 'center' }}>
                Percakapan ini bersifat anonim dan aman · dijaga kerahasiaannya
              </p>
            </div>
          </div>
        )}

        {/* ===== NOTIFIKASI TAB ===== */}
        {activeTab === 'notif' && (
          <div style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 24,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6)',
            padding: 28,
            minHeight: 420
          }}>
            {/* Section title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: 'rgba(251,191,36,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <BellRing size={22} color="#fbbf24" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>
                  Notifikasi Penanganan Admin
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: TEXT_SECONDARY }}>
                  Pesan & rekomendasi terapi dari tim psikolog
                </p>
              </div>
            </div>

            {/* Notification cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {notifications.length === 0 ? (
                <div style={{
                  padding: '48px 32px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px dashed rgba(255,255,255,0.1)`,
                  borderRadius: 16
                }}>
                  <div style={{
                    width: 60, height: 60, margin: '0 auto 16px',
                    borderRadius: '50%', background: 'rgba(74,222,128,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <CheckCircle2 size={30} color="#4ade80" opacity={0.7} />
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY }}>
                    Semua Bersih!
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: TEXT_SECONDARY }}>
                    Belum ada notifikasi atau rekomendasi penanganan dari Admin.
                  </p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.ID} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid rgba(251,191,36,0.15)`,
                    borderRadius: 16, padding: '20px 22px',
                    display: 'flex', gap: 16, alignItems: 'flex-start',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'default'
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                      background: 'rgba(251,191,36,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Info size={20} color="#fbbf24" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>
                          Modul Terapi: {notif.ModuleName}
                        </h3>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          padding: '3px 10px', borderRadius: 20,
                          background: notif.Status === 'pending'
                            ? 'rgba(251,191,36,0.18)' : 'rgba(74,222,128,0.18)',
                          color: notif.Status === 'pending' ? '#fcd34d' : '#86efac',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}>
                          {notif.Status}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 10px', fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                        Admin menyarankan Anda mengikuti modul ini berdasarkan hasil pemantauan kesehatan mental Anda terakhir.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} color={TEXT_MUTED} />
                        <span style={{ fontSize: 12, color: TEXT_MUTED }}>{formatDate(notif.CreatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        input::placeholder { color: #475569 !important; }
      `}</style>
    </div>
  );
}
