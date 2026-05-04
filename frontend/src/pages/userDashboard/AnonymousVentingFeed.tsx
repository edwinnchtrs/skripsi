import { useState, useEffect } from 'react';
import { Send, Heart, MessageCircle, Shield, Sparkles } from 'lucide-react';
import api from '../../api';

interface BackendCurhat {
  ID: number;
  Text: string;
  StressScore: number;
  Timestamp: string;
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
      fontSize: 10,
      background: gradient,
      color: textColor,
      padding: '3px 10px',
      borderRadius: 20,
      marginLeft: 8,
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

function getAvatarColor(id: number) {
  const colors = ['#6c63ff', '#3ecfcf', '#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#fb923c'];
  return colors[id % colors.length];
}

export default function AnonymousVentingFeed() {
  const [posts, setPosts] = useState<BackendCurhat[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const fetchPosts = async () => {
    try {
      const response = await api.get('/gosip');
      setPosts(response.data.curhats || []);
    } catch (error) {
      console.error('Failed to fetch curhats:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!newPost.trim() || loading) return;
    const text = newPost;
    setLoading(true);

    // Optimistic update — langsung tampilkan di feed tanpa refresh
    const optimisticPost: BackendCurhat = {
      ID: Date.now(),
      Text: text,
      StressScore: 0.5,
      Timestamp: new Date().toISOString(),
    };
    setPosts(prev => [optimisticPost, ...prev]);
    setNewPost('');

    try {
      const res = await api.post('/curhat/submit', { text });
      if (res.data.curhat) {
        setPosts(prev => prev.map(p => p.ID === optimisticPost.ID ? res.data.curhat : p));
      }
    } catch (error) {
      console.error('Failed to post curhat:', error);
      // Rollback jika gagal
      setPosts(prev => prev.filter(p => p.ID !== optimisticPost.ID));
      setNewPost(text);
      alert('Gagal mengirim curhat. Pastikan Anda sudah login.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = (id: number) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, #0f1219 0%, #131722 100%)',
      borderRadius: 16,
      border: '1px solid #1e2235',
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '650px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>

      {/* Header */}
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: '1px solid #1e2235',
        background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(62,207,207,0.05))',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #6c63ff, #3ecfcf)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(108,99,255,0.3)',
          }}>
            <Shield size={16} color="#fff" />
          </div>
          <div>
            <div style={{
              color: '#f1f5f9', fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px',
            }}>
              Ruang Curhat Anonim
            </div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>
              Identitasmu aman & terlindungi 🔒
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #1e2235',
        background: '#0d1017',
      }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-end',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6c63ff55, #3ecfcf33)',
            border: '2px dashed #6c63ff44',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Sparkles size={14} color="#6c63ff" />
          </div>
          <div style={{
            flex: 1,
            background: '#161b26',
            border: '1px solid #252b3b',
            borderRadius: 12,
            padding: '2px 4px 2px 0',
            display: 'flex',
            alignItems: 'center',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}>
            <input
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              disabled={loading}
              placeholder="Tulis curhatanmu di sini... 💬"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '10px 14px',
                color: '#e2e8f0',
                fontSize: 13,
                fontFamily: 'inherit',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handlePost()}
            />
            <button
              onClick={handlePost}
              disabled={loading || !newPost.trim()}
              style={{
                background: newPost.trim()
                  ? 'linear-gradient(135deg, #6c63ff, #8b5cf6)'
                  : '#252b3b',
                border: 'none',
                borderRadius: 10,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: newPost.trim() ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                boxShadow: newPost.trim() ? '0 4px 12px rgba(108,99,255,0.4)' : 'none',
                flexShrink: 0,
              }}
            >
              <Send size={14} color={newPost.trim() ? '#fff' : '#64748b'} />
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 20px 20px',
      }}>
        {initialLoading ? (
          <div style={{
            textAlign: 'center', color: '#64748b', fontSize: 13,
            marginTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid #252b3b',
              borderTopColor: '#6c63ff',
              animation: 'spin 1s linear infinite',
            }} />
            Memuat curhatan...
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            textAlign: 'center', color: '#64748b', fontSize: 13,
            marginTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>🌙</div>
            <div style={{ fontWeight: 600, color: '#94a3b8' }}>Belum ada curhatan</div>
            <div style={{ fontSize: 12 }}>Jadilah yang pertama berbagi cerita...</div>
          </div>
        ) : (
          posts.map((post, index) => (
            <div
              key={post.ID}
              style={{
                background: 'linear-gradient(135deg, #161b26, #141824)',
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
                border: '1px solid #1e2538',
                transition: 'all 0.3s ease',
                animation: `fadeSlideIn 0.4s ease ${index * 0.05}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2a3150';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1e2538';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Post header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${getAvatarColor(post.ID)}, ${getAvatarColor(post.ID + 3)})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff',
                    boxShadow: `0 2px 8px ${getAvatarColor(post.ID)}44`,
                  }}>
                    A
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>Anonim</span>
                      <SentimentBadge score={post.StressScore} />
                    </div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                      {formatTime(post.Timestamp)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Post text */}
              <p style={{
                fontSize: 13.5, color: '#e2e8f0', margin: '0 0 14px 0',
                lineHeight: 1.7, letterSpacing: '0.1px',
                paddingLeft: 40,
              }}>
                {post.Text}
              </p>

              {/* Actions */}
              <div style={{
                display: 'flex', gap: 6,
                borderTop: '1px solid #1e2538', paddingTop: 10,
                paddingLeft: 40,
              }}>
                <button
                  onClick={() => toggleLike(post.ID)}
                  style={{
                    background: likedPosts.has(post.ID) ? '#ef444418' : 'transparent',
                    border: '1px solid transparent',
                    borderColor: likedPosts.has(post.ID) ? '#ef444433' : 'transparent',
                    color: likedPosts.has(post.ID) ? '#ff6b6b' : '#64748b',
                    fontSize: 11,
                    display: 'flex', alignItems: 'center', gap: 5,
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontWeight: 500,
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!likedPosts.has(post.ID)) {
                      e.currentTarget.style.background = '#ef444412';
                      e.currentTarget.style.color = '#ff8a8a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!likedPosts.has(post.ID)) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#64748b';
                    }
                  }}
                >
                  <Heart
                    size={14}
                    fill={likedPosts.has(post.ID) ? '#ff6b6b' : 'none'}
                    color={likedPosts.has(post.ID) ? '#ff6b6b' : '#64748b'}
                  />
                  {likedPosts.has(post.ID) ? 'Pelukan Terkirim 💛' : 'Beri Pelukan'}
                </button>

                <button
                  style={{
                    background: 'transparent', border: 'none', color: '#64748b', fontSize: 11,
                    display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                    padding: '6px 12px', borderRadius: 20, fontWeight: 500,
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#3ecfcf12';
                    e.currentTarget.style.color = '#3ecfcf';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <MessageCircle size={14} />
                  Balas
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inline CSS animation */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        div::-webkit-scrollbar {
          width: 4px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: #252b3b;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #3a4260;
        }
      `}</style>
    </div>
  );
}
