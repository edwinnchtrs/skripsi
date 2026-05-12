import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, UserCheck, Search, MessageCircle, X,
  Send, Clock, Heart, HeartHandshake, Smile,
  Loader2, ChevronRight, ArrowLeft, Sparkles, User,
  TrendingUp, Compass, Zap, Star, ExternalLink,
} from 'lucide-react';
import api from '../../api';
import PhotoViewerModal from './PhotoViewerModal';

type NetworkUser = {
  id: number;
  nama: string;
  username: string;
  bio: string;
  profile_pic: string;
  is_followed: boolean;
  affinity: string;
};

type ChatMessage = {
  ID: number;
  SenderID: number;
  ReceiverID: number;
  Text: string;
  Timestamp: string;
};

type ChatPartner = {
  id: number;
  nama: string;
  username: string;
  profile_pic: string;
};

const filterTabs = [
  { key: 'all', label: 'Semua', color: '#64748b' },
  { key: 'followed', label: 'Mengikuti', color: '#22c55e' },
  { key: 'teman', label: 'Teman', color: '#3ecfcf' },
  { key: 'pacar', label: 'Pacar', color: '#ef4444' },
  { key: 'saudara', label: 'Saudara', color: '#f59e0b' },
];

function getAffinityBadge(affinity: string) {
  switch (affinity) {
    case 'teman': return { icon: Smile, color: '#3ecfcf', label: 'Teman' };
    case 'pacar': return { icon: Heart, color: '#ef4444', label: 'Pacar' };
    case 'saudara': return { icon: HeartHandshake, color: '#f59e0b', label: 'Saudara' };
    default: return null;
  }
}

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} mnt`;
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent`;

