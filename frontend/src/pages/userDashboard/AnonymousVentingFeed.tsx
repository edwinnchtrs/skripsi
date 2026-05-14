import { useEffect, useState } from 'react';
import { AlertCircle, Heart, Loader2, MessageCircle, Send, Shield, X } from 'lucide-react';
import api from '../../api';

interface CurhatReply {
  ID: number;
  Text: string;
  Timestamp: string;
}

interface BackendCurhat {
  ID: number;
  Text: string;
  StressScore: number;
  Timestamp: string;
  Replies?: CurhatReply[];
}

function SentimentBadge({ score }: { score: number }) {
  const state = score > 0.6
    ? { label: 'Butuh dukungan', className: 'border-rose-300/25 bg-rose-400/10 text-rose-200' }
    : score < 0.3
      ? { label: 'Positif', className: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' }
      : { label: 'Netral', className: 'border-teal-300/25 bg-teal-400/10 text-teal-200' };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${state.className}`}>
      {state.label}
    </span>
  );
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMins = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffInMins < 1) return 'Baru saja';
  if (diffInMins < 60) return `${diffInMins} menit lalu`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function getAvatarTone(id: number) {
  const tones = [
    'from-violet-500 to-teal-400',
    'from-sky-500 to-violet-400',
    'from-fuchsia-500 to-rose-400',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-cyan-500',
  ];
  return tones[id % tones.length];
}

export default function AnonymousVentingFeed() {
  const [posts, setPosts] = useState<BackendCurhat[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    setError('');
    try {
      const response = await api.get('/gosip');
      setPosts(response.data.curhats || []);
    } catch (fetchError) {
      console.error('Failed to fetch curhats:', fetchError);
      setError('Feed curhat belum bisa dimuat. Coba lagi beberapa saat.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async () => {
    const text = newPost.trim();
    if (!text || loading) return;

    setLoading(true);
    setError('');

    const optimisticPost: BackendCurhat = {
      ID: Date.now(),
      Text: text,
      StressScore: 0.5,
      Timestamp: new Date().toISOString(),
      Replies: [],
    };

    setPosts((prev) => [optimisticPost, ...prev]);
    setNewPost('');

    try {
      const res = await api.post('/curhat/submit', { text });
      if (res.data.curhat) {
        setPosts((prev) => prev.map((post) => (post.ID === optimisticPost.ID ? res.data.curhat : post)));
      }
    } catch (postError) {
      console.error('Failed to post curhat:', postError);
      setPosts((prev) => prev.filter((post) => post.ID !== optimisticPost.ID));
      setNewPost(text);
      setError('Curhat gagal dikirim. Pastikan akun masih login.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = (id: number) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReply = async (curhatId: number) => {
    const text = replyText.trim();
    if (!text) return;

    setError('');
    try {
      const res = await api.post(`/curhat/${curhatId}/reply`, { text });
      if (res.data.status === 'success') {
        setPosts((prev) => prev.map((post) => {
          if (post.ID !== curhatId) return post;
          return { ...post, Replies: [...(post.Replies || []), res.data.reply] };
        }));
        setReplyText('');
        setActiveReplyId(null);
      }
    } catch (replyError) {
      console.error('Failed to post reply:', replyError);
      setError('Balasan gagal dikirim. Pastikan akun masih login.');
    }
  };

  return (
    <aside className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/10">
      <div className="border-b border-white/10 bg-slate-950/35 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-400/10 text-teal-200">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white">Ruang Curhat Anonim</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">Berbagi cerita dan membalas dukungan tanpa menampilkan identitas.</p>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 p-4">
        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs leading-5 text-rose-100">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError('')} className="rounded p-0.5 text-rose-100/70 hover:bg-white/10 hover:text-rose-50">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-violet-300/30 bg-violet-400/10 text-xs font-bold text-violet-100">
            A
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 p-1.5 transition focus-within:border-teal-300/45 focus-within:ring-2 focus-within:ring-teal-300/10">
            <input
              value={newPost}
              onChange={(event) => setNewPost(event.target.value)}
              disabled={loading}
              placeholder="Tulis curhatanmu di sini..."
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600"
              onKeyDown={(event) => {
                if (event.key === 'Enter') handlePost();
              }}
            />
            <button
              type="button"
              onClick={handlePost}
              disabled={loading || !newPost.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500 text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              aria-label="Kirim curhat"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-[680px] overflow-y-auto p-4 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
        {initialLoading ? (
          <div className="grid min-h-56 place-items-center text-sm text-slate-500">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-violet-300" />
              Memuat curhatan...
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-white/10 bg-slate-950/25 px-5 text-center">
            <div>
              <p className="text-sm font-semibold text-slate-200">Belum ada curhatan</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Jadilah yang pertama berbagi cerita.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const liked = likedPosts.has(post.ID);
              const replies = post.Replies || [];

              return (
                <article key={post.ID} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 transition hover:border-slate-500/40">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${getAvatarTone(post.ID)} text-xs font-bold text-white`}>
                        A
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-200">Anonim</span>
                          <SentimentBadge score={post.StressScore} />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">{formatTime(post.Timestamp)}</p>
                      </div>
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{post.Text}</p>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      onClick={() => toggleLike(post.ID)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        liked
                          ? 'border-rose-300/30 bg-rose-400/10 text-rose-200'
                          : 'border-white/10 bg-transparent text-slate-400 hover:border-rose-300/25 hover:bg-rose-400/10 hover:text-rose-200'
                      }`}
                    >
                      <Heart className="h-3.5 w-3.5" fill={liked ? 'currentColor' : 'none'} />
                      {liked ? 'Dukungan terkirim' : 'Beri dukungan'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveReplyId(activeReplyId === post.ID ? null : post.ID);
                        setReplyText('');
                      }}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        activeReplyId === post.ID
                          ? 'border-teal-300/30 bg-teal-400/10 text-teal-200'
                          : 'border-white/10 bg-transparent text-slate-400 hover:border-teal-300/25 hover:bg-teal-400/10 hover:text-teal-200'
                      }`}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Balas {replies.length > 0 ? `(${replies.length})` : ''}
                    </button>
                  </div>

                  {(replies.length > 0 || activeReplyId === post.ID) && (
                    <div className="mt-4 space-y-2 border-l border-teal-300/20 pl-3">
                      {replies.map((reply) => (
                        <div key={reply.ID} className="rounded-xl border border-white/10 bg-slate-900/65 px-3 py-2">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-slate-300">Anonim membalas</span>
                            <span className="text-[10px] text-slate-500">{formatTime(reply.Timestamp || new Date().toISOString())}</span>
                          </div>
                          <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">{reply.Text}</p>
                        </div>
                      ))}

                      {activeReplyId === post.ID && (
                        <div className="flex gap-2 pt-1">
                          <input
                            value={replyText}
                            onChange={(event) => setReplyText(event.target.value)}
                            placeholder="Tulis balasan anonim..."
                            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/65 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-teal-300/45"
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') handleReply(post.ID);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleReply(post.ID)}
                            disabled={!replyText.trim()}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-500 text-white transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                            aria-label="Kirim balasan"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
