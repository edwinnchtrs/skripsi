import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  Clapperboard,
  Clock,
  ExternalLink,
  Film,
  HeartPulse,
  History,
  Link as LinkIcon,
  Loader2,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Wand2,
} from 'lucide-react';
import api from '../../api';

type FilmItem = {
  id: string;
  db_id?: number;
  title: string;
  studio: string;
  duration: string;
  mood: string;
  description: string;
  embedUrl: string;
  sourceUrl: string;
  accent: string;
  tag: string;
  category: 'original' | 'relaksasi' | 'open' | 'saved';
  saved?: boolean;
  addedAt?: string;
  status?: 'watchlist' | 'watching' | 'completed' | 'paused' | 'favorite';
  progressSeconds?: number;
  rating?: number;
  notes?: string;
  lastWatchedAt?: string;
};

type AiSuggestion = {
  title: string;
  reply: string;
  keyPoints: string[];
  nextSteps: string[];
  source: string;
};

type VideoMetadata = {
  title?: string;
  author_name?: string;
  provider_name?: string;
};

type DiscoveryItem = {
  title: string;
  snippet: string;
  url?: string;
  source: string;
};

const legalCatalog: FilmItem[] = [
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    studio: 'Blender Open Movie',
    duration: '10 menit',
    mood: 'Ringan',
    description: 'Film pendek animasi open movie, cocok untuk jeda singkat dan mood yang lebih ringan.',
    embedUrl: 'https://www.youtube.com/embed/YE7VzlLtp-4',
    sourceUrl: 'https://www.youtube.com/watch?v=YE7VzlLtp-4',
    accent: '#ef4444',
    tag: 'Open movie',
    category: 'open',
  },
  {
    id: 'sintel',
    title: 'Sintel',
    studio: 'Blender Open Movie',
    duration: '15 menit',
    mood: 'Petualangan',
    description: 'Animasi fantasi pendek tentang kehilangan, perjalanan, dan penerimaan.',
    embedUrl: 'https://www.youtube.com/embed/eRsGyueVLvQ',
    sourceUrl: 'https://www.youtube.com/watch?v=eRsGyueVLvQ',
    accent: '#a855f7',
    tag: 'Fantasy short',
    category: 'original',
  },
  {
    id: 'tears-of-steel',
    title: 'Tears of Steel',
    studio: 'Blender Open Movie',
    duration: '12 menit',
    mood: 'Sci-fi',
    description: 'Film pendek sci-fi open movie dengan suasana futuristik dan aksi ringan.',
    embedUrl: 'https://www.youtube.com/embed/R6MlUcmOul8',
    sourceUrl: 'https://www.youtube.com/watch?v=R6MlUcmOul8',
    accent: '#22c55e',
    tag: 'Sci-fi short',
    category: 'original',
  },
  {
    id: 'elephants-dream',
    title: 'Elephants Dream',
    studio: 'Blender Open Movie',
    duration: '11 menit',
    mood: 'Eksperimental',
    description: 'Open movie bergaya sureal untuk pengguna yang ingin tontonan pendek dan berbeda.',
    embedUrl: 'https://www.youtube.com/embed/TLkA0RELQ1g',
    sourceUrl: 'https://www.youtube.com/watch?v=TLkA0RELQ1g',
    accent: '#f97316',
    tag: 'Classic open',
    category: 'open',
  },
  {
    id: 'nature-reset',
    title: 'Nature Reset',
    studio: 'Public YouTube embed',
    duration: 'Ambient',
    mood: 'Relaksasi',
    description: 'Video suasana alam untuk menemani jeda, journaling, atau pemulihan ringan.',
    embedUrl: 'https://www.youtube.com/embed/1ZYbU82GVz4',
    sourceUrl: 'https://www.youtube.com/watch?v=1ZYbU82GVz4',
    accent: '#14b8a6',
    tag: 'Relaxation',
    category: 'relaksasi',
  },
  {
    id: 'calm-focus',
    title: 'Calm Focus',
    studio: 'Public YouTube embed',
    duration: '1 jam',
    mood: 'Fokus',
    description: 'Ambient lembut untuk belajar, kerja tenang, atau rehat setelah asesmen.',
    embedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    sourceUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    accent: '#38bdf8',
    tag: 'Focus room',
    category: 'relaksasi',
  },
];