export default function UserNetwork() {
  const navigate = useNavigate();
  const location = useLocation();

  const [users, setUsers] = useState<NetworkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentUserId, setCurrentUserId] = useState(0);

  /* ─── Chat state ─── */
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [viewerSrc, setViewerSrc] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgIdRef = useRef(0);

  /* ─── Fetch current user ─── */
  useEffect(() => {
    api.get('/user/profile').then(r => setCurrentUserId(r.data.id)).catch(() => {});
  }, []);

  /* ─── Fetch users ─── */
  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/network/users');
      setUsers(res.data.users || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ─── Open chat from navigation state ─── */
  useEffect(() => {
    const state = location.state as { openChat?: number } | null;
    if (state?.openChat) {
      const target = users.find(u => u.id === state.openChat);
      if (target) openChatPanel(target);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, users]);

  /* ─── Follow / Unfollow ─── */
  const toggleFollow = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, is_followed: !u.is_followed } : u)));
    try {
      const res = await api.post(`/network/follow/${id}`);
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, is_followed: res.data.is_followed } : u)));
    } catch { fetchUsers(); }
  };

  /* ─── Update Affinity ─── */
  const updateAffinity = async (e: React.ChangeEvent<HTMLSelectElement>, id: number) => {
    e.stopPropagation();
    const type = e.target.value;
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, affinity: type } : u)));
    try {
      const res = await api.post(`/network/affinity/${id}`, { type });
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, affinity: res.data.affinity } : u)));
    } catch { fetchUsers(); }
  };

  /* ─── Navigate to profile ─── */
  const goToProfile = (user: NetworkUser) => {
    navigate(`/user/profile/${user.username}`);
  };

  /* ─── Open chat ─── */
  const openChatPanel = async (target: NetworkUser) => {
    setChatPartner({ id: target.id, nama: target.nama, username: target.username, profile_pic: target.profile_pic });
    setChatLoading(true);
    lastMsgIdRef.current = 0;
    try {
      const res = await api.get(`/network/messages/${target.id}`);
      setMessages(res.data.messages || []);
      if (res.data.messages?.length) {
        lastMsgIdRef.current = res.data.messages[res.data.messages.length - 1].ID;
      }
    } catch { setMessages([]); }
    finally { setChatLoading(false); }
  };

  const openChat = (e: React.MouseEvent, user: NetworkUser) => {
    e.stopPropagation();
    openChatPanel(user);
  };

  const closeChat = () => {
    setChatPartner(null);
    setMessages([]);
    setChatInput('');
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = null;
  };

  /* ─── Polling for new messages ─── */
  useEffect(() => {
    if (chatPartner) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await api.get(`/network/messages/${chatPartner.id}`);
          const msgs: ChatMessage[] = res.data.messages || [];
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
  }, [chatPartner]);

  /* ─── Scroll to bottom ─── */
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  /* ─── Send message ─── */
  const sendMessage = async () => {
    if (!chatInput.trim() || !chatPartner || sending) return;
    setSending(true);
    const text = chatInput.trim();
    setChatInput('');
    const tempMsg: ChatMessage = { ID: Date.now(), SenderID: currentUserId, ReceiverID: chatPartner.id, Text: text, Timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    try {
      const res = await api.post(`/network/messages/${chatPartner.id}`, { text });
      if (res.data.message) {
        setMessages(prev => prev.map(m => m.ID === tempMsg.ID ? { ...res.data.message } : m));
        lastMsgIdRef.current = res.data.message.ID;
      }
    } catch {
      setMessages(prev => prev.filter(m => m.ID !== tempMsg.ID));
    } finally { setSending(false); }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ─── Filter ─── */
  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.nama.toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q) || (u.bio || '').toLowerCase().includes(q);
    switch (activeFilter) {
      case 'followed': return matchSearch && u.is_followed;
      case 'teman': return matchSearch && u.affinity === 'teman';
      case 'pacar': return matchSearch && u.affinity === 'pacar';
      case 'saudara': return matchSearch && u.affinity === 'saudara';
      default: return matchSearch;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060816] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-[3px] border-[#1e293b] border-t-[#06b6d4] animate-spin" />
          <span className="text-xs text-[#64748b]">Menjelajahi komunitas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060816] font-sans">
      <style>{`
        .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #1e293b transparent; }
        .scrollbar-thin::-webkit-scrollbar { width: 5px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 15px rgba(6,182,212,0.15); } 50% { box-shadow: 0 0 30px rgba(6,182,212,0.3); } }
      `}</style>

      <div className="relative flex h-full min-h-0">
        {/* ──────────────── Main Discover Area ──────────────── */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${chatPartner ? 'lg:pr-[420px]' : ''}`}>
          {/* Hero Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#059669]/5 via-[#06b6d4]/5 to-transparent" />
            <div className="px-6 sm:px-8 pt-8 pb-6 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#059669] to-[#06b6d4] flex items-center justify-center shadow-lg"
                      style={{ boxShadow: '0 0 25px rgba(6,182,212,0.25)' }}>
                      <Compass size={20} color="#fff" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white m-0">Jelajahi Komunitas</h1>
                      <p className="text-[12px] text-[#64748b] m-0">
                        <span className="text-[#06b6d4] font-semibold">{users.length}</span> anggota • Temukan koneksi & dukungan
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-[#0f172a]/80 backdrop-blur-sm border border-[#1e293b] rounded-xl px-3 py-2 text-[11px] text-[#8890a4] w-fit">
                  <TrendingUp size={13} color="#22c55e" />
                  <span className="text-[#22c55e] font-semibold">{users.filter(u => u.is_followed).length}</span> diikuti
                </div>
              </div>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="px-6 sm:px-8 pb-4 sticky top-0 bg-[#060816]/95 backdrop-blur-lg z-20 border-b border-[#0f172a]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569]" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, username, atau bio..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-[13px] text-[#e2e8f0] placeholder:text-[#475569] outline-none focus:border-[#06b6d4]/40 focus:ring-2 focus:ring-[#06b6d4]/10 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#8890a4] transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex gap-1 bg-[#0f172a]/80 backdrop-blur-sm rounded-xl p-1 border border-[#1e293b] w-fit overflow-x-auto scrollbar-thin">
                {filterTabs.map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className="relative px-3.5 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all duration-200"
                    style={{
                      background: activeFilter === key ? `${color}15` : 'transparent',
                      color: activeFilter === key ? color : '#64748b',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Grid */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-8 scrollbar-thin">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center">
                  <Users size={24} color="#475569" />
                </div>
                <span className="text-sm text-[#64748b] font-medium">Tidak ada pengguna ditemukan</span>
                <span className="text-[12px] text-[#475569]">Coba ubah filter atau kata kunci pencarian</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredUsers.map((user, idx) => {
                    const badge = getAffinityBadge(user.affinity);
                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, delay: idx * 0.04 }}
                        onClick={() => goToProfile(user)}
                        className="group cursor-pointer bg-[#0f172a] border border-[#1e293b] hover:border-[#06b6d4]/20 rounded-2xl p-5 flex flex-col relative overflow-hidden transition-all duration-300"
                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                        whileHover={{ y: -3, boxShadow: '0 0 30px rgba(6,182,212,0.08), 0 8px 25px rgba(0,0,0,0.4)' }}
                      >
                        {/* Gradient glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#06b6d4]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Affinity badge */}
                        {badge && (
                          <div
                            className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize backdrop-blur-sm"
                            style={{ background: `${badge.color}12`, color: badge.color, border: `1px solid ${badge.color}25` }}
                          >
                            <badge.icon size={11} /> {badge.label}
                          </div>
                        )}

                        {/* Avatar + Info */}
                        <div className="flex items-center gap-3.5 mb-3.5 relative z-10">
                          {user.profile_pic ? (
                            <div className="relative shrink-0">
                              <img
                                src={user.profile_pic}
                                alt={user.nama}
                                onClick={(e) => { e.stopPropagation(); setViewerSrc(user.profile_pic); setViewerOpen(true); }}
                                className="w-12 h-12 rounded-full object-cover border-2 border-[#1e293b] group-hover:border-[#06b6d4]/30 transition-colors cursor-pointer hover:scale-105"
                              />
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#22c55e] border-2 border-[#0f172a]" />
                            </div>
                          ) : (
                            <div className="relative shrink-0">
                              <div className="w-12 h-12 rounded-full bg-[#1e293b] flex items-center justify-center border-2 border-[#1e293b] group-hover:border-[#06b6d4]/30 transition-colors">
                                <User size={20} color="#475569" />
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#22c55e] border-2 border-[#0f172a]" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-semibold text-[#e2e8f0] truncate group-hover:text-white transition-colors">{user.nama}</div>
                            <div className="text-[11px] text-[#64748b] truncate">@{user.username}</div>
                          </div>
                        </div>

                        {/* Bio */}
                        <p className="text-[12px] text-[#8890a4] leading-relaxed line-clamp-2 mb-4 flex-1 min-h-[2.6em] relative z-10">
                          {user.bio || <span className="text-[#475569] italic">Tidak ada bio</span>}
                        </p>

                        {/* Divider + Actions */}
                        <div className="border-t border-[#1e293b] pt-3 flex items-center gap-2 relative z-10">
                          <button
                            onClick={(e) => toggleFollow(e, user.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all duration-200"
                            style={{
                              background: user.is_followed ? 'transparent' : 'linear-gradient(135deg, #059669, #06b6d4)',
                              color: user.is_followed ? '#8890a4' : '#fff',
                              border: user.is_followed ? '1px solid #1e293b' : 'none',
                            }}
                          >
                            {user.is_followed ? <UserCheck size={14} /> : <UserPlus size={14} />}
                            {user.is_followed ? 'Mengikuti' : 'Ikuti'}
                          </button>

                          <button
                            onClick={(e) => openChat(e, user)}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[12px] font-medium border border-[#1e293b] text-[#8890a4] hover:text-[#06b6d4] hover:border-[#06b6d4]/20 hover:bg-[#06b6d4]/5 transition-all duration-200"
                          >
                            <MessageCircle size={14} />
                            <span className="hidden sm:inline">Pesan</span>
                          </button>

                          <select
                            value={user.affinity}
                            onChange={(e) => updateAffinity(e, user.id)}
                            onClick={e => e.stopPropagation()}
                            className="appearance-none bg-[#060816] border border-[#1e293b] text-[11px] text-[#64748b] rounded-lg py-2 px-2 outline-none cursor-pointer hover:border-[#334155] transition-colors"
                          >
                            <option value="">Status</option>
                            <option value="teman">Teman</option>
                            <option value="pacar">Pacar</option>
                            <option value="saudara">Saudara</option>
                          </select>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* ──────────────── Chat Panel ──────────────── */}
        <AnimatePresence>
          {chatPartner && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                onClick={closeChat}
              />
              <motion.div
                initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-[#0f172a] border-l border-[#1e293b] flex flex-col z-50 shadow-2xl"
                style={{ boxShadow: '-10px 0 40px rgba(0,0,0,0.5)' }}
              >
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1e293b] shrink-0 bg-[#0f172a]/95 backdrop-blur-lg">
                  <button onClick={closeChat} className="p-1.5 rounded-lg hover:bg-[#1e293b] text-[#64748b] hover:text-[#e2e8f0] transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                  {chatPartner.profile_pic ? (
                    <div className="relative shrink-0">
                      <img src={chatPartner.profile_pic} alt={chatPartner.nama} className="w-9 h-9 rounded-full object-cover border border-[#1e293b]" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#22c55e] border-2 border-[#0f172a]" />
                    </div>
                  ) : (
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-[#1e293b] flex items-center justify-center border border-[#1e293b]">
                        <User size={16} color="#475569" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#22c55e] border-2 border-[#0f172a]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[#e2e8f0] truncate">{chatPartner.nama}</div>
                    <div className="text-[10px] text-[#22c55e]">Online</div>
                  </div>
                  <button
                    onClick={() => goToProfile(chatPartner as any)}
                    className="p-1.5 rounded-lg hover:bg-[#1e293b] text-[#64748b] hover:text-[#e2e8f0] transition-colors"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button onClick={closeChat} className="p-1.5 rounded-lg hover:bg-[#1e293b] text-[#64748b] hover:text-[#e2e8f0] transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* Messages */}
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
                  {chatLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-[2px] border-[#1e293b] border-t-[#06b6d4] animate-spin" />
                        <span className="text-[11px] text-[#475569]">Memuat pesan...</span>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center">
                        <MessageCircle size={22} color="#475569" />
                      </div>
                      <span className="text-[13px] text-[#64748b] font-medium">Belum ada pesan</span>
                      <span className="text-[11px] text-[#475569]">Kirim pesan pertama untuk memulai</span>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.SenderID === currentUserId;
                      return (
                        <motion.div
                          key={msg.ID}
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[78%] ${isMe ? 'order-1' : ''}`}>
                            <div
                              className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed break-words ${
                                isMe
                                  ? 'bg-gradient-to-br from-[#059669] to-[#06b6d4] text-white rounded-br-md'
                                  : 'bg-[#1e293b]/70 border border-[#334155] text-[#e2e8f0] rounded-bl-md'
                              }`}
                            >
                              {msg.Text}
                            </div>
                            <div className={`text-[10px] text-[#475569] mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                              {formatTime(msg.Timestamp)}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div className="px-3 py-3 border-t border-[#1e293b] shrink-0 bg-[#0f172a]/95 backdrop-blur-lg">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={handleChatKeyDown}
                      placeholder="Tulis pesan..."
                      rows={1}
                      className="flex-1 resize-none bg-[#060816] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-[13px] text-[#e2e8f0] placeholder:text-[#475569] outline-none focus:border-[#06b6d4]/30 transition-colors max-h-24 scrollbar-thin"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!chatInput.trim() || sending}
                      className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                      style={{
                        background: chatInput.trim() && !sending ? 'linear-gradient(135deg, #059669, #06b6d4)' : '#1e293b',
                        opacity: chatInput.trim() && !sending ? 1 : 0.4,
                        cursor: chatInput.trim() && !sending ? 'pointer' : 'default',
                        boxShadow: chatInput.trim() && !sending ? '0 4px 15px rgba(6,182,212,0.3)' : 'none',
                      }}
                    >
                      {sending ? (
                        <Loader2 size={16} className="animate-spin text-white" />
                      ) : (
                        <Send size={16} color={chatInput.trim() ? '#fff' : '#475569'} />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        src={viewerSrc}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
