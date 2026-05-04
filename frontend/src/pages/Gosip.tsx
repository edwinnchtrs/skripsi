import { useState, useEffect } from 'react';
import { Send, Heart, Shield, Sparkles, MessageCircle, Trophy } from 'lucide-react';
import api from '../api';

interface BackendCurhat {
  ID: number;
  Text: string;
  StressScore: number;
  Timestamp: string;
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);

  if (diffInMins < 1) return 'Baru saja';
  if (diffInMins < 60) return `${diffInMins} menit lalu`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function SentimentBadge({ score }: { score: number }) {
  let sentiment = 'Netral';
  let gradient = 'linear-gradient(135deg, #3ecfcf44, #3ecfcf11)';
  let textColor = '#3ecfcf';
  let icon = '💭';

  if (score > 0.6) {
    sentiment = 'Butuh Dukungan';
    gradient = 'linear-gradient(135deg, #ef444444, #ef444411)';
    textColor = '#ff6b6b';
    icon = '🫂';
  } else if (score < 0.3) {
    sentiment = 'Positif';
    gradient = 'linear-gradient(135deg, #22c55e44, #22c55e11)';
    textColor = '#4ade80';
    icon = '✨';
  }

  return (
    <span style={{
      fontSize: 11,
      background: gradient,
      color: textColor,
      padding: '4px 12px',
      borderRadius: 20,
      fontWeight: 600,
      letterSpacing: '0.3px',
      border: `1px solid ${textColor}22`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    }}>
      {icon} {sentiment}
    </span>
  );
}

function getAvatarColor(id: number) {
  const colors = ['#6c63ff', '#3ecfcf', '#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#fb923c'];
  return colors[id % colors.length];
}