const savedStorageKey = 'nexusmind_user_cinema_saved';
const historyStorageKey = 'nexusmind_user_cinema_history';
const activeStorageKey = 'nexusmind_user_cinema_active';

function normalizeEmbedUrl(value: string) {
  const raw = value.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = url.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (url.pathname.startsWith('/embed/')) return `https://www.youtube.com${url.pathname}`;
    }

    if (host === 'youtu.be') {
      const id = url.pathname.replace('/', '');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    if (host === 'vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }

    if (host === 'player.vimeo.com' && url.pathname.startsWith('/video/')) {
      return `https://player.vimeo.com${url.pathname}`;
    }
  } catch {
    return null;
  }

  return null;
}

function loadArray<T>(key: string, fallback: T[]): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function normalizeSavedFilm(raw: any): FilmItem | null {
  if (!raw?.embedUrl || !raw?.sourceUrl) return null;
  return {
    id: raw.id || (raw.db_id ? `saved-db-${raw.db_id}` : `saved-${Date.now()}`),
    db_id: raw.db_id,
    title: raw.title || 'Film tersimpan',
    studio: raw.studio || 'Link legal pribadi',
    duration: raw.duration || 'Custom',
    mood: raw.mood || 'Pilihan sendiri',
    description: raw.description || 'Video resmi yang kamu simpan ke library.',
    embedUrl: raw.embedUrl,
    sourceUrl: raw.sourceUrl,
    accent: raw.accent || '#ef4444',
    tag: raw.tag || 'Tersimpan',
    category: 'saved',
    saved: true,
    addedAt: raw.addedAt,
    status: raw.status || 'watchlist',
    progressSeconds: raw.progressSeconds || 0,
    rating: raw.rating || 0,
    notes: raw.notes || '',
    lastWatchedAt: raw.lastWatchedAt,
  };
}

function mergeSavedFilms(primary: FilmItem[], fallback: FilmItem[]) {
  const map = new Map<string, FilmItem>();
  [...fallback, ...primary].forEach((film) => {
    map.set(film.sourceUrl || film.embedUrl || film.id, film);
  });
  return Array.from(map.values());
}

function filmToPayload(film: FilmItem) {
  return {
    title: film.title,
    studio: film.studio,
    duration: film.duration,
    mood: film.mood,
    description: film.description,
    embedUrl: film.embedUrl,
    sourceUrl: film.sourceUrl,
    accent: film.accent,
    tag: film.tag,
    category: film.category,
    status: film.status,
    progressSeconds: film.progressSeconds,
    rating: film.rating,
    notes: film.notes,
  };
}

function inferTitleFromUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const videoId = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
    return videoId ? `Film ${videoId.slice(0, 8)}` : 'Film tersimpan';
  } catch {
    return 'Film tersimpan';
  }
}

async function fetchVideoMetadata(sourceUrl: string): Promise<VideoMetadata | null> {
  const endpoints = [
    `https://noembed.com/embed?url=${encodeURIComponent(sourceUrl)}`,
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(sourceUrl)}`,
    `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(sourceUrl)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(4500) });
      if (!response.ok) continue;
      const data = await response.json();
      if (data?.title || data?.author_name || data?.provider_name) return data;
    } catch {
      // Metadata is best-effort. The link still gets saved with local fallback text.
    }
  }
  return null;
}

function railTitle(category: FilmItem['category']) {
  if (category === 'saved') return 'Library saya';
  if (category === 'relaksasi') return 'Tenang dan fokus';
  if (category === 'open') return 'Open movie pilihan';
  return 'Pilihan utama';
}

