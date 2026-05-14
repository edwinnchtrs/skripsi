import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  Camera,
  CheckCircle2,
  Compass,
  Headphones,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  Radio,
  Search,
  Send,
  Shuffle,
  Sparkles,
  TrendingUp,
  Trash2,
  UploadCloud,
  User,
  Users,
  Volume2,
  X,
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
  comments: CommentItem[];
};

type CommentItem = {
  id: number;
  user_id: number;
  username: string;
  nama: string;
  profile_pic: string;
  text: string;
  timestamp: string;
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

type TabKey = 'feed' | 'discover' | 'music';

type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  mood: string;
  bpm?: number;
  color: string;
  notes?: number[];
  description: string;
  source: 'synth' | 'file';
  fileUrl?: string;
  fileName?: string;
  size?: number;
};

const musicTracks: MusicTrack[] = [
  {
    id: 'calm-focus',
    source: 'synth',
    title: 'Calm Focus',
    artist: 'Nexus Ambient',
    mood: 'Fokus',
    bpm: 72,
    color: '#22d3ee',
    notes: [261.63, 329.63, 392.0, 523.25],
    description: 'Nada pelan untuk belajar, menulis, atau menenangkan pikiran.',
  },
  {
    id: 'soft-recovery',
    source: 'synth',
    title: 'Soft Recovery',
    artist: 'Mindful Loop',
    mood: 'Pemulihan',
    bpm: 64,
    color: '#34d399',
    notes: [220.0, 277.18, 329.63, 440.0],
    description: 'Loop lembut untuk jeda setelah aktivitas yang menguras energi.',
  },
  {
    id: 'night-reset',
    source: 'synth',
    title: 'Night Reset',
    artist: 'Quiet Room',
    mood: 'Relaks',
    bpm: 58,
    color: '#a78bfa',
    notes: [196.0, 246.94, 293.66, 392.0],
    description: 'Tekstur tenang untuk menurunkan tempo dan mempersiapkan istirahat.',
  },
  {
    id: 'bright-walk',
    source: 'synth',
    title: 'Bright Walk',
    artist: 'Small Steps',
    mood: 'Semangat',
    bpm: 92,
    color: '#f59e0b',
    notes: [293.66, 369.99, 440.0, 587.33],
    description: 'Pola ringan untuk menemani jalan kaki atau beres-beres kecil.',
  },
];

function timeAgo(timestamp: string) {
  const date = new Date(timestamp);
  const diff = new Date().getTime() - date.getTime();
  if (diff < 60000) return 'Baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} mnt`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} hr`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function avatarInitial(name: string) {
  return (name || '?').charAt(0).toUpperCase();
}

