import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, MessageCircle, MapPin, Calendar, Heart, HeartHandshake, Smile, Sparkles, ArrowLeft, Grid3X3,
  Activity, Info, MoreHorizontal, Users, ChevronRight, Clock, TrendingUp, Shield, Zap, CheckCircle2,
  Loader2, Send, ExternalLink, Brain, Target, Flame, Plus, Camera, Image, X, Settings, LogOut, AtSign, Lock
} from 'lucide-react';
import api from '../../api';
import PhotoViewerModal from './PhotoViewerModal';
import CreatePostModal from './CreatePostModal';

type ProfileData = {
  id: number;
  nama: string;
  username: string;
  bio: string;
  profile_pic: string;
  joined_at: string;
  follower_count: number;
  following_count: number;
  post_count: number;
  assessment_count: number;
  posts: { ID: number; Text: string; Image: string; Timestamp: string; Reactions: number }[];
  activity: { type: string; timestamp: string; detail: string; score: number }[];
};

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function timeAgo(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} menit`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} hari`;
  return formatDate(ts);
}

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent`;

export default function UserProfileSettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  
  // Settings Form State
  const [form, setForm] = useState({ nama: '', username: '', bio: '', profile_pic: '' });
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [viewerSrc, setViewerSrc] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<any>(null);
  const lastMsgIdRef = useRef(0);

  useEffect(() => {
    if (message) { const t = setTimeout(() => setMessage(null), 3000); return () => clearTimeout(t); }
  }, [message]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await api.get('/user/profile');
      const pData = pRes.data;
      setForm({
        nama: pData.nama,
        username: pData.username,
        bio: pData.bio || '',
        profile_pic: pData.profile_pic || ''
      });
      
      const netRes = await api.get(`/network/user/${pData.username}`);
      setProfile({ ...netRes.data, id: pData.id });
    } catch {
      setMessage({ text: 'Gagal memuat profil', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Form Handlers
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'Ukuran file maksimal 2MB', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, profile_pic: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload: any = { bio: form.bio, profile_pic: form.profile_pic };
      const originalUser = (await api.get('/user/profile')).data;
      if (form.username && form.username !== originalUser.username) {
        payload.username = form.username;
      }
      if (password.trim()) {
        payload.password = password.trim();
      }
      const res = await api.put('/user/profile', payload);
      setPassword('');
      setMessage({ text: 'Profil berhasil disimpan', type: 'success' });
      if (form.profile_pic) {
        setProfile(p => p ? { ...p, profile_pic: form.profile_pic } : p);
      }
      if (res.data.auth_changed) {
        setMessage({ text: 'Kredensial berubah. Login ulang diperlukan.', type: 'warning' });
        setTimeout(() => { localStorage.removeItem('token'); navigate('/login'); }, 2000);
      }
    } catch (x: any) {
      setMessage({ text: x.response?.data?.error || 'Gagal menyimpan', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Chat Handlers
  const openChat = async () => {
    if (!profile) return;
    setChatOpen(true);
    setChatLoading(true);
    lastMsgIdRef.current = 0;
    try {
      const res = await api.get(`/network/messages/${profile.id}`);
      setMessages(res.data.messages || []);
      if (res.data.messages?.length) {
        lastMsgIdRef.current = res.data.messages[res.data.messages.length - 1].ID;
      }
    } catch { setMessages([]); }
    finally { setChatLoading(false); }
  };

  const closeChat = () => {
    setChatOpen(false);
    setMessages([]);
    setChatInput('');
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = null;
  };

  useEffect(() => {
    if (chatOpen && profile) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await api.get(`/network/messages/${profile.id}`);
          const msgs = res.data.messages || [];
          if (msgs.length > 0) {
            const lastId = msgs[msgs.length - 1].ID;
            if (lastId > lastMsgIdRef.current) {
              setMessages(msgs);
              lastMsgIdRef.current = lastId;
            }
          }
        } catch { /* silent */ }
      }, 2500);
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }
  }, [chatOpen, profile]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!chatInput.trim() || !profile || sending) return;
    setSending(true);
    const text = chatInput.trim();
    setChatInput('');
    const tempMsg = { ID: Date.now(), SenderID: profile.id, ReceiverID: profile.id, Text: text, Timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    try {
      const res = await api.post(`/network/messages/${profile.id}`, { text });
      if (res.data.message) {
        setMessages(prev => prev.map(m => m.ID === tempMsg.ID ? { ...res.data.message } : m));
        lastMsgIdRef.current = res.data.message.ID;
      }
    } catch {
      setMessages(prev => prev.filter(m => m.ID !== tempMsg.ID));
    } finally {
      setSending(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  function formatChatTime(ts: string) {
    const d = new Date(ts);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060816]">
        <div className={`h-48 bg-[#0f172a] ${shimmer}`} />
        <div className="max-w-5xl mx-auto px-6 -mt-16 relative z-10">
          <div className={`w-28 h-28 rounded-full bg-[#1e293b] border-4 border-[#060816] ${shimmer}`} />
          <div className="mt-4 space-y-3">
            <div className={`h-7 w-48 bg-[#1e293b] rounded-lg ${shimmer}`} />
            <div className={`h-4 w-32 bg-[#1e293b] rounded-lg ${shimmer}`} />
            <div className={`h-4 w-80 bg-[#1e293b] rounded-lg ${shimmer}`} />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#060816] text-[#e2e8f0] font-sans">
      <style>{`
        .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #1e293b transparent; }
        .scrollbar-thin::-webkit-scrollbar { width: 5px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>

      {/* Banner */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#059669] via-[#06b6d4] to-[#6c63ff]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060816] via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(108,99,255,0.15) 0%, transparent 40%)`,
        }} />
        <button onClick={() => navigate('/dashboard')} className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/40 transition-all text-xs font-medium">
          <ArrowLeft size={15} /> Kembali ke Beranda
        </button>
      </div>

      {/* Profile Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10">
        
        {/* Messages Alert */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium shadow-lg backdrop-blur-md border ${
              message.type === 'success' ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#4ade80]' :
              message.type === 'error'   ? 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#f87171]' :
                                           'bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#fbbf24]'
            }`}
          >
            <CheckCircle2 size={15} /> {message.text}
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile.profile_pic ? (
              <img
                src={profile.profile_pic}
                alt={profile.nama}
                onClick={() => { setViewerSrc(profile.profile_pic); setViewerOpen(true); }}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-[#060816] shadow-xl cursor-pointer hover:scale-105 transition-transform duration-300"
                style={{ boxShadow: '0 0 30px rgba(6,182,212,0.3), 0 4px 20px rgba(0,0,0,0.4)' }}
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-4 border-[#060816] flex items-center justify-center shadow-xl">
                <User size={40} color="#475569" />
              </div>
            )}
            <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-[#22c55e] border-[3px] border-[#060816] shadow-lg" />
          </div>

          {/* Info & Actions */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="pt-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white m-0">{profile.nama}</h1>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-[#6c63ff]/10 border border-[#6c63ff]/20 text-[#a89cff]">
                  <Sparkles size={11} /> Anda
                </span>
              </div>
              <p className="text-[13px] sm:text-sm text-[#8890a4] mt-1">@{profile.username}</p>
              <p className="text-[13px] sm:text-sm text-[#c0c9e0] mt-2 max-w-lg leading-relaxed">
                {profile.bio || <span className="text-[#475569] italic">Tidak ada bio</span>}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-[#8890a4]">
                <span className="flex items-center gap-1"><Calendar size={12} /> Bergabung {formatDate(profile.joined_at)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button onClick={() => setActiveTab('edit')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium border border-[#1e293b] text-[#c0c9e0] hover:border-[#6c63ff]/30 hover:text-[#a89cff] hover:bg-[#6c63ff]/5 transition-all duration-200">
                <Settings size={15} /> Pengaturan
              </button>
              <button onClick={openChat} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium border border-[#1e293b] text-[#c0c9e0] hover:border-[#059669]/30 hover:text-[#34d399] hover:bg-[#059669]/5 transition-all duration-200">
                <MessageCircle size={15} /> Catatan
              </button>
              <button onClick={() => setCreatePostOpen(true)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-200" style={{ background: 'linear-gradient(135deg, #059669, #06b6d4)', boxShadow: '0 4px 15px rgba(6,182,212,0.3)' }}>
                <Plus size={15} /> Buat
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-3 sm:w-fit gap-2">
          {[
            { value: profile.follower_count, label: 'Pengikut' },
            { value: profile.following_count, label: 'Mengikuti' },
            { value: profile.post_count + profile.assessment_count, label: 'Postingan' },
          ].map(s => (
            <div key={s.label} className="bg-[#0f172a]/80 backdrop-blur-sm border border-[#1e293b] rounded-xl px-5 py-3 text-center">
              <div className="text-lg font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-[#475569] uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-[#1e293b] flex gap-0 overflow-x-auto scrollbar-thin">
          {[
            { key: 'posts', label: 'Posts', icon: Grid3X3 },
            { key: 'activity', label: 'Aktivitas', icon: Activity },
            { key: 'edit', label: 'Edit Profil', icon: Settings },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className="relative flex items-center gap-2 px-5 py-3 text-[13px] font-medium transition-colors whitespace-nowrap" style={{ color: activeTab === t.key ? '#e2e8f0' : '#64748b' }}>
              <t.icon size={15} /> {t.label}
              {activeTab === t.key && (
                <motion.div layoutId="profileTabSettings" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #059669, #06b6d4)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="pb-16 mt-6">
          <AnimatePresence mode="wait">

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <motion.div key="posts" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {profile.posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-16 h-16 rounded-full bg-[#0f172a] border border-[#1e293b] flex items-center justify-center">
                      <Camera size={24} color="#475569" />
                    </div>
                    <span className="text-sm text-[#64748b]">Belum ada postingan</span>
                    <button onClick={() => setCreatePostOpen(true)} className="mt-2 text-[12px] font-semibold text-[#06b6d4] hover:text-[#22d3ee] transition-colors">
                      Buat Postingan Pertama
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {profile.posts.map((post, idx) => (
                      <motion.div
                        key={post.ID}
                        initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                        onClick={() => { if (post.Image) { setViewerSrc(post.Image); setViewerOpen(true); } }}
                        className={`group relative bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden hover:border-[#06b6d4]/20 transition-all duration-300 ${post.Image ? 'cursor-pointer' : ''}`}
                      >
                        {post.Image ? (
                          <>
                            <div className="aspect-square overflow-hidden">
                              <img src={post.Image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                              {post.Text && <p className="text-[11px] text-white line-clamp-2 leading-snug mb-1">{post.Text}</p>}
                              <div className="flex items-center justify-between text-[10px] text-white/70">
                                <span>{timeAgo(post.Timestamp)}</span>
                                <span className="flex items-center gap-1"><Heart size={11} /> {post.Reactions}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="p-4">
                            <p className="text-[13px] text-[#c0c9e0] line-clamp-3 leading-relaxed mb-3">{post.Text}</p>
                            <div className="flex items-center justify-between text-[10px] text-[#64748b]">
                              <span>{timeAgo(post.Timestamp)}</span>
                              <span className="flex items-center gap-1"><Heart size={11} /> {post.Reactions}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {profile.activity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-16 h-16 rounded-full bg-[#0f172a] border border-[#1e293b] flex items-center justify-center">
                      <Activity size={24} color="#475569" />
                    </div>
                    <span className="text-sm text-[#64748b]">Belum ada aktivitas</span>
                  </div>
                ) : (
                  <div className="max-w-2xl space-y-1">
                    {profile.activity.map((item, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} className="relative pl-8 pb-5">
                        {idx < profile.activity.length - 1 && <div className="absolute left-[15px] top-9 bottom-0 w-px bg-[#1e293b]" />}
                        <div className="absolute left-[9px] top-1 w-3.5 h-3.5 rounded-full border-2 border-[#1e293b] bg-[#0f172a]" style={{ borderColor: item.type === 'prediction' ? '#22c55e' : '#1e293b' }} />
                        <div className="bg-[#0f172a]/60 backdrop-blur-sm border border-[#1e293b] rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded-md bg-[#22c55e]/10 flex items-center justify-center">
                              <Brain size={11} color="#22c55e" />
                            </div>
                            <span className="text-[11px] font-semibold text-[#4ade80]">Asesmen Risiko</span>
                            <span className="text-[10px] text-[#475569] ml-auto">{timeAgo(item.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[13px] font-bold ${item.detail === 'Rendah' ? 'text-[#4ade80]' : item.detail === 'Sedang' ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>{item.detail}</span>
                            <span className="text-[11px] text-[#8890a4]">Skor: {item.score?.toFixed(1)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Edit Profile Tab */}
            {activeTab === 'edit' && (
              <motion.div key="edit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="max-w-2xl">
                <div className="bg-[#0f172a]/60 backdrop-blur-sm border border-[#1e293b] rounded-xl p-5 sm:p-6">
                  
                  {/* Avatar Edit */}
                  <div className="flex items-center gap-5 pb-6 mb-6 border-b border-[#1e293b]">
                    <div className="relative group shrink-0">
                      <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#059669] to-[#06b6d4] p-[2px] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-full h-full rounded-full bg-[#0f172a] p-[1px]">
                          {form.profile_pic ? (
                            <img src={form.profile_pic} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <div className="w-full h-full rounded-full flex items-center justify-center"><User size={28} color="#475569" /></div>
                          )}
                        </div>
                      </div>
                      <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Camera size={20} className="text-white" />
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Foto Profil</h3>
                      <button onClick={() => fileInputRef.current?.click()} className="text-[12px] font-medium text-[#06b6d4] hover:text-[#22d3ee] transition-colors mt-1">
                        Unggah Foto Baru
                      </button>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-6">
                      <label className="sm:w-[120px] shrink-0 text-[12px] font-semibold sm:text-right text-[#8890a4]">Nama Lengkap</label>
                      <input value={form.nama} readOnly className="flex-1 bg-[#060816] border border-[#1e293b] rounded-lg px-3.5 py-2.5 text-[13px] text-[#64748b] outline-none cursor-not-allowed" />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-6">
                      <label className="sm:w-[120px] shrink-0 text-[12px] font-semibold sm:text-right text-[#8890a4]">Username</label>
                      <div className="flex-1 relative">
                        <AtSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569]" />
                        <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full bg-[#060816] border border-[#1e293b] rounded-lg pl-9 pr-3.5 py-2.5 text-[13px] text-white outline-none focus:border-[#06b6d4] transition-colors" />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-6">
                      <label className="sm:w-[120px] shrink-0 text-[12px] font-semibold sm:text-right sm:pt-3 text-[#8890a4]">Bio</label>
                      <div className="flex-1">
                        <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={4} placeholder="Tulis sedikit tentang diri Anda..." maxLength={150} className="w-full bg-[#060816] border border-[#1e293b] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder:text-[#475569] outline-none focus:border-[#06b6d4] transition-colors resize-none scrollbar-thin" />
                        <div className="text-right text-[10px] text-[#64748b] mt-1">{form.bio.length}/150</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-6">
                      <label className="sm:w-[120px] shrink-0 text-[12px] font-semibold sm:text-right sm:pt-3 text-[#8890a4]">Password Baru</label>
                      <div className="flex-1">
                        <div className="relative">
                          <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569]" />
                          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Kosongkan jika tidak ingin mengubah" className="w-full bg-[#060816] border border-[#1e293b] rounded-lg pl-9 pr-3.5 py-2.5 text-[13px] text-white placeholder:text-[#475569] outline-none focus:border-[#06b6d4] transition-colors" />
                        </div>
                        <p className="text-[10px] text-[#64748b] mt-1.5 leading-relaxed">Minimal 6 karakter. Jika diubah, Anda akan diminta login kembali.</p>
                      </div>
                    </div>

                    <div className="flex justify-end sm:justify-start sm:ml-[144px] pt-4">
                      <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg" style={{ background: 'linear-gradient(135deg, #059669, #06b6d4)' }}>
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                    </div>

                    <div className="pt-8 mt-8 border-t border-[#1e293b] flex justify-end sm:justify-start sm:ml-[144px]">
                      <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors">
                        <LogOut size={14} /> Keluar dari Akun
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <PhotoViewerModal src={viewerSrc} alt="Profile photo" username={profile.username} open={viewerOpen} onClose={() => setViewerOpen(false)} />
      <CreatePostModal open={createPostOpen} onClose={() => setCreatePostOpen(false)} onCreated={fetchData} currentUser={{ nama: profile.nama, profile_pic: profile.profile_pic }} />

      {/* ─── Messenger Panel (Catatan Pribadi) ─── */}
      <AnimatePresence>
        {chatOpen && profile && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" onClick={closeChat} />
            <motion.div initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }} className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-[#060816] border-l border-[#1e293b] flex flex-col z-[95] shadow-2xl">
              
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e293b] bg-[#0f172a]/50 shrink-0">
                <button onClick={closeChat} className="p-1.5 text-[#8890a4] hover:text-white transition-colors bg-[#1e293b] rounded-full">
                  <X size={16} />
                </button>
                <div className="flex-1 min-w-0 pl-1">
                  <div className="text-[14px] font-bold text-white flex items-center gap-1.5">Catatan Pribadi <Lock size={12} className="text-[#06b6d4]" /></div>
                  <div className="text-[11px] text-[#64748b]">Hanya Anda yang bisa melihat ini</div>
                </div>
              </div>

              <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed" style={{ backgroundBlendMode: 'overlay', backgroundColor: '#060816' }}>
                {chatLoading ? (
                  <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-[#06b6d4]" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 opacity-70">
                    <div className="w-16 h-16 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center shadow-lg">
                      <Lock size={24} className="text-[#06b6d4]" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-[14px] font-bold text-white mb-1">Ruang Catatan Anda</h4>
                      <p className="text-[11px] text-[#64748b] max-w-[200px]">Simpan ide, draft, atau catatan pribadi di sini.</p>
                    </div>
                  </div>
                ) : (
                  messages.map(msg => (
                    <motion.div key={msg.ID} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                      <div className="max-w-[85%]">
                        <div className="px-4 py-3 text-[13px] leading-relaxed break-words shadow-lg" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#f8fafc', borderRadius: '16px 16px 4px 16px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                          {msg.Text}
                        </div>
                        <div className="text-[10px] text-[#64748b] mt-1.5 text-right flex items-center justify-end gap-1">
                          {formatChatTime(msg.Timestamp)}
                          <CheckCircle2 size={10} className="text-[#06b6d4]" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="p-4 bg-[#0f172a] border-t border-[#1e293b] shrink-0">
                <div className="flex items-end gap-2 bg-[#060816] rounded-2xl p-2 border border-[#1e293b] focus-within:border-[#06b6d4]/50 transition-colors shadow-inner">
                  <textarea
                    value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={handleChatKeyDown}
                    placeholder="Tulis catatan..."
                    className="flex-1 bg-transparent text-[13px] text-white placeholder:text-[#475569] outline-none min-h-[40px] max-h-[120px] py-2 px-2 resize-none scrollbar-thin"
                    rows={1}
                  />
                  <button onClick={sendMessage} disabled={!chatInput.trim() || sending} className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition-all mb-0.5" style={{ background: 'linear-gradient(135deg, #059669, #06b6d4)' }}>
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