function FilmRail({
  title,
  films,
  activeId,
  onPlay,
  onRemove,
}: {
  title: string;
  films: FilmItem[];
  activeId: string;
  onPlay: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (films.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-normal text-slate-100">{title}</h2>
        <span className="text-xs font-medium text-slate-500">{films.length} item</span>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 xl:mx-0 xl:px-0">
        {films.map((film) => (
          <article
            key={film.id}
            className={`group w-[230px] shrink-0 overflow-hidden rounded-xl border bg-[#12141b] transition duration-200 hover:-translate-y-0.5 hover:border-red-400/45 ${
              activeId === film.id ? 'border-red-400/70 shadow-lg shadow-red-950/30' : 'border-slate-800'
            }`}
          >
            <button onClick={() => onPlay(film.id)} className="block w-full text-left">
              <div
                className="relative aspect-[16/9] overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 25% 20%, ${film.accent}55, transparent 36%), linear-gradient(135deg, #222631, #0c0d12 72%)`,
                }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(10,11,16,0.82))]" />
                <div className="absolute left-3 top-3 rounded-md bg-slate-950/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-200">
                  {film.tag}
                </div>
                <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-slate-50 shadow-lg shadow-red-950/40">
                  <Play className="h-4 w-4 fill-current" />
                </div>
              </div>
              <div className="min-h-[132px] p-3">
                <div className="mb-2 flex items-center gap-2 text-[11px] text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {film.duration}
                </div>
                <h3 className="line-clamp-1 text-sm font-semibold text-slate-50">{film.title}</h3>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">{film.studio}</p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{film.description}</p>
              </div>
            </button>
            {film.saved && (
              <button
                onClick={() => onRemove(film.id)}
                className="mx-3 mb-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-300/20 px-2.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function UserCinema() {
  const [savedFilms, setSavedFilms] = useState<FilmItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [activeId, setActiveId] = useState(legalCatalog[0].id);
  const [search, setSearch] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customError, setCustomError] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySource, setLibrarySource] = useState<'database' | 'local'>('local');
  const [aiMood, setAiMood] = useState('butuh tontonan ringan');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [discoveryItems, setDiscoveryItems] = useState<DiscoveryItem[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion>({
    title: 'Rekomendasi cepat',
    reply: 'Pilih mood kamu, lalu minta AI menyusun tontonan legal dari library yang tersedia.',
    keyPoints: ['Gunakan film pendek saat ingin istirahat cepat.', 'Gunakan video fokus saat ingin belajar atau kerja.'],
    nextSteps: ['Tambahkan link resmi YouTube atau Vimeo.', 'Putar satu tontonan, lalu simpan riwayat secara otomatis.'],
    source: 'local',
  });

  useEffect(() => {
    const saved = loadArray<FilmItem>(savedStorageKey, []);
    const history = loadArray<string>(historyStorageKey, []);
    const active = localStorage.getItem(activeStorageKey);
    setSavedFilms(saved);
    setWatchHistory(history);
    if (active) setActiveId(active);
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    let cancelled = false;

    const syncLibrary = async () => {
      setLibraryLoading(true);
      try {
        const response = await api.get('/user/films');
        if (cancelled) return;
        const dbFilms = (response.data.films || [])
          .map((item: any) => normalizeSavedFilm(item))
          .filter(Boolean) as FilmItem[];
        const localOnlyFilms = loadArray<FilmItem>(savedStorageKey, []).filter((film) => film.saved && !film.db_id);
        const migratedFilms = await Promise.all(
          localOnlyFilms.map(async (film) => {
            try {
              const saveResponse = await api.post('/user/films', filmToPayload(film));
              return normalizeSavedFilm(saveResponse.data.film) || film;
            } catch {
              return film;
            }
          }),
        );
        if (cancelled) return;
        setSavedFilms((localFilms) => mergeSavedFilms([...dbFilms, ...migratedFilms], localFilms));
        setLibrarySource('database');
      } catch {
        if (!cancelled) setLibrarySource('local');
      } finally {
        if (!cancelled) setLibraryLoading(false);
      }
    };

    syncLibrary();
    return () => {
      cancelled = true;
    };
  }, [storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(savedStorageKey, JSON.stringify(savedFilms));
  }, [savedFilms, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(historyStorageKey, JSON.stringify(watchHistory));
  }, [watchHistory, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(activeStorageKey, activeId);
  }, [activeId, storageReady]);

  const films = useMemo(() => [...savedFilms, ...legalCatalog], [savedFilms]);
  const activeFilm = films.find((film) => film.id === activeId) ?? films[0];
  const recentFilms = watchHistory
    .map((id) => films.find((film) => film.id === id))
    .filter((film): film is FilmItem => Boolean(film));

  const groupedFilms = useMemo(() => {
    const categories: FilmItem['category'][] = ['saved', 'original', 'open', 'relaksasi'];
    return categories.map((category) => ({
      category,
      title: railTitle(category),
      films: films.filter((film) => film.category === category),
    }));
  }, [films]);

  const filteredFilms = films.filter((film) => {
    const keyword = search.toLowerCase();
    if (!keyword) return true;
    return [film.title, film.studio, film.mood, film.tag, film.description].some((item) =>
      item.toLowerCase().includes(keyword),
    );
  });
  const activeSavedFilm = activeFilm.saved ? savedFilms.find((film) => film.id === activeFilm.id) : null;

  const playFilm = (id: string) => {
    setActiveId(id);
    setWatchHistory((items) => [id, ...items.filter((item) => item !== id)].slice(0, 8));
    const film = films.find((item) => item.id === id);
    if (film?.db_id) {
      api.post(`/user/films/${film.db_id}/watch`, {
        event: 'play',
        progressSeconds: film.progressSeconds || 0,
      }).catch(() => {});
    }
  };

  const addCustomFilm = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const embedUrl = normalizeEmbedUrl(customUrl);
    if (!embedUrl) {
      setCustomError('Gunakan link resmi YouTube atau Vimeo yang bisa di-embed.');
      return;
    }

    const duplicate = savedFilms.find((film) => film.sourceUrl === customUrl.trim() || film.embedUrl === embedUrl);
    if (duplicate) {
      playFilm(duplicate.id);
      setCustomError('Link ini sudah tersimpan. Aku buka dari library kamu.');
      return;
    }

    setMetadataLoading(true);
    setSaveNotice('');
    const metadata = await fetchVideoMetadata(customUrl.trim());
    const title = customTitle.trim() || metadata?.title || inferTitleFromUrl(customUrl);
    const studio = metadata?.author_name || metadata?.provider_name || 'Link legal pribadi';
    const nextFilm: FilmItem = {
      id: `saved-${Date.now()}`,
      title,
      studio,
      duration: 'Custom',
      mood: 'Pilihan sendiri',
      description: `Video resmi dari ${studio}. Link otomatis tersimpan di library perangkat ini dan tetap ada saat kamu pindah menu.`,
      embedUrl,
      sourceUrl: customUrl.trim(),
      accent: '#ef4444',
      tag: 'Tersimpan',
      category: 'saved',
      saved: true,
      addedAt: new Date().toISOString(),
      status: 'watchlist',
      progressSeconds: 0,
      rating: 0,
      notes: '',
    };

    let persistedFilm = nextFilm;
    try {
      const response = await api.post('/user/films', {
        ...filmToPayload(nextFilm),
      });
      persistedFilm = normalizeSavedFilm(response.data.film) || nextFilm;
      setLibrarySource('database');
    } catch {
      setLibrarySource('local');
    }

    setSavedFilms((items) => {
      const nextItems = mergeSavedFilms([persistedFilm], items);
      localStorage.setItem(savedStorageKey, JSON.stringify(nextItems));
      return nextItems;
    });
    playFilm(persistedFilm.id);
    setCustomTitle('');
    setCustomUrl('');
    setCustomError('');
    setSaveNotice(
      persistedFilm.db_id
        ? 'Tersimpan ke akun dan perangkat. Film ini tetap ada saat pindah menu atau login lagi.'
        : 'Backend belum tersambung, film tersimpan lokal di perangkat ini.',
    );
    setMetadataLoading(false);
  };

  const removeSavedFilm = (id: string) => {
    const film = savedFilms.find((item) => item.id === id);
    if (film?.db_id) {
      api.delete(`/user/films/${film.db_id}`).catch(() => {});
    }
    setSavedFilms((items) => {
      const nextItems = items.filter((film) => film.id !== id);
      localStorage.setItem(savedStorageKey, JSON.stringify(nextItems));
      return nextItems;
    });
    setWatchHistory((items) => {
      const nextItems = items.filter((item) => item !== id);
      localStorage.setItem(historyStorageKey, JSON.stringify(nextItems));
      return nextItems;
    });
    if (activeId === id) playFilm(legalCatalog[0].id);
  };

  const updateSavedFilm = (id: string, patch: Partial<FilmItem>) => {
    const film = savedFilms.find((item) => item.id === id);
    setSavedFilms((items) => {
      const nextItems = items.map((item) => (item.id === id ? { ...item, ...patch } : item));
      localStorage.setItem(savedStorageKey, JSON.stringify(nextItems));
      return nextItems;
    });
    if (film?.db_id) {
      api.patch(`/user/films/${film.db_id}`, {
        status: patch.status,
        progressSeconds: patch.progressSeconds,
        rating: patch.rating,
        notes: patch.notes,
        mood: patch.mood,
      }).catch(() => {});
    }
  };

  const askAiRecommendation = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError('');

    const library = films.slice(0, 10).map((film) => `${film.title} (${film.mood})`).join(', ');

    try {
      let webItems: DiscoveryItem[] = [];
      let discoverySource = 'local';

      try {
        const discoveryResponse = await api.get('/cinema/discovery', {
          params: { mood: aiMood, q: activeFilm.title },
        });
        webItems = discoveryResponse.data.items || [];
        discoverySource = discoveryResponse.data.source || 'web-public';
        setDiscoveryItems(webItems);
      } catch {
        webItems = [];
        discoverySource = 'local';
        setDiscoveryItems([]);
      }

      const publicContext = webItems
        .slice(0, 5)
        .map((item) => `${item.title}: ${item.snippet}`)
        .join(' | ')
        .slice(0, 650);

      const response = await api.post('/assistant/chat', {
        message: `Rekomendasikan tontonan legal dari data sistem dan internet. Mood user: ${aiMood}. Film aktif: ${activeFilm.title}. Library lokal user: ${library.slice(0, 310)}. Data internet publik yang ditemukan: ${publicContext || 'Tidak ada hasil internet, gunakan pengetahuan umum legal dan konteks sistem.'}. Jangan hanya mengulang library lokal. Beri rekomendasi yang cocok, alasan, urutan nonton, sumber pertimbangan, dan batas sehat.`,
        current_path: '/user/film',
        history: [],
      });

      setAiSuggestion({
        title: response.data.title || 'Rekomendasi AI',
        reply: response.data.reply || 'AI sudah membuat rekomendasi tontonan.',
        keyPoints: response.data.key_points || [],
        nextSteps: response.data.next_steps || [],
        source: `${response.data.source || 'assistant'} + ${discoverySource}`,
      });
      api.post('/user/film-recommendations', {
        mood: aiMood,
        query: activeFilm.title,
        source: `${response.data.source || 'assistant'} + ${discoverySource}`,
        reply: response.data.reply || '',
        items: webItems,
      }).catch(() => {});
    } catch (error: any) {
      setAiError(error.response?.data?.error || 'AI belum bisa dihubungi. Rekomendasi lokal tetap tersedia.');
      setAiSuggestion({
        title: 'Rekomendasi lokal',
        reply:
          aiMood.includes('fokus') || aiMood.includes('belajar')
            ? 'Mulai dari Calm Focus, lalu lanjut Nature Reset untuk jeda singkat.'
            : 'Mulai dari Big Buck Bunny untuk tontonan ringan, lalu pilih Sintel jika ingin cerita yang lebih emosional.',
        keyPoints: ['Dipilih dari katalog legal yang tersedia.', 'Tidak memakai sumber film tidak resmi.'],
        nextSteps: ['Tambahkan link resmi milikmu untuk memperluas library.', 'Gunakan riwayat untuk melanjutkan tontonan terakhir.'],
        source: 'fallback',
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d0f14] text-slate-100">
      <section className="relative min-h-[620px] overflow-hidden border-b border-slate-800">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 18% 20%, ${activeFilm.accent}55, transparent 28%), linear-gradient(90deg, #0d0f14 0%, rgba(13,15,20,0.92) 34%, rgba(13,15,20,0.58) 62%, #0d0f14 100%), linear-gradient(135deg, #222631, #111318 76%)`,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0d0f14] to-transparent" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:px-8">
          <div className="flex min-h-[560px] flex-col justify-end pb-3">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-500/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-red-100">
                <Clapperboard className="h-3.5 w-3.5" />
                Ruang Film
              </div>
              <h1 className="max-w-2xl text-4xl font-black tracking-normal text-slate-50 sm:text-5xl">
                {activeFilm.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  Sumber legal
                </span>
                <span>{activeFilm.duration}</span>
                <span>{activeFilm.mood}</span>
                <span className="rounded bg-slate-100/10 px-2 py-1 text-xs font-bold">{activeFilm.tag}</span>
              </div>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{activeFilm.description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => playFilm(activeFilm.id)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-500 px-5 text-sm font-black text-slate-50 shadow-lg shadow-red-950/30 transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-200/50"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Putar sekarang
                </button>
                <a
                  href={activeFilm.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-600 bg-slate-950/60 px-5 text-sm font-bold text-slate-100 transition hover:border-slate-400 hover:bg-slate-900"
                >
                  Buka sumber
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <aside className="space-y-4 self-end">
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl shadow-slate-950/60">
              <div className="aspect-video bg-slate-950">
                <iframe
                  key={activeFilm.id}
                  src={activeFilm.embedUrl}
                  title={activeFilm.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                />
              </div>
              <div className="border-t border-slate-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sekarang diputar</p>
                <h2 className="mt-2 text-lg font-bold text-slate-50">{activeFilm.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{activeFilm.studio}</p>
              </div>
            </div>

            <form onSubmit={addCustomFilm} className="rounded-2xl border border-slate-800 bg-[#11141c] p-4 shadow-xl shadow-slate-950/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-50">Tambah film resmi</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {libraryLoading
                      ? 'Menyinkronkan library akun...'
                      : librarySource === 'database'
                        ? 'Link valid tersimpan ke akun dan perangkat.'
                        : 'Link valid tersimpan lokal saat backend tidak tersedia.'}
                  </p>
                </div>
                <Bookmark className="h-5 w-5 text-red-300" />
              </div>
              <div className="mt-4 space-y-3">
                <input
                  value={customTitle}
                  onChange={(event) => setCustomTitle(event.target.value)}
                  placeholder="Judul film atau video"
                  className="h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-red-300/60"
                />
                <div className="flex h-11 items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-3 transition focus-within:border-red-300/60">
                  <LinkIcon className="h-4 w-4 text-slate-500" />
                  <input
                    value={customUrl}
                    onChange={(event) => {
                      setCustomUrl(event.target.value);
                      setCustomError('');
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
                  />
                </div>
                {customError && (
                  <div className="rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100">
                    {customError}
                  </div>
                )}
                {saveNotice && (
                  <div className="rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs leading-5 text-emerald-100">
                    {saveNotice}
                  </div>
                )}
                <button
                  disabled={metadataLoading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-red-500 text-sm font-black text-slate-50 transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-200/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {metadataLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {metadataLoading ? 'Membaca metadata...' : 'Tambah dan simpan otomatis'}
                </button>
                <p className="text-[11px] leading-5 text-slate-600">
                  Tersimpan: {savedFilms.length} link pribadi di perangkat ini.
                </p>
              </div>
            </form>

            {activeSavedFilm && (
              <section className="rounded-2xl border border-slate-800 bg-[#11141c] p-4 shadow-xl shadow-slate-950/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-50">Kontrol tontonan</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Status, progress, rating, dan catatan tersimpan otomatis.</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    ['watchlist', 'Watchlist'],
                    ['watching', 'Nonton'],
                    ['completed', 'Selesai'],
                    ['favorite', 'Favorit'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateSavedFilm(activeSavedFilm.id, { status: value as FilmItem['status'] })}
                      className={`h-9 rounded-md border text-xs font-bold transition ${
                        activeSavedFilm.status === value
                          ? 'border-red-300/60 bg-red-500 text-slate-50'
                          : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-red-300/40 hover:text-slate-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <label className="mt-4 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Progress menit
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={240}
                    value={Math.round((activeSavedFilm.progressSeconds || 0) / 60)}
                    onChange={(event) =>
                      updateSavedFilm(activeSavedFilm.id, {
                        progressSeconds: Number(event.target.value) * 60,
                        status: Number(event.target.value) > 0 ? 'watching' : activeSavedFilm.status,
                      })
                    }
                    className="w-full accent-red-500"
                  />
                  <span className="w-14 text-right text-xs font-bold text-slate-300">
                    {Math.round((activeSavedFilm.progressSeconds || 0) / 60)}m
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Rating pribadi</p>
                  <div className="mt-2 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => updateSavedFilm(activeSavedFilm.id, { rating })}
                        className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${
                          (activeSavedFilm.rating || 0) >= rating
                            ? 'border-amber-300/50 bg-amber-300/15 text-amber-200'
                            : 'border-slate-700 bg-slate-950 text-slate-600 hover:text-amber-200'
                        }`}
                        aria-label={`Rating ${rating}`}
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={activeSavedFilm.notes || ''}
                  onChange={(event) => updateSavedFilm(activeSavedFilm.id, { notes: event.target.value })}
                  placeholder="Catatan mood setelah nonton..."
                  className="mt-4 min-h-24 w-full resize-none rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-red-300/60"
                />
              </section>
            )}
          </aside>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <div className="min-w-0 space-y-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-normal text-slate-50">Jelajah tontonan</h2>
              <p className="mt-1 text-sm text-slate-500">Katalog legal, link pribadi, dan riwayat tersimpan di perangkat ini.</p>
            </div>
            <div className="flex h-10 items-center gap-2 rounded-md border border-slate-800 bg-[#12141b] px-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari tontonan..."
                className="w-full min-w-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600 md:w-56"
              />
            </div>
          </div>

          {search ? (
            <FilmRail title="Hasil pencarian" films={filteredFilms} activeId={activeFilm.id} onPlay={playFilm} onRemove={removeSavedFilm} />
          ) : (
            <>
              <FilmRail title="Lanjut nonton" films={recentFilms} activeId={activeFilm.id} onPlay={playFilm} onRemove={removeSavedFilm} />
              {groupedFilms.map((group) => (
                <FilmRail
                  key={group.category}
                  title={group.title}
                  films={group.films}
                  activeId={activeFilm.id}
                  onPlay={playFilm}
                  onRemove={removeSavedFilm}
                />
              ))}
            </>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-800 bg-[#11141c] p-5">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-red-300" />
              <h2 className="text-base font-bold text-slate-50">AI rekomendasi film</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              AI membaca mood, katalog, dan library tersimpan untuk menyusun urutan nonton yang lebih pas.
            </p>
            <div className="mt-4 space-y-3">
              <select
                value={aiMood}
                onChange={(event) => setAiMood(event.target.value)}
                className="h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-red-300/60"
              >
                <option value="butuh tontonan ringan">Butuh tontonan ringan</option>
                <option value="ingin fokus belajar">Ingin fokus belajar</option>
                <option value="lagi lelah dan butuh relaksasi">Lelah dan butuh relaksasi</option>
                <option value="ingin cerita petualangan">Ingin cerita petualangan</option>
              </select>
              <button
                onClick={askAiRecommendation}
                disabled={aiLoading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-100 text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Buat rekomendasi AI
              </button>
            </div>
            {aiError && <p className="mt-3 text-xs leading-5 text-amber-200">{aiError}</p>}
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-50">{aiSuggestion.title}</h3>
                <span className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {aiSuggestion.source}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-300">{aiSuggestion.reply}</p>
              {aiSuggestion.keyPoints.length > 0 && (
                <div className="mt-4 space-y-2">
                  {aiSuggestion.keyPoints.slice(0, 3).map((point) => (
                    <div key={point} className="flex gap-2 text-xs leading-5 text-slate-400">
                      <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-300" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              )}
              {aiSuggestion.nextSteps.length > 0 && (
                <div className="mt-4 border-t border-slate-800 pt-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Langkah berikutnya</p>
                  <div className="mt-2 space-y-2">
                    {aiSuggestion.nextSteps.slice(0, 3).map((step) => (
                      <p key={step} className="text-xs leading-5 text-slate-400">{step}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {discoveryItems.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Info publik yang dibaca</p>
                <div className="mt-3 space-y-3">
                  {discoveryItems.slice(0, 3).map((item) => (
                    <div key={`${item.title}-${item.source}`} className="border-t border-slate-800 pt-3 first:border-t-0 first:pt-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-slate-100">{item.title}</p>
                        <span className="shrink-0 rounded bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          {item.source}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#11141c] p-5">
            <div className="mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-slate-300" />
              <h2 className="text-base font-bold text-slate-50">Riwayat otomatis</h2>
            </div>
            {recentFilms.length === 0 ? (
              <p className="text-sm leading-6 text-slate-500">Putar film untuk membuat riwayat lanjut nonton.</p>
            ) : (
              <div className="space-y-2">
                {recentFilms.slice(0, 5).map((film) => (
                  <button
                    key={film.id}
                    onClick={() => playFilm(film.id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-left transition hover:border-red-300/40"
                  >
                    <Film className="h-4 w-4 shrink-0 text-red-300" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-100">{film.title}</span>
                    <Play className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200" />
              <div>
                <h2 className="text-sm font-bold text-emerald-100">Mode aman hak cipta</h2>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Player hanya menerima YouTube dan Vimeo resmi. Situs tidak resmi tidak dihubungkan ke sistem.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#11141c] p-5">
            <div className="mb-4 flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-emerald-200" />
              <h2 className="text-base font-bold text-slate-50">Mode nonton sehat</h2>
            </div>
            <div className="space-y-3">
              {[
                ['Jeda 20 menit', 'Berhenti sebentar, minum air, dan regangkan tubuh.'],
                ['Pilih mood ringan', 'Gunakan video relaksasi saat energi mental sedang rendah.'],
                ['Jaga batas malam', 'Nonton tetap perlu batas agar pemulihan tidak terganggu.'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p className="text-sm font-bold text-slate-100">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
              <div>
                <h2 className="text-sm font-bold text-amber-100">Batasan sumber</h2>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Gunakan platform legal, channel resmi, materi open-license, atau video milik sendiri.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
