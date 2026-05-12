import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, User,
  Loader2, Plus, Camera, X, Smile, MapPin, Image, Search, Users,
  Compass, TrendingUp, ChevronRight, Sparkles,
} from 'lucide-react';
import api from '../../api';
import PhotoViewerModal from './PhotoViewerModal';
import CreatePostModal from './CreatePostModal';

type FeedPost = {
  id: number;
  text: string;
  image: string;
  timestamp: string;
  user_id: number;
  username: string;
  nama: string;
  profile_pic: string;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  comments: {
    id: number;
    user_id: number;
    username: string;
    nama: string;
    profile_pic: string;
    text: string;
    timestamp: string;
  }[];
};

type NetworkUser = {
  id: number;
  nama: string;
  username: string;
  bio: string;
  profile_pic: string;
  is_followed: boolean;
  affinity: string;
};

function timeAgo(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} mnt`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} hr`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent`;

export default function UserNetwork() {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [networkUsers, setNetworkUsers] = useState<NetworkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ id: 0, nama: '', username: '', profile_pic: '' });
  const [activeTab, setActiveTab] = useState<'feed' | 'discover'>('feed');

  /* Modals */
  const [viewerSrc, setViewerSrc] = useState('');
  const [viewerUser, setViewerUser] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  /* Comments */
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [allComments, setAllComments] = useState<any[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);

  /* Fetch data */
  useEffect(() => {
    Promise.all([
      api.get('/user/profile'),
      api.get('/feed'),
      api.get('/network/users'),
    ]).then(([profileRes, feedRes, networkRes]) => {
      setCurrentUser({
        id: profileRes.data.id,
        nama: profileRes.data.nama,
        username: profileRes.data.username,
        profile_pic: profileRes.data.profile_pic || '',
      });
      setFeed(feedRes.data.feed || []);
      setNetworkUsers(networkRes.data.users || []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const refreshFeed = () => {
    api.get('/feed').then(res => setFeed(res.data.feed || [])).catch(() => {});
  };

  /* Like toggle */
  const toggleLike = async (postId: number) => {
    setFeed(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return { ...p, is_liked: !p.is_liked, like_count: p.like_count + (p.is_liked ? -1 : 1) };
    }));
    try {
      await api.post(`/post/${postId}/like`);
    } catch { refreshFeed(); }
  };

  /* Load comments */
  const loadComments = async (postId: number) => {
    if (commentPostId === postId) { setCommentPostId(null); return; }
    setCommentPostId(postId);
    setCommentLoading(true);
    try {
      const res = await api.get(`/post/${postId}/comments`);
      setAllComments(res.data.comments || []);
    } catch { setAllComments([]); }
    finally { setCommentLoading(false); }
  };

  /* Send comment */
  const sendComment = async (postId: number) => {
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText('');
    try {
      const res = await api.post(`/post/${postId}/comment`, { text });
      setAllComments(prev => [...prev, res.data.comment]);
      setFeed(prev => prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-[2px] border-[#262626] border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans">
      <style>{`
        .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #262626 transparent; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #262626; border-radius: 4px; }
        .scrollbar-none { scrollbar-width: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-30 bg-black border-b border-[#262626] px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">NexusMind</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setCreatePostOpen(true)} className="p-1 hover:text-[#a8a8a8] transition-colors"><Plus size={22} /></button>
          <button onClick={() => navigate('/user/settings')} className="w-7 h-7 rounded-full bg-gradient-to-br from-[#059669] to-[#06b6d4] flex items-center justify-center text-[10px] font-bold">
            {currentUser.nama.charAt(0)}
          </button>
        </div>
      </div>

      <div className="max-w-[935px] mx-auto flex">
        {/* Main Content */}
        <div className="flex-1 min-w-0 lg:mr-8">
          {/* Tab Toggle */}
          <div className="hidden lg:flex items-center justify-center gap-8 border-b border-[#262626] sticky top-0 bg-black z-20">
            {[
              { key: 'feed' as const, label: 'Beranda', icon: Sparkles },
              { key: 'discover' as const, label: 'Jelajahi', icon: Compass },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`relative flex items-center gap-2 px-2 py-4 text-[13px] font-semibold tracking-wide uppercase transition-colors ${activeTab === t.key ? 'text-white' : 'text-[#a8a8a8] hover:text-[#e0e0e0]'}`}
              >
                <t.icon size={16} />
                {t.label}
                {activeTab === t.key && (
                  <motion.div layoutId="feedTab" className="absolute bottom-0 left-0 right-0 h-[1px] bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Stories Bar */}
          <div className="px-4 pt-4 lg:pt-6 pb-2 overflow-x-auto scrollbar-none">
            <div className="flex gap-4">
              {/* Create story */}
              <button onClick={() => setCreatePostOpen(true)} className="flex flex-col items-center gap-1 shrink-0 group">
                <div className="relative w-[66px] h-[66px] rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#262626] group-hover:border-[#555] transition-colors">
                  <Plus size={24} color="#a8a8a8" />
                </div>
                <span className="text-[11px] text-[#a8a8a8] group-hover:text-white transition-colors">Post</span>
              </button>

              {/* User stories */}
              {networkUsers.slice(0, 10).map(u => (
                <button
                  key={u.id}
                  onClick={() => navigate(`/user/profile/${u.username}`)}
                  className="flex flex-col items-center gap-1 shrink-0 group"
                >
                  <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-gradient-to-tr from-[#f59e0b] via-[#ef4444] to-[#a855f7]">
                    <div className="w-full h-full rounded-full bg-black p-[2px]">
                      {u.profile_pic ? (
                        <img src={u.profile_pic} alt={u.nama} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                          <User size={18} color="#a8a8a8" />
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-[#a8a8a8] group-hover:text-white transition-colors truncate max-w-[66px]">
                    {u.username.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Feed */}
          <div ref={feedRef} className="pb-16">
            {feed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 px-4">
                <div className="w-[62px] h-[62px] rounded-full border-2 border-[#262626] flex items-center justify-center">
                  <Camera size={24} color="#a8a8a8" />
                </div>
                <span className="text-sm text-[#a8a8a8] font-semibold mt-2">Belum ada postingan</span>
                <span className="text-xs text-[#555]">Jadilah yang pertama membuat postingan</span>
                <button onClick={() => setCreatePostOpen(true)} className="mt-2 px-6 py-1.5 rounded-lg text-[13px] font-semibold text-white bg-[#0095f6] hover:bg-[#1877f2] transition-colors">
                  Buat Postingan
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                {feed.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={idx < 3 ? { opacity: 0, y: 16 } : false}
                    animate={idx < 3 ? { opacity: 1, y: 0 } : false}
                    transition={{ delay: idx * 0.08 }}
                    className="border-b border-[#262626] lg:border lg:border-[#262626] lg:rounded-sm lg:mb-4"
                  >
                    {/* Post Header */}
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div
                        onClick={() => navigate(`/user/profile/${post.username}`)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#059669] to-[#06b6d4] p-[1.5px]">
                          <div className="w-full h-full rounded-full bg-black p-[1px]">
                            {post.profile_pic ? (
                              <img src={post.profile_pic} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                                <User size={14} color="#a8a8a8" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-[13px] font-semibold hover:text-[#a8a8a8] transition-colors">{post.username}</span>
                        </div>
                      </div>
                      <button className="p-1"><MoreHorizontal size={16} color="#a8a8a8" /></button>
                    </div>

                    {/* Post Image */}
                    {post.image && (
                      <div
                        className="bg-[#1a1a1a] flex items-center justify-center cursor-pointer"
                        onClick={() => { setViewerSrc(post.image); setViewerUser(post.username); setViewerOpen(true); }}
                      >
                        <img src={post.image} alt="" className="w-full max-h-[585px] object-contain" />
                      </div>
                    )}

                    {/* Post Text (if no image or as caption) */}
                    {post.text && (
                      <div className="px-3 py-2">
                        <p className="text-[13px] leading-relaxed text-[#f5f5f5] whitespace-pre-wrap break-words">{post.text}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleLike(post.id)} className="p-1 transition-transform active:scale-125">
                          <Heart size={22} fill={post.is_liked ? '#ef4444' : 'none'} color={post.is_liked ? '#ef4444' : '#fff'} />
                        </button>
                        <button onClick={() => loadComments(post.id)} className="p-1">
                          <MessageCircle size={22} color="#fff" />
                        </button>
                        <button className="p-1">
                          <Send size={22} color="#fff" />
                        </button>
                      </div>
                      <button className="p-1">
                        <Bookmark size={22} color="#fff" />
                      </button>
                    </div>

                    {/* Likes */}
                    {post.like_count > 0 && (
                      <div className="px-3 pb-1">
                        <span className="text-[13px] font-semibold">{post.like_count.toLocaleString()} suka</span>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="px-3 pb-1">
                      <span className="text-[10px] text-[#a8a8a8] uppercase tracking-wide">{timeAgo(post.timestamp)}</span>
                    </div>

                    {/* Comments section */}
                    {commentPostId === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="border-t border-[#262626]"
                      >
                        {commentLoading ? (
                          <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-[#a8a8a8]" /></div>
                        ) : (
                          <div className="max-h-[200px] overflow-y-auto scrollbar-thin px-3 py-2 space-y-2">
                            {allComments.map(c => (
                              <div key={c.id} className="flex gap-2 text-[13px]">
                                <span className="font-semibold shrink-0 cursor-pointer hover:text-[#a8a8a8]" onClick={() => navigate(`/user/profile/${c.username}`)}>{c.username}</span>
                                <span className="text-[#f5f5f5] break-words">{c.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-2 border-t border-[#262626]">
                          <input
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') sendComment(post.id); }}
                            placeholder="Tambah komentar..."
                            className="flex-1 bg-transparent text-[13px] text-white placeholder:text-[#555] outline-none"
                          />
                          <button
                            onClick={() => sendComment(post.id)}
                            disabled={!commentText.trim()}
                            className={`text-[13px] font-semibold ${commentText.trim() ? 'text-[#0095f6] hover:text-white' : 'text-[#0095f6]/30 cursor-default'} transition-colors`}
                          >
                            Kirim
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* View all comments link */}
                    {post.comment_count > 3 && commentPostId !== post.id && (
                      <button onClick={() => loadComments(post.id)} className="px-3 pb-2 text-[12px] text-[#a8a8a8] hover:text-[#e0e0e0]">
                        Lihat semua {post.comment_count} komentar
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (Desktop) */}
        <div className="hidden lg:block w-[320px] pt-8 shrink-0">
          {/* Profile card */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate('/user/settings')} className="w-11 h-11 rounded-full bg-gradient-to-br from-[#059669] to-[#06b6d4] p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-black p-[1px]">
                {currentUser.profile_pic ? (
                  <img src={currentUser.profile_pic} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                    <User size={16} color="#a8a8a8" />
                  </div>
                )}
              </div>
            </button>
            <div className="min-w-0 flex-1">
              <button onClick={() => navigate('/user/settings')} className="text-[13px] font-semibold hover:text-[#a8a8a8] transition-colors block truncate">{currentUser.username}</button>
              <span className="text-[12px] text-[#a8a8a8] truncate block">{currentUser.nama}</span>
            </div>
            <button onClick={() => setCreatePostOpen(true)} className="text-[12px] font-semibold text-[#0095f6] hover:text-white transition-colors shrink-0">
              Post
            </button>
          </div>

          {/* Suggestions */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-[#a8a8a8]">Disarankan untuk Anda</span>
              <button onClick={() => setActiveTab('discover')} className="text-[12px] font-semibold hover:text-[#a8a8a8] transition-colors">Lihat Semua</button>
            </div>
            <div className="space-y-3">
              {networkUsers.slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center gap-3">
                  <button onClick={() => navigate(`/user/profile/${u.username}`)} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#059669] to-[#06b6d4] p-[1.5px] shrink-0">
                    <div className="w-full h-full rounded-full bg-black p-[1px]">
                      {u.profile_pic ? (
                        <img src={u.profile_pic} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                          <User size={12} color="#a8a8a8" />
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => navigate(`/user/profile/${u.username}`)} className="text-[13px] font-semibold hover:text-[#a8a8a8] transition-colors truncate block">{u.username}</button>
                    <span className="text-[11px] text-[#a8a8a8] truncate block">{u.nama}</span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await api.post(`/network/follow/${u.id}`);
                        setNetworkUsers(prev => prev.map(nu => nu.id === u.id ? { ...nu, is_followed: res.data.is_followed } : nu));
                      } catch {}
                    }}
                    className="text-[12px] font-semibold text-[#0095f6] hover:text-white transition-colors shrink-0"
                  >
                    {u.is_followed ? 'Mengikuti' : 'Ikuti'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-[11px] text-[#555] leading-relaxed space-y-0.5 mt-6">
            <p>NexusMind - AI Mental Health Platform</p>
            <p>(c) 2026 NexusMind</p>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-[#262626] flex items-center justify-around py-2 z-30">
        {[
          { key: 'feed' as const, icon: Sparkles },
          { key: 'discover' as const, icon: Compass },
          { key: 'create', icon: Plus },
          { key: 'profile', icon: User },
        ].map((btn, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (btn.key === 'create') setCreatePostOpen(true);
              else if (btn.key === 'profile') navigate('/user/settings');
              else setActiveTab(btn.key as any);
            }}
            className="p-2"
          >
            <btn.icon size={22} color={btn.key === activeTab ? '#fff' : '#a8a8a8'} />
          </button>
        ))}
      </div>

      {/* Discover tab content */}
      {activeTab === 'discover' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black z-40 lg:hidden overflow-y-auto pb-20"
        >
          <div className="sticky top-0 bg-black border-b border-[#262626] px-4 py-3 flex items-center justify-between z-10">
            <h2 className="text-base font-semibold">Jelajahi</h2>
            <button onClick={() => setActiveTab('feed')} className="p-1 text-white"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-3 gap-[2px]">
            {networkUsers.map(u => (
              <div
                key={u.id}
                onClick={() => { navigate(`/user/profile/${u.username}`); setActiveTab('feed'); }}
                className="aspect-square bg-[#1a1a1a] flex items-center justify-center cursor-pointer relative group overflow-hidden"
              >
                {u.profile_pic ? (
                  <img src={u.profile_pic} alt={u.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <User size={32} color="#555" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-semibold truncate px-2">{u.nama}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Modals */}
      <PhotoViewerModal src={viewerSrc} username={viewerUser} open={viewerOpen} onClose={() => setViewerOpen(false)} />
      <CreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onCreated={refreshFeed}
        currentUser={currentUser}
      />
    </div>
  );
}
