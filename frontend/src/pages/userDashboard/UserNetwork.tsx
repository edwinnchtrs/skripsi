import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, UserCheck, Search, MessageCircle, X,
  Send, Clock, Heart, HeartHandshake, Smile,
  Loader2, ChevronRight, ArrowLeft, Sparkles, User,
} from 'lucide-react';
import api from '../../api';

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
  // temp flag untuk optimistic UI
  _temp?: boolean;
};

type ChatPartner = {
  id: number;
  nama: string;
  username: string;
  profile_pic: string;
};

const filterTabs = [
  { key: 'all', label: 'Semua', color: '#8890a4' },
  { key: 'followed', label: 'Mengikuti', color: '#22c55e' },
  { key: 'teman', label: 'Teman', color: '#3ecfcf' },
  { key: 'pacar', label: 'Pacar', color: '#ef4444' },
  { key: 'saudara', label: 'Saudara', color: '#f59e0b' },
];

function getAffinityBadge(affinity: string) {
  switch (affinity) {
    case 'teman':
      return { icon: Smile, color: '#3ecfcf', bg: 'rgba(62,207,207,0.12)', border: 'rgba(62,207,207,0.3)', label: 'Teman' };
    case 'pacar':
      return { icon: Heart, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', label: 'Pacar' };
    case 'saudara':
      return { icon: HeartHandshake, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: 'Saudara' };
    default:
      return null;
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

export default function UserNetwork() {
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
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ─── Follow / Unfollow ─── */
  const toggleFollow = async (id: number) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, is_followed: !u.is_followed } : u)));
    try {
      const res = await api.post(`/network/follow/${id}`);
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, is_followed: res.data.is_followed } : u)));
    } catch {
      fetchUsers();
    }
  };

  /* ─── Update Affinity ─── */
  const updateAffinity = async (id: number, type: string) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, affinity: type } : u)));
    try {
      const res = await api.post(`/network/affinity/${id}`, { type });
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, affinity: res.data.affinity } : u)));
    } catch {
      fetchUsers();
    }
  };

  /* ─── Open chat ─── */
  const openChat = async (target: NetworkUser) => {
    setChatPartner({
      id: target.id,
      nama: target.nama,
      username: target.username,
      profile_pic: target.profile_pic,
    });
    setChatLoading(true);
    lastMsgIdRef.current = 0;
    try {
      const res = await api.get(`/network/messages/${target.id}`);
      setMessages(res.data.messages || []);
      if (res.data.messages?.length) {
        lastMsgIdRef.current = res.data.messages[res.data.messages.length - 1].ID;
      }
    } catch {
      setMessages([]);
    } finally {
      setChatLoading(false);
    }
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
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [chatPartner]);

  /* ─── Scroll to bottom on new messages ─── */
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

    // Gunakan negative timestamp sebagai temp ID agar tidak konflik dengan DB auto-increment ID
    const tempId = -(Date.now());
    const tempMsg: ChatMessage = {
      ID: tempId,
      SenderID: currentUserId,
      ReceiverID: chatPartner.id,
      Text: text,
      Timestamp: new Date().toISOString(),
      _temp: true,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await api.post(`/network/messages/${chatPartner.id}`, { text });
      if (res.data.message) {
        const serverMsg: ChatMessage = res.data.message;
        setMessages(prev => prev.map(m => m.ID === tempId ? serverMsg : m));
        lastMsgIdRef.current = serverMsg.ID;
      }
    } catch (err) {
      console.error('[Chat] Gagal mengirim pesan:', err);
      setMessages(prev => prev.filter(m => m.ID !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ─── Filter logic ─── */
  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.nama.toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.bio || '').toLowerCase().includes(q);

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
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-[#1e2130] border-t-[#6c63ff] animate-spin" />
          <span className="text-xs text-[#8890a4]">Memuat jaringan...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0">
      {/* ──────────────── Main Network Area ──────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${chatPartner ? 'lg:pr-[420px]' : ''}`}>
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#22c55e]/20 to-[#3ecfcf]/20 flex items-center justify-center border border-[#22c55e]/20">
                  <Users size={18} color="#22c55e" />
                </div>
                <h1 className="text-xl font-bold text-[#e2e8f0] m-0">Jaringan Teman</h1>
                <span className="text-[11px] bg-[#131722] border border-[#1e2130] text-[#8890a4] px-2.5 py-1 rounded-full font-medium">
                  {users.length} pengguna
                </span>
              </div>
              <p className="text-[13px] text-[#8890a4] m-0">Temukan teman, jalin koneksi, dan bangun dukungan sosial yang positif.</p>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5068]" />
              <input
                type="text"
                placeholder="Cari pengguna..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#0f1117] border border-[#1e2130] rounded-lg text-[13px] text-[#e2e8f0] placeholder:text-[#4a5068] outline-none focus:border-[#6c63ff]/50 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5068] hover:text-[#8890a4]">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 bg-[#131722] rounded-lg p-1 border border-[#1e2130] w-fit overflow-x-auto">
              {filterTabs.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className="relative px-3.5 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors"
                  style={{
                    background: activeFilter === key ? `${color}18` : 'transparent',
                    color: activeFilter === key ? color : '#8890a4',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Grid */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-full bg-[#131722] border border-[#1e2130] flex items-center justify-center">
                <Search size={22} color="#4a5068" />
              </div>
              <span className="text-sm text-[#8890a4]">Tidak ada pengguna ditemukan</span>
              <span className="text-[11px] text-[#4a5068]">Coba ubah filter atau kata kunci pencarian</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredUsers.map((user, idx) => {
                  const badge = getAffinityBadge(user.affinity);
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      whileHover={{ y: -2 }}
                      className="bg-[#151821] border border-[#1e2130] rounded-xl p-5 flex flex-col relative overflow-hidden group"
                    >
                      {/* Affinity badge */}
                      {badge && (
                        <div
                          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize"
                          style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                        >
                          <badge.icon size={11} /> {badge.label}
                        </div>
                      )}

                      {/* Avatar + Info */}
                      <div className="flex items-center gap-3 mb-3">
                        {user.profile_pic ? (
                          <img src={user.profile_pic} alt={user.nama} className="w-12 h-12 rounded-full object-cover border-2 border-[#1e2130]" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#1e2130] flex items-center justify-center border-2 border-[#1e2130]">
                            <User size={20} color="#4a5068" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-[14px] font-semibold text-[#e2e8f0] truncate">{user.nama}</div>
                          <div className="text-[11px] text-[#8890a4] truncate">@{user.username}</div>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-[12px] text-[#8890a4] leading-relaxed line-clamp-2 mb-4 flex-1 min-h-[2.6em]">
                        {user.bio || <span className="text-[#4a5068] italic">Tidak ada bio</span>}
                      </p>

                      {/* Divider */}
                      <div className="border-t border-[#1e2130] pt-3 flex items-center gap-2">
                        {/* Follow button */}
                        <button
                          onClick={() => toggleFollow(user.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all duration-200"
                          style={{
                            background: user.is_followed ? 'transparent' : 'linear-gradient(135deg, #22c55e, #3ecfcf)',
                            color: user.is_followed ? '#8890a4' : '#fff',
                            border: user.is_followed ? '1px solid #1e2130' : 'none',
                          }}
                        >
                          {user.is_followed ? <UserCheck size={14} /> : <UserPlus size={14} />}
                          {user.is_followed ? 'Mengikuti' : 'Ikuti'}
                        </button>

                        {/* Message button */}
                        <button
                          onClick={() => openChat(user)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[12px] font-medium border border-[#1e2130] text-[#8890a4] hover:text-[#a89cff] hover:border-[#6c63ff]/30 hover:bg-[#6c63ff]/5 transition-all duration-200"
                        >
                          <MessageCircle size={14} />
                          <span className="hidden sm:inline">Pesan</span>
                        </button>

                        {/* Affinity selector */}
                        <select
                          value={user.affinity}
                          onChange={e => updateAffinity(user.id, e.target.value)}
                          className="appearance-none bg-[#0f1117] border border-[#1e2130] text-[11px] text-[#8890a4] rounded-lg py-2 px-2 outline-none cursor-pointer hover:border-[#6c63ff]/30 transition-colors"
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
            {/* Mobile overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={closeChat}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-[#0f1117] border-l border-[#1e2130] flex flex-col z-50 shadow-2xl"
              style={{ height: '100vh' }}
            >
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e2130] shrink-0">
                <button onClick={closeChat} className="p-1.5 rounded-lg hover:bg-[#1e2130] text-[#8890a4] hover:text-[#e2e8f0] transition-colors">
                  <ArrowLeft size={18} />
                </button>
                {chatPartner.profile_pic ? (
                  <img src={chatPartner.profile_pic} alt={chatPartner.nama} className="w-9 h-9 rounded-full object-cover border border-[#1e2130]" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#1e2130] flex items-center justify-center border border-[#1e2130]">
                    <User size={16} color="#4a5068" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[#e2e8f0] truncate">{chatPartner.nama}</div>
                  <div className="text-[10px] text-[#4a5068]">@{chatPartner.username}</div>
                </div>
                <button onClick={closeChat} className="ml-auto p-1.5 rounded-lg hover:bg-[#1e2130] text-[#8890a4] hover:text-[#e2e8f0] transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Messages */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {chatLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 rounded-full border-[2px] border-[#1e2130] border-t-[#6c63ff] animate-spin" />
                      <span className="text-[11px] text-[#4a5068]">Memuat pesan...</span>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <div className="w-12 h-12 rounded-full bg-[#151821] border border-[#1e2130] flex items-center justify-center">
                      <MessageCircle size={20} color="#4a5068" />
                    </div>
                    <span className="text-[12px] text-[#8890a4]">Belum ada pesan</span>
                    <span className="text-[10px] text-[#4a5068]">Kirim pesan untuk memulai percakapan</span>
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
                        <div className={`max-w-[75%] ${isMe ? 'order-1' : ''}`}>
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed break-words ${
                              isMe
                                ? 'bg-gradient-to-br from-[#6c63ff] to-[#a855f7] text-white rounded-br-md'
                                : 'bg-[#151821] border border-[#1e2130] text-[#e2e8f0] rounded-bl-md'
                            }`}
                          >
                            {msg.Text}
                          </div>
                          <div className={`text-[10px] text-[#4a5068] mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                            {formatTime(msg.Timestamp)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-[#1e2130] shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Tulis pesan..."
                    rows={1}
                    className="flex-1 resize-none bg-[#151821] border border-[#1e2130] rounded-xl px-3.5 py-2.5 text-[13px] text-[#e2e8f0] placeholder:text-[#4a5068] outline-none focus:border-[#6c63ff]/40 transition-colors max-h-24"
                    style={{ scrollbarWidth: 'thin' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatInput.trim() || sending}
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                    style={{
                      background: chatInput.trim() && !sending ? 'linear-gradient(135deg, #6c63ff, #a855f7)' : '#1e2130',
                      opacity: chatInput.trim() && !sending ? 1 : 0.5,
                      cursor: chatInput.trim() && !sending ? 'pointer' : 'default',
                    }}
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin text-white" />
                    ) : (
                      <Send size={16} color={chatInput.trim() ? '#fff' : '#4a5068'} />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