function formatFileSize(bytes = 0) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function UserNetwork() {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [networkUsers, setNetworkUsers] = useState<NetworkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ id: 0, nama: '', username: '', profile_pic: '' });
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  const [search, setSearch] = useState('');

  const [viewerSrc, setViewerSrc] = useState('');
  const [viewerUser, setViewerUser] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [allComments, setAllComments] = useState<CommentItem[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);

  const [customTracks, setCustomTracks] = useState<MusicTrack[]>([]);
  const [activeTrackId, setActiveTrackId] = useState(musicTracks[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [musicError, setMusicError] = useState('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileAudioRef = useRef<HTMLAudioElement | null>(null);
  const uploadedUrlsRef = useRef<string[]>([]);

  const allMusicTracks = useMemo(() => [...customTracks, ...musicTracks], [customTracks]);
  const activeTrack = allMusicTracks.find((track) => track.id === activeTrackId) || allMusicTracks[0];

  useEffect(() => {
    Promise.all([api.get('/user/profile'), api.get('/feed'), api.get('/network/users')])
      .then(([profileRes, feedRes, networkRes]) => {
        setCurrentUser({
          id: profileRes.data.id,
          nama: profileRes.data.nama,
          username: profileRes.data.username,
          profile_pic: profileRes.data.profile_pic || '',
        });
        setFeed(feedRes.data.feed || []);
        setNetworkUsers(networkRes.data.users || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.setTargetAtTime(volume, audioContextRef.current?.currentTime || 0, 0.02);
    }
    if (fileAudioRef.current) {
      fileAudioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopTrack();
      uploadedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase();
    if (!keyword) return networkUsers;
    return networkUsers.filter(
      (user) =>
        user.nama.toLowerCase().includes(keyword) ||
        user.username.toLowerCase().includes(keyword) ||
        (user.bio || '').toLowerCase().includes(keyword),
    );
  }, [networkUsers, search]);

  const stats = useMemo(
    () => ({
      posts: feed.length,
      likes: feed.reduce((total, post) => total + post.like_count, 0),
      comments: feed.reduce((total, post) => total + post.comment_count, 0),
      followed: networkUsers.filter((user) => user.is_followed).length,
    }),
    [feed, networkUsers],
  );

  const refreshFeed = () => {
    api.get('/feed').then((response) => setFeed(response.data.feed || [])).catch(() => {});
  };

  const toggleLike = async (postId: number) => {
    setFeed((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, is_liked: !post.is_liked, like_count: post.like_count + (post.is_liked ? -1 : 1) }
          : post,
      ),
    );

    try {
      await api.post(`/post/${postId}/like`);
    } catch {
      refreshFeed();
    }
  };

  const loadComments = async (postId: number) => {
    if (commentPostId === postId) {
      setCommentPostId(null);
      return;
    }

    setCommentPostId(postId);
    setCommentLoading(true);

    try {
      const response = await api.get(`/post/${postId}/comments`);
      setAllComments(response.data.comments || []);
    } catch {
      setAllComments([]);
    } finally {
      setCommentLoading(false);
    }
  };

  const sendComment = async (postId: number) => {
    const text = commentText.trim();
    if (!text) return;

    setCommentText('');

    try {
      const response = await api.post(`/post/${postId}/comment`, { text });
      setAllComments((prev) => [...prev, response.data.comment]);
      setFeed((prev) => prev.map((post) => (post.id === postId ? { ...post, comment_count: post.comment_count + 1 } : post)));
    } catch {
      setCommentText(text);
    }
  };

  const toggleFollow = async (userId: number) => {
    try {
      const response = await api.post(`/network/follow/${userId}`);
      setNetworkUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, is_followed: response.data.is_followed } : user)),
      );
    } catch {}
  };

  const ensureAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      gainRef.current = audioContextRef.current.createGain();
      gainRef.current.gain.value = volume;
      gainRef.current.connect(audioContextRef.current.destination);
    }

    return audioContextRef.current;
  };

  const playTone = (frequency: number, duration: number) => {
    const context = ensureAudioContext();
    const gain = gainRef.current;
    if (!gain) return;

    const oscillator = context.createOscillator();
    const noteGain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    noteGain.gain.setValueAtTime(0.0001, context.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.08);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(noteGain);
    noteGain.connect(gain);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.04);
  };

  const stopTrack = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (fileAudioRef.current) {
      fileAudioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const startTrack = async (track = activeTrack) => {
    stopTrack();

    if (track.source === 'file') {
      if (!track.fileUrl) return;
      setMusicError('');

      try {
        const audio = fileAudioRef.current || new Audio();
        fileAudioRef.current = audio;
        if (audio.src !== track.fileUrl) {
          audio.src = track.fileUrl;
          audio.currentTime = 0;
        }
        audio.loop = true;
        audio.volume = volume;
        await audio.play();
        setIsPlaying(true);
      } catch {
        setMusicError('File musik belum bisa diputar oleh browser. Coba file MP3, WAV, atau OGG lain.');
      }
      return;
    }

    if (!track.notes?.length || !track.bpm) return;
    const context = ensureAudioContext();
    if (context.state === 'suspended') await context.resume();

    let index = 0;
    const interval = Math.max(360, Math.round(60000 / track.bpm));
    playTone(track.notes[index], interval / 1000);
    timerRef.current = window.setInterval(() => {
      index = (index + 1) % track.notes.length;
      playTone(track.notes[index], interval / 1000);
    }, interval);
    setIsPlaying(true);
  };

  const selectTrack = (track: MusicTrack) => {
    setActiveTrackId(track.id);
    if (isPlaying) {
      startTrack(track);
    }
  };

  const nextTrack = () => {
    const currentIndex = allMusicTracks.findIndex((track) => track.id === activeTrack.id);
    const next = allMusicTracks[(currentIndex + 1) % allMusicTracks.length];
    selectTrack(next);
  };

  const handleMusicUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('audio/'));
    if (!files.length) {
      setMusicError('Pilih file audio seperti MP3, WAV, M4A, atau OGG.');
      event.target.value = '';
      return;
    }

    setMusicError('');
    const newTracks = files.map((file, index) => {
      const url = URL.createObjectURL(file);
      uploadedUrlsRef.current.push(url);
      return {
        id: `local-${Date.now()}-${index}`,
        source: 'file' as const,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'File lokal',
        mood: 'Upload sendiri',
        color: '#22d3ee',
        description: `${file.name} · ${formatFileSize(file.size)}`,
        fileUrl: url,
        fileName: file.name,
        size: file.size,
      };
    });

    setCustomTracks((prev) => [...newTracks, ...prev]);
    setActiveTrackId(newTracks[0].id);
    event.target.value = '';
  };

  const removeCustomTrack = (track: MusicTrack) => {
    if (track.source !== 'file') return;
    if (track.id === activeTrack.id) {
      stopTrack();
      setActiveTrackId(musicTracks[0].id);
    }
    if (track.fileUrl) {
      URL.revokeObjectURL(track.fileUrl);
      uploadedUrlsRef.current = uploadedUrlsRef.current.filter((url) => url !== track.fileUrl);
    }
    setCustomTracks((prev) => prev.filter((item) => item.id !== track.id));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d14] text-slate-100">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-300" />
          <p className="mt-4 text-sm text-slate-400">Memuat jaringan teman...</p>
        </div>
      </div>
    );
  }

  const renderAvatar = (user: { nama: string; profile_pic?: string }, size = 'h-10 w-10') => (
    <div className={`${size} shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 p-[1px]`}>
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[11px] bg-slate-950">
        {user.profile_pic ? (
          <img src={user.profile_pic} alt={user.nama} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-cyan-200">{avatarInitial(user.nama)}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0d14] px-5 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
          <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_420px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(34,197,94,0.16),transparent_24%),radial-gradient(circle_at_70%_88%,rgba(168,85,247,0.12),transparent_24%)]" />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Community network
              </div>
              <h1 className="text-2xl font-semibold tracking-normal text-white md:text-3xl">Jaringan Teman</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Lihat postingan semua user, temukan teman baru, dan putar rekomendasi musik
                ringan untuk menemani aktivitas atau pemulihan.
              </p>
            </div>

            <div className="relative grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Postingan', value: stats.posts, icon: ImageIcon, color: 'text-cyan-300' },
                { label: 'Suka', value: stats.likes, icon: Heart, color: 'text-rose-300' },
                { label: 'Komentar', value: stats.comments, icon: MessageCircle, color: 'text-indigo-300' },
                { label: 'Diikuti', value: stats.followed, icon: Users, color: 'text-emerald-300' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                    <Icon className={`mb-3 h-4 w-4 ${item.color}`} />
                    <div className="text-xl font-semibold text-white">{item.value}</div>
                    <div className="mt-1 text-[11px] leading-4 text-slate-500">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2">
          {[
            { key: 'feed' as const, label: 'Feed semua user', icon: Radio },
            { key: 'discover' as const, label: 'Temukan teman', icon: Compass },
            { key: 'music' as const, label: 'Rekomendasi lagu', icon: Music2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
                  activeTab === tab.key ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
          <button
            onClick={() => setCreatePostOpen(true)}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <Plus className="h-4 w-4" />
            Buat postingan
          </button>
        </nav>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="min-w-0">
            {activeTab === 'feed' && (
              <div className="space-y-4">
                {feed.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-12 text-center">
                    <Camera className="mx-auto h-10 w-10 text-slate-600" />
                    <h2 className="mt-4 text-lg font-semibold tracking-normal text-white">Belum ada postingan</h2>
                    <p className="mt-2 text-sm text-slate-500">Buat postingan pertama untuk memulai feed komunitas.</p>
                    <button
                      onClick={() => setCreatePostOpen(true)}
                      className="mt-5 rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                    >
                      Buat postingan
                    </button>
                  </div>
                ) : (
                  feed.map((post, index) => (
                    <motion.article
                      key={post.id}
                      initial={index < 4 ? { opacity: 0, y: 12 } : false}
                      animate={index < 4 ? { opacity: 1, y: 0 } : false}
                      transition={{ delay: index * 0.05 }}
                      className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/10"
                    >
                      <div className="flex items-center justify-between px-5 py-4">
                        <button
                          onClick={() => navigate(`/user/profile/${post.username}`)}
                          className="flex min-w-0 items-center gap-3 text-left"
                        >
                          {renderAvatar({ nama: post.nama || post.username, profile_pic: post.profile_pic })}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">{post.nama || post.username}</div>
                            <div className="truncate text-xs text-slate-500">@{post.username} · {timeAgo(post.timestamp)}</div>
                          </div>
                        </button>
                        <button className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>

                      {post.image && (
                        <button
                          className="block w-full bg-slate-950"
                          onClick={() => {
                            setViewerSrc(post.image);
                            setViewerUser(post.username);
                            setViewerOpen(true);
                          }}
                        >
                          <img src={post.image} alt="" className="max-h-[620px] w-full object-contain" />
                        </button>
                      )}

                      {post.text && (
                        <div className="px-5 py-4">
                          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">{post.text}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleLike(post.id)}
                            className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                              post.is_liked ? 'bg-rose-500/10 text-rose-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <Heart className="h-4 w-4" fill={post.is_liked ? 'currentColor' : 'none'} />
                            {post.like_count}
                          </button>
                          <button
                            onClick={() => loadComments(post.id)}
                            className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {post.comment_count}
                          </button>
                          <button className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white">
                            <Send className="h-4 w-4" />
                            Bagikan
                          </button>
                        </div>
                        <button className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300">
                          <Bookmark className="h-5 w-5" />
                        </button>
                      </div>

                      <AnimatePresence>
                        {commentPostId === post.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden border-t border-slate-800"
                          >
                            {commentLoading ? (
                              <div className="flex justify-center py-5">
                                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                              </div>
                            ) : (
                              <div className="max-h-[240px] space-y-3 overflow-y-auto px-5 py-4">
                                {allComments.length === 0 ? (
                                  <p className="text-sm text-slate-500">Belum ada komentar.</p>
                                ) : (
                                  allComments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                      {renderAvatar({ nama: comment.nama || comment.username, profile_pic: comment.profile_pic }, 'h-8 w-8')}
                                      <div className="min-w-0 rounded-lg bg-slate-950 px-3 py-2">
                                        <button
                                          onClick={() => navigate(`/user/profile/${comment.username}`)}
                                          className="text-xs font-semibold text-cyan-200"
                                        >
                                          @{comment.username}
                                        </button>
                                        <p className="mt-1 break-words text-sm leading-5 text-slate-300">{comment.text}</p>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-3 border-t border-slate-800 px-5 py-3">
                              <input
                                value={commentText}
                                onChange={(event) => setCommentText(event.target.value)}
                                onKeyDown={(event) => event.key === 'Enter' && sendComment(post.id)}
                                placeholder="Tambah komentar..."
                                className="h-10 min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
                              />
                              <button
                                onClick={() => sendComment(post.id)}
                                disabled={!commentText.trim()}
                                className="h-10 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                              >
                                Kirim
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.article>
                  ))
                )}
              </div>
            )}

            {activeTab === 'discover' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari teman, username, atau bio..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {filteredUsers.map((user) => (
                    <article key={user.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                      <div className="flex items-start gap-4">
                        <button onClick={() => navigate(`/user/profile/${user.username}`)}>
                          {renderAvatar(user, 'h-14 w-14')}
                        </button>
                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => navigate(`/user/profile/${user.username}`)}
                            className="truncate text-base font-semibold text-white hover:text-cyan-200"
                          >
                            {user.nama}
                          </button>
                          <p className="truncate text-xs text-slate-500">@{user.username}</p>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{user.bio || 'Belum menulis bio.'}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => toggleFollow(user.id)}
                          className={`h-10 flex-1 rounded-lg text-sm font-semibold transition ${
                            user.is_followed
                              ? 'border border-slate-700 bg-slate-950 text-slate-300 hover:text-white'
                              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                          }`}
                        >
                          {user.is_followed ? 'Mengikuti' : 'Ikuti'}
                        </button>
                        <button
                          onClick={() => navigate(`/user/profile/${user.username}`)}
                          className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-300 hover:text-white"
                        >
                          Profil
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'music' && (
              <div className="grid gap-4 md:grid-cols-2">
                {allMusicTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => selectTrack(track)}
                    className={`rounded-xl border p-5 text-left transition hover:-translate-y-0.5 ${
                      activeTrack.id === track.id ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-slate-800 bg-slate-900/70'
                    }`}
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${track.color}22` }}>
                        <Music2 className="h-6 w-6" style={{ color: track.color }} />
                      </div>
                      <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-400">
                        {track.source === 'file' ? formatFileSize(track.size) : `${track.bpm} BPM`}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold tracking-normal text-white">{track.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{track.artist} · {track.mood}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{track.description}</p>
                  </button>
                ))}
              </div>
            )}
          </main>

          <aside className="space-y-5">
            <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center gap-3">
                {renderAvatar(currentUser, 'h-12 w-12')}
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-white">{currentUser.nama}</h2>
                  <p className="truncate text-xs text-slate-500">@{currentUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setCreatePostOpen(true)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                <Plus className="h-4 w-4" />
                Buat postingan baru
              </button>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold tracking-normal text-white">Pemutar musik</h2>
                  <p className="text-xs text-slate-500">Synth loop dan file musik sendiri</p>
                </div>
                <Headphones className="h-5 w-5 text-cyan-300" />
              </div>

              <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-left transition hover:bg-cyan-500/15">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-200">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-cyan-100">Upload file musik</p>
                  <p className="truncate text-xs text-slate-500">MP3, WAV, M4A, OGG. Diputar lokal di browser.</p>
                </div>
                <input type="file" accept="audio/*" multiple onChange={handleMusicUpload} className="hidden" />
              </label>

              {musicError && (
                <div className="mb-4 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs leading-5 text-rose-100">
                  {musicError}
                </div>
              )}

              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="mb-4 flex h-20 items-end gap-1">
                  {Array.from({ length: 24 }).map((_, index) => (
                    <span
                      key={index}
                      className={`w-full rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
                      style={{
                        height: `${20 + ((index * 17) % 52)}px`,
                        backgroundColor: activeTrack.color,
                        opacity: 0.25 + ((index % 5) * 0.1),
                        animationDelay: `${index * 50}ms`,
                      }}
                    />
                  ))}
                </div>

                <h3 className="text-lg font-semibold text-white">{activeTrack.title}</h3>
                {activeTrack.source === 'file' && (
                  <p className="mt-1 truncate text-xs text-cyan-200">{activeTrack.fileName}</p>
                )}
                <p className="text-sm text-slate-500">{activeTrack.artist} · {activeTrack.mood}</p>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={() => (isPlaying ? stopTrack() : startTrack())}
                    className="flex h-12 w-12 items-center justify-center rounded-full text-slate-950 transition hover:scale-105"
                    style={{ backgroundColor: activeTrack.color }}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                  </button>
                  <button
                    onClick={nextTrack}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:text-white"
                  >
                    <Shuffle className="h-4 w-4" />
                  </button>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Volume2 className="h-4 w-4 text-slate-500" />
                    <input
                      type="range"
                      min="0"
                      max="0.8"
                      step="0.05"
                      value={volume}
                      onChange={(event) => setVolume(Number(event.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {allMusicTracks.map((track) => (
                  <div
                    key={track.id}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 transition ${
                      activeTrack.id === track.id ? 'border-cyan-400/30 bg-cyan-500/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <button onClick={() => selectTrack(track)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: track.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-200">{track.title}</p>
                        <p className="truncate text-xs text-slate-500">
                          {track.source === 'file' ? `File lokal - ${formatFileSize(track.size)}` : track.mood}
                        </p>
                      </div>
                      {activeTrack.id === track.id && <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-300" />}
                    </button>
                    {track.source === 'file' && (
                      <button
                        onClick={() => removeCustomTrack(track)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                        title="Hapus file musik"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-normal text-white">Disarankan</h2>
                <button onClick={() => setActiveTab('discover')} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                  Lihat semua
                </button>
              </div>
              <div className="space-y-3">
                {networkUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <button onClick={() => navigate(`/user/profile/${user.username}`)}>{renderAvatar(user, 'h-9 w-9')}</button>
                    <div className="min-w-0 flex-1">
                      <button onClick={() => navigate(`/user/profile/${user.username}`)} className="block truncate text-sm font-semibold text-white hover:text-cyan-200">
                        {user.username}
                      </button>
                      <p className="truncate text-xs text-slate-500">{user.nama}</p>
                    </div>
                    <button onClick={() => toggleFollow(user.id)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                      {user.is_followed ? 'Mengikuti' : 'Ikuti'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>

      <PhotoViewerModal src={viewerSrc} username={viewerUser} open={viewerOpen} onClose={() => setViewerOpen(false)} />
      <CreatePostModal open={createPostOpen} onClose={() => setCreatePostOpen(false)} onCreated={refreshFeed} currentUser={currentUser} />
    </div>
  );
}