export default function Gosip() {
  const [curhats, setCurhats] = useState<BackendCurhat[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [cheeredPosts, setCheeredPosts] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchCurhats = async () => {
      try {
        const res = await api.get('/gosip');
        setCurhats(res.data.curhats || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCurhats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || posting) return;

    const curText = text;
    setPosting(true);

    // Optimistic update — langsung tampil tanpa refresh
    const optimisticPost: BackendCurhat = {
      ID: Date.now(),
      Text: curText,
      StressScore: 0.5,
      Timestamp: new Date().toISOString(),
    };
    setCurhats(prev => [optimisticPost, ...prev]);
    setText('');

    try {
      const res = await api.post('/curhat/submit', { text: curText });
      if (res.data.curhat) {
        // Update optimistic post dengan data asli (ID dan StressScore dari server)
        setCurhats(prev => prev.map(c => c.ID === optimisticPost.ID ? res.data.curhat : c));
      }
    } catch (err) {
      console.error(err);
      // Rollback jika gagal
      setCurhats(prev => prev.filter(c => c.ID !== optimisticPost.ID));
      setText(curText);
      alert('Gagal mengirim curhat. Pastikan Anda sudah login.');
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = (id: number) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleCheer = (id: number) => {
    setCheeredPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div style={{
      maxWidth: 720,
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>

      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #6c63ff, #3ecfcf)',
          boxShadow: '0 8px 24px rgba(108,99,255,0.3)',
          marginBottom: 16,
        }}>
          <Shield size={28} color="#fff" />
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          margin: '0 0 8px',
        }}>
          Ruang Gosip Sehat
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
          Bagikan beban pikiranmu secara anonim. Engine NLP menganalisis tren stres kolektif tanpa mengungkap identitasmu.
        </p>
      </header>

      {/* Input Card */}
      <div style={{
        background: 'linear-gradient(135deg, #131722, #161b26)',
        borderRadius: 16,
        border: '1px solid #1e2538',
        padding: 20,
        marginBottom: 32,
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6c63ff55, #3ecfcf33)',
              border: '2px dashed #6c63ff44',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={16} color="#6c63ff" />
            </div>
            <textarea
              placeholder="Apa yang membuat kamu merasa tertekan hari ini? 💬"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={posting}
              style={{
                flex: 1,
                background: '#0d1017',
                border: '1px solid #252b3b',
                borderRadius: 12,
                padding: '12px 16px',
                color: '#e2e8f0',
                fontSize: 13,
                lineHeight: 1.6,
                minHeight: 80,
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#6c63ff55'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#252b3b'}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={posting || !text.trim()}
              style={{
                background: text.trim() ? 'linear-gradient(135deg, #6c63ff, #8b5cf6)' : '#252b3b',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                color: text.trim() ? '#fff' : '#64748b',
                fontSize: 13,
                fontWeight: 600,
                cursor: text.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.3s ease',
                boxShadow: text.trim() ? '0 4px 16px rgba(108,99,255,0.4)' : 'none',
              }}
            >
              <Send size={14} />
              {posting ? 'Mengirim...' : 'Kirim Curhatan'}
            </button>
          </div>
        </form>
      </div>

      {/* Feed */}
      <div>
        <h3 style={{
          fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <MessageCircle size={18} color="#6c63ff" />
          Curhatan Terbaru
        </h3>

        {loading ? (
          <div style={{
            textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 60,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid #252b3b', borderTopColor: '#6c63ff',
              animation: 'spin 1s linear infinite',
            }} />
            Memuat curhatan...
          </div>
        ) : curhats.length === 0 ? (
          <div style={{
            textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 60,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{ fontSize: 40 }}>🌙</div>
            <div style={{ fontWeight: 600, color: '#94a3b8' }}>Belum ada curhatan</div>
            <div style={{ fontSize: 12 }}>Jadilah yang pertama berbagi cerita...</div>
          </div>
        ) : (
          curhats.map((curhat, index) => (
            <div
              key={curhat.ID}
              style={{
                background: 'linear-gradient(135deg, #131722, #141824)',
                borderRadius: 14,
                padding: 18,
                marginBottom: 14,
                border: '1px solid #1e2538',
                transition: 'all 0.3s ease',
                animation: `fadeSlideIn 0.4s ease ${index * 0.05}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2a3150';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1e2538';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Post header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${getAvatarColor(curhat.ID)}, ${getAvatarColor(curhat.ID + 3)})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                    boxShadow: `0 2px 8px ${getAvatarColor(curhat.ID)}44`,
                  }}>
                    👻
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 600 }}>Anonim</span>
                      <SentimentBadge score={curhat.StressScore} />
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                      {formatTime(curhat.Timestamp)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Post text */}
              <p style={{
                fontSize: 14, color: '#e2e8f0', margin: '0 0 16px 44px',
                lineHeight: 1.7, letterSpacing: '0.1px',
              }}>
                {curhat.Text}
              </p>

              {/* Actions */}
              <div style={{
                display: 'flex', gap: 8, paddingLeft: 44,
                borderTop: '1px solid #1e2538', paddingTop: 12,
              }}>
                <button
                  onClick={() => toggleLike(curhat.ID)}
                  style={{
                    background: likedPosts.has(curhat.ID) ? '#ef444418' : 'transparent',
                    border: '1px solid transparent',
                    borderColor: likedPosts.has(curhat.ID) ? '#ef444433' : 'transparent',
                    color: likedPosts.has(curhat.ID) ? '#ff6b6b' : '#64748b',
                    fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                    cursor: 'pointer', padding: '7px 14px', borderRadius: 20, fontWeight: 500,
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!likedPosts.has(curhat.ID)) {
                      e.currentTarget.style.background = '#ef444412';
                      e.currentTarget.style.color = '#ff8a8a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!likedPosts.has(curhat.ID)) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#64748b';
                    }
                  }}
                >
                  <Heart
                    size={15}
                    fill={likedPosts.has(curhat.ID) ? '#ff6b6b' : 'none'}
                    color={likedPosts.has(curhat.ID) ? '#ff6b6b' : '#64748b'}
                  />
                  {likedPosts.has(curhat.ID) ? '❤️ Peluk Terkirim' : '❤️ Peluk Virtual'}
                </button>

                <button
                  onClick={() => toggleCheer(curhat.ID)}
                  style={{
                    background: cheeredPosts.has(curhat.ID) ? '#fbbf2418' : 'transparent',
                    border: '1px solid transparent',
                    borderColor: cheeredPosts.has(curhat.ID) ? '#fbbf2433' : 'transparent',
                    color: cheeredPosts.has(curhat.ID) ? '#fbbf24' : '#64748b',
                    fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                    cursor: 'pointer', padding: '7px 14px', borderRadius: 20, fontWeight: 500,
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!cheeredPosts.has(curhat.ID)) {
                      e.currentTarget.style.background = '#fbbf2412';
                      e.currentTarget.style.color = '#fbbf24';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!cheeredPosts.has(curhat.ID)) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#64748b';
                    }
                  }}
                >
                  <Trophy
                    size={15}
                    fill={cheeredPosts.has(curhat.ID) ? '#fbbf24' : 'none'}
                    color={cheeredPosts.has(curhat.ID) ? '#fbbf24' : '#64748b'}
                  />
                  {cheeredPosts.has(curhat.ID) ? '🏆 Semangat!' : '🏆 Semangat'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
