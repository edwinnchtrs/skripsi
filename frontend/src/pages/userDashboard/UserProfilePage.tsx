import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, UserPlus, UserCheck, MessageCircle, Share2, MapPin, Calendar,
  Heart, HeartHandshake, Smile, Sparkles, ArrowLeft, Grid3X3,
  Activity, Info, MoreHorizontal, Users, ChevronRight, Clock,
  TrendingUp, Shield, Zap, CheckCircle2, AlertTriangle, Loader2,
  Send, ExternalLink, Brain, Target, Flame, Plus, Camera, Image,
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
  is_followed: boolean;
  affinity: string;
  mutual_friends: { id: number; nama: string; username: string; profile_pic: string }[];
  post_count: number;
  assessment_count: number;
  posts: { ID: number; Text: string; Image: string; Timestamp: string; Reactions: number }[];
  activity: { type: string; timestamp: string; detail: string; score: number }[];
};

const tabs = [
  { key: 'posts', label: 'Posts', icon: Grid3X3 },
  { key: 'activity', label: 'Aktivitas', icon: Activity },
  { key: 'about', label: 'Tentang', icon: Info },
];

const affinityIcons: Record<string, { icon: any; color: string; label: string }> = {
  teman: { icon: Smile, color: '#3ecfcf', label: 'Teman' },
  pacar: { icon: Heart, color: '#ef4444', label: 'Pacar' },
  saudara: { icon: HeartHandshake, color: '#f59e0b', label: 'Saudara' },
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

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [followLoading, setFollowLoading] = useState(false);
  const [viewerSrc, setViewerSrc] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ nama: '', profile_pic: '' });
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    api.get(`/network/user/${username}`)
      .then(res => setProfile(res.data))
      .catch(() => navigate('/user/network'))
      .finally(() => setLoading(false));

    api.get('/user/profile').then(r => {
      setCurrentUser({ nama: r.data.nama, profile_pic: r.data.profile_pic || '' });
      setIsOwnProfile(r.data.username === username);
    }).catch(() => {});
  }, [username, navigate]);

  const toggleFollow = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    setProfile(prev => prev ? { ...prev, is_followed: !prev.is_followed, follower_count: prev.follower_count + (prev.is_followed ? -1 : 1) } : prev);
    try {
      const res = await api.post(`/network/follow/${profile.id}`);
      setProfile(prev => prev ? { ...prev, is_followed: res.data.is_followed } : prev);
    } catch {
      setProfile(prev => prev ? { ...prev, is_followed: !prev.is_followed, follower_count: prev.follower_count + (prev.is_followed ? -1 : 1) } : prev);
    } finally {
      setFollowLoading(false);
    }
  };

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

  const aff = profile.affinity ? affinityIcons[profile.affinity] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#060816] text-[#e2e8f0] font-sans"
    >
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
        <button onClick={() => navigate('/user/network')} className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/40 transition-all text-xs font-medium">
          <ArrowLeft size={15} /> Kembali
        </button>
      </div>

      {/* Profile Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10">
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
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-4 border-[#060816] flex items-center justify-center shadow-xl" style={{ boxShadow: '0 0 30px rgba(6,182,212,0.2), 0 4px 20px rgba(0,0,0,0.4)' }}>
                <User size={40} color="#475569" />
              </div>
            )}
            <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-[#22c55e] border-[3px] border-[#060816] shadow-lg" />
          </div>

          {/* Info + Actions */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="pt-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white m-0">{profile.nama}</h1>
                {aff && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border" style={{ background: `${aff.color}15`, color: aff.color, borderColor: `${aff.color}30` }}>
                    <aff.icon size={12} /> {aff.label}
                  </span>
                )}
                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-[#6c63ff]/10 border border-[#6c63ff]/20 text-[#a89cff]">
                  <Sparkles size={11} /> Nexus AI
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
            <div className="flex items-center gap-2 shrink-0">
              {isOwnProfile ? (
                <>
                  <button onClick={() => navigate('/user/settings')} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold border border-[#1e293b] text-[#e2e8f0] hover:border-[#334155] hover:bg-[#1e293b]/50 transition-all duration-200">
                    Edit Profil
                  </button>
                  <button onClick={() => setCreatePostOpen(true)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-200" style={{ background: 'linear-gradient(135deg, #059669, #06b6d4)', boxShadow: '0 4px 15px rgba(6,182,212,0.3)' }}>
                    <Plus size={15} /> Buat
                  </button>
                </>
              ) : (
                <>
                  <button onClick={toggleFollow} disabled={followLoading} className="relative flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 overflow-hidden" style={{ background: profile.is_followed ? 'transparent' : 'linear-gradient(135deg, #059669, #06b6d4)', border: profile.is_followed ? '1px solid #1e293b' : 'none', color: profile.is_followed ? '#8890a4' : '#fff' }}>
                    {followLoading ? <Loader2 size={15} className="animate-spin" /> : profile.is_followed ? <UserCheck size={15} /> : <UserPlus size={15} />}
                    {profile.is_followed ? 'Mengikuti' : 'Ikuti'}
                  </button>
                  <button onClick={() => { api.get(`/network/messages/${profile.id}`).then(() => {}); navigate('/user/network', { state: { openChat: profile.id } }); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium border border-[#1e293b] text-[#c0c9e0] hover:border-[#6c63ff]/30 hover:text-[#a89cff] hover:bg-[#6c63ff]/5 transition-all duration-200">
                    <MessageCircle size={15} /> Pesan
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium border border-[#1e293b] text-[#8890a4] hover:border-[#334155] hover:text-[#c0c9e0] transition-all duration-200">
                    <Share2 size={15} />
                  </button>
                </>
              )}
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

        {/* Mutual Friends */}
        {profile.mutual_friends && profile.mutual_friends.length > 0 && (
          <div className="mt-5 bg-[#0f172a]/60 backdrop-blur-sm border border-[#1e293b] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex -space-x-2">
              {profile.mutual_friends.slice(0, 4).map(f => (
                f.profile_pic ? (
                  <img key={f.id} src={f.profile_pic} alt={f.nama} className="w-7 h-7 rounded-full border-2 border-[#0f172a] object-cover" />
                ) : (
                  <div key={f.id} className="w-7 h-7 rounded-full bg-[#1e293b] border-2 border-[#0f172a] flex items-center justify-center">
                    <User size={11} color="#475569" />
                  </div>
                )
              ))}
            </div>
            <p className="flex-1 text-[12px] text-[#c0c9e0] m-0">
              <span>Diikuti oleh </span>
              <span className="font-semibold text-white">{profile.mutual_friends[0]?.nama}</span>
              {profile.mutual_friends.length > 1 && (
                <span><span> dan </span><span className="font-semibold text-white">{profile.mutual_friends.length - 1} lainnya</span></span>
              )}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 border-b border-[#1e293b] flex gap-0 overflow-x-auto scrollbar-thin">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className="relative flex items-center gap-2 px-5 py-3 text-[13px] font-medium transition-colors whitespace-nowrap" style={{ color: activeTab === t.key ? '#e2e8f0' : '#64748b' }}>
              <t.icon size={15} /> {t.label}
              {activeTab === t.key && (
                <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #059669, #06b6d4)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
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
                    <span className="text-[11px] text-[#475569]">Pengguna ini belum membuat postingan publik</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {profile.posts.map((post, idx) => (
                      <motion.div
                        key={post.ID}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02, y: -2 }}
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
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#06b6d4]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
                        {idx < profile.activity.length - 1 && (
                          <div className="absolute left-[15px] top-9 bottom-0 w-px bg-[#1e293b]" />
                        )}
                        <div className="absolute left-[9px] top-1 w-3.5 h-3.5 rounded-full border-2 border-[#1e293b] bg-[#0f172a]" style={{ borderColor: item.type === 'prediction' ? '#22c55e' : '#1e293b' }} />
                        <div className="bg-[#0f172a]/60 backdrop-blur-sm border border-[#1e293b] rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded-md bg-[#22c55e]/10 flex items-center justify-center">
                              <Brain size={11} color="#22c55e" />
                            </div>
                            <span className="text-[11px] font-semibold text-[#4ade80]">Prediksi Risiko</span>
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

            {/* About Tab */}
            {activeTab === 'about' && (
              <motion.div key="about" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="max-w-2xl space-y-3">
                <div className="bg-[#0f172a]/60 backdrop-blur-sm border border-[#1e293b] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-[#06b6d4]/10 flex items-center justify-center"><Info size={13} color="#06b6d4" /></div>
                    <span className="text-[13px] font-semibold text-[#e2e8f0]">Bio</span>
                  </div>
                  <p className="text-[13px] text-[#8890a4] leading-relaxed m-0">
                    {profile.bio || <span className="italic text-[#475569]">Belum menulis bio</span>}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Users, label: 'Pengikut', value: profile.follower_count, color: '#3ecfcf' },
                    { icon: UserCheck, label: 'Mengikuti', value: profile.following_count, color: '#22c55e' },
                    { icon: Grid3X3, label: 'Postingan', value: profile.post_count, color: '#a855f7' },
                    { icon: Activity, label: 'Asesmen', value: profile.assessment_count, color: '#f59e0b' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#0f172a]/60 backdrop-blur-sm border border-[#1e293b] rounded-xl p-4 text-center">
                      <div className="flex justify-center mb-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                          <s.icon size={14} color={s.color} />
                        </div>
                      </div>
                      <div className="text-lg font-bold text-white">{s.value}</div>
                      <div className="text-[10px] text-[#475569] uppercase tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#0f172a]/60 backdrop-blur-sm border border-[#1e293b] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-[#6c63ff]/10 flex items-center justify-center"><Shield size={13} color="#6c63ff" /></div>
                    <span className="text-[13px] font-semibold text-[#e2e8f0]">Akun</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[12px]"><span className="text-[#64748b]">Username</span><span className="text-[#c0c9e0] font-medium">@{profile.username}</span></div>
                    <div className="flex justify-between text-[12px]"><span className="text-[#64748b]">Bergabung</span><span className="text-[#c0c9e0] font-medium">{formatDate(profile.joined_at)}</span></div>
                    <div className="flex justify-between text-[12px]"><span className="text-[#64748b]">Status Relasi</span><span className="text-[#c0c9e0] font-medium capitalize">{profile.affinity || '-'}</span></div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <PhotoViewerModal src={viewerSrc} alt="Profile photo" username={profile.username} open={viewerOpen} onClose={() => setViewerOpen(false)} />
      <CreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onCreated={() => { if (username) api.get(`/network/user/${username}`).then(res => setProfile(res.data)).catch(() => {}); }}
        currentUser={currentUser}
      />
    </motion.div>
  );
}
