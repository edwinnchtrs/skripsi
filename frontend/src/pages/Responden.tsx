import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileText, Send, User, Loader2, CheckCircle2, X, AlertCircle, Clock,
  Target, Shield, Zap, Calendar, Clock3, Flame, Heart, Brain, Info, ChevronDown,
  History, TrendingUp, Activity, Bell, Users,
} from 'lucide-react';
import api from '../api';
import { card, sectionTitle } from './dashboard/styles';

interface Responden {
  id: number;
  nama: string;
  username: string;
  latest_burnout: number;
  latest_risk: string;
  latest_psychosomatic: number;
  last_activity: string;
}

interface TreatmentHistory {
  ID: number;
  ModuleName: string;
  Category: string;
  Priority: string;
  Duration: string;
  Status: string;
  FollowUpDate: string;
  CreatedAt: string;
}

const riskColor = (r: string) => r === 'High' || r === 'Crisis' ? '#ef4444' : r === 'Medium' ? '#f59e0b' : r === 'Low' ? '#22c55e' : '#8890a4';
const riskLabel = (r: string) => r === 'High' || r === 'Crisis' ? 'Tinggi' : r === 'Medium' ? 'Sedang' : r === 'Low' ? 'Rendah' : 'N/A';
const riskBadge = (r: string) => ({ background: riskColor(r) + '15', color: riskColor(r), border: `1px solid ${riskColor(r)}30` });

const categories = [
  { value: 'konseling', label: 'Konseling Psikologis', icon: Heart, color: '#ef4444' },
  { value: 'meditasi', label: 'Meditasi & Mindfulness', icon: Brain, color: '#a855f7' },
  { value: 'olahraga', label: 'Aktivitas Fisik', icon: Activity, color: '#22c55e' },
  { value: 'istirahat', label: 'Manajemen Istirahat', icon: Clock, color: '#f59e0b' },
  { value: 'sosial', label: 'Dukungan Sosial', icon: Users, color: '#3ecfcf' },
  { value: 'edukasi', label: 'Edukasi Kesehatan Mental', icon: Info, color: '#6c63ff' },
];

const priorities = [
  { value: 'urgent', label: 'URGENT - Segera', color: '#ef4444' },
  { value: 'high', label: 'Tinggi', color: '#f59e0b' },
  { value: 'medium', label: 'Sedang', color: '#3ecfcf' },
  { value: 'low', label: 'Rendah', color: '#8890a4' },
];

const durations = [
  { value: '1_week', label: '1 Minggu' },
  { value: '2_weeks', label: '2 Minggu' },
  { value: '1_month', label: '1 Bulan' },
  { value: '3_months', label: '3 Bulan' },
];

const templates: Record<string, string> = {
  'Crisis': 'INTERVENSI KRITIS: Responden memerlukan tindakan segera. 1) Rujuk ke psikolog/psikiater dalam 24 jam. 2) Evaluasi beban kerja/akademik dan kurangi signifikan. 3) Sesi konseling intensif 2x/minggu. 4) Monitoring harian melalui check-in wajib. 5) Libatkan keluarga/orang terdekat untuk dukungan.',
  'High': 'RENCANA PENANGANAN: 1) Sesi konseling 1-on-1 mingguan. 2) Program manajemen stres terstruktur. 3) Penyesuaian beban kerja dengan supervisi ketat. 4) Jadwalkan aktivitas fisik rutin 3x/minggu. 5) Evaluasi perkembangan setiap 2 minggu.',
  'Medium': 'PROGRAM PEMULIHAN: 1) Ikuti workshop manajemen stres. 2) Jadwalkan waktu istirahat teratur (teknik pomodoro). 3) Aktivitas kelompok dukungan sebaya. 4) Journaling harian untuk tracking mood. 5) Evaluasi bulanan.',
  'Low': 'PROGRAM PREVENTIF: 1) Lanjutkan kuisioner pemantauan harian. 2) Pertahankan rutinitas olahraga ringan. 3) Praktikkan teknik pernapasan 5 menit/hari. 4) Ikuti sesi grup bulanan. 5) Tetap terhubung dengan support system.',
};

export default function Responden() {
  const [data, setData] = useState<Responden[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Responden | null>(null);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('konseling');
  const [priority, setPriority] = useState('medium');
  const [duration, setDuration] = useState('1_week');
  const [followUpDate, setFollowUpDate] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<TreatmentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); } }, [toast]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/responden');
      setData(res.data.respondents || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = data.filter(r =>
    r.nama.toLowerCase().includes(search.toLowerCase()) ||
    r.username.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (r: Responden) => {
    setSelected(r);
    setSent(false);
    setShowHistory(false);
    setHistory([]);
    const template = templates[r.latest_risk] || templates['Medium'];
    setMessage(template);
    setCategory('konseling');
    setPriority(r.latest_risk === 'Crisis' ? 'urgent' : r.latest_risk === 'High' ? 'high' : 'medium');
    setDuration('1_week');
    setFollowUpDate('');
    loadHistory(r.id);
  };

  const loadHistory = async (userId: number) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/admin/users/${userId}/treatments`);
      setHistory(res.data.treatments || []);
    } catch { setHistory([]); }
    finally { setLoadingHistory(false); }
  };

  const handleSend = async () => {
    if (!selected || !message.trim() || sending) return;
    setSending(true);
    try {
      await api.post(`/admin/users/${selected.id}/treatment`, {
        message: message.trim(),
        category,
        priority,
        duration,
        follow_up_date: followUpDate,
      });
      setSent(true);
      setToast({ type: 'success', text: `Rekomendasi terkirim ke ${selected.nama}` });
      loadHistory(selected.id);
    } catch (x: any) {
      setToast({ type: 'error', text: x.response?.data?.error || 'Gagal mengirim rekomendasi' });
    }
    finally { setSending(false); }
  };

  const formatDate = (d: string) => {
    if (!d || d.startsWith('0001')) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatFullDate = (d: string) => {
    if (!d || d.startsWith('0001')) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const hasData = (r: Responden) => r.latest_risk && r.latest_risk !== '';

  const priConf: Record<string, { color: string; label: string }> = {
    urgent: { color: '#ef4444', label: 'URGENT' },
    high: { color: '#f59e0b', label: 'Tinggi' },
    medium: { color: '#3ecfcf', label: 'Sedang' },
    low: { color: '#8890a4', label: 'Rendah' },
  };

  return (
    <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #1e2130 transparent; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #1e2130; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #6c63ff, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Data Responden</h1>
            <span style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{data.length} orang</span>
            {data.filter(r => r.latest_risk === 'Crisis').length > 0 && (
              <span style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                {data.filter(r => r.latest_risk === 'Crisis').length} krisis
              </span>
            )}
          </div>
          <p style={{ color: '#8890a4', fontSize: 12, margin: '2px 0 0' }}>Pantau kesehatan mental responden & kirim rekomendasi penanganan personal</p>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: toast.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: toast.type === 'success' ? '#4ade80' : '#f87171',
            }}
          >
            {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#131722', borderRadius: 10, padding: '8px 14px', border: '1px solid #1e2130', maxWidth: 400, marginBottom: 16 }}>
        <Search size={14} color="#8890a4" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau username..."
          style={{ background: 'none', border: 'none', color: '#e2e8f0', fontSize: 13, outline: 'none', flex: 1 }} />
        <span style={{ fontSize: 10, color: '#4a5068', whiteSpace: 'nowrap' }}>{filtered.length} dari {data.length}</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={24} color="#8890a4" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
          {filtered.map(r => {
            const badge = hasData(r) ? riskBadge(r.latest_risk) : { background: 'transparent', color: '#4a5068', border: '1px solid #1e2130' };
            const crisis = r.latest_risk === 'Crisis';
            return (
              <div key={r.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12, padding: '18px 20px', transition: 'all 0.2s', borderColor: crisis ? 'rgba(239,68,68,0.3)' : '#1e2130' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = crisis ? 'rgba(239,68,68,0.5)' : '#2a2e42'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = crisis ? 'rgba(239,68,68,0.3)' : '#1e2130'; }}>
                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${riskColor(r.latest_risk)}25, ${riskColor(r.latest_risk)}08)`,
                    border: `1.5px solid ${riskColor(r.latest_risk)}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700, color: riskColor(r.latest_risk),
                  }}>
                    {r.nama.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{r.nama}</div>
                    <div style={{ fontSize: 11, color: '#8890a4' }}>{r.username}</div>
                  </div>
                  {hasData(r) && (
                    <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, ...badge }}>
                      {riskLabel(r.latest_risk)}
                    </span>
                  )}
                </div>

                {/* Scores */}
                {hasData(r) ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ padding: '10px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130' }}>
                      <div style={{ fontSize: 9, color: '#8890a4', marginBottom: 2 }}>Burnout</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{r.latest_burnout.toFixed(1)}<span style={{ fontSize: 10, color: '#4a5068' }}>/10</span></div>
                    </div>
                    <div style={{ padding: '10px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130' }}>
                      <div style={{ fontSize: 9, color: '#8890a4', marginBottom: 2 }}>Psikosomatis</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{r.latest_psychosomatic.toFixed(1)}<span style={{ fontSize: 10, color: '#4a5068' }}>/10</span></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '10px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130', textAlign: 'center', fontSize: 11, color: '#4a5068' }}>
                    Belum ada data asesmen
                  </div>
                )}

                <div style={{ fontSize: 10, color: '#4a5068', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Aktivitas: {formatDate(r.last_activity)}</span>
                  <span>ID: #{r.id}</span>
                </div>

                <button onClick={() => openModal(r)} style={{
                  width: '100%', padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: crisis ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
                  color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}>
                  <FileText size={14} /> Berikan Penanganan
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Treatment Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => { if (!sending) { setSelected(null); setSent(false); } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ ...card, width: 620, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}
              className="scrollbar-thin"
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>Rekomendasi Penanganan</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#8890a4' }}>
                    Untuk: <span style={{ color: '#a89cff', fontWeight: 600 }}>{selected.nama}</span>
                    {hasData(selected) && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, ...riskBadge(selected.latest_risk) }}>{riskLabel(selected.latest_risk)}</span>}
                  </p>
                </div>
                <button onClick={() => { if (!sending) { setSelected(null); setSent(false); } }} style={{ background: 'none', border: 'none', color: '#8890a4', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Risk alert */}
              {hasData(selected) && (
                <div style={{ padding: '12px 14px', background: riskColor(selected.latest_risk) + '08', borderRadius: 10, border: `1px solid ${riskColor(selected.latest_risk)}20`, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <AlertCircle size={16} color={riskColor(selected.latest_risk)} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 11, color: '#8890a4', lineHeight: 1.5 }}>
                    Burnout: <strong style={{ color: riskColor(selected.latest_risk) }}>{selected.latest_burnout.toFixed(1)}/10</strong> · Psikosomatis: <strong style={{ color: '#3ecfcf' }}>{selected.latest_psychosomatic.toFixed(1)}/10</strong>
                  </div>
                </div>
              )}

              {/* Treatment History */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#8890a4', cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '6px 10px', borderRadius: 6, marginBottom: 10 }}
              >
                <History size={13} />
                Riwayat Penanganan ({history.length})
                <ChevronDown size={12} style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', marginBottom: 12 }}
                  >
                    {loadingHistory ? (
                      <div style={{ padding: 16, textAlign: 'center' }}>
                        <Loader2 size={16} color="#8890a4" style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                    ) : history.length === 0 ? (
                      <div style={{ padding: 12, textAlign: 'center', fontSize: 11, color: '#4a5068', background: '#0f1117', borderRadius: 8 }}>
                        Belum ada riwayat penanganan
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }} className="scrollbar-thin">
                        {history.map(h => {
                          const pc = priConf[h.Priority] || priConf['medium'];
                          return (
                            <div key={h.ID} style={{ padding: '10px 12px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130', fontSize: 11 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: pc.color + '15', color: pc.color, border: `1px solid ${pc.color}30` }}>{pc.label}</span>
                                <span style={{ color: '#4a5068' }}>{formatFullDate(h.CreatedAt)}</span>
                                <span style={{ marginLeft: 'auto', fontSize: 9, padding: '1px 6px', borderRadius: 4, background: h.Status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: h.Status === 'completed' ? '#4ade80' : '#f59e0b', border: `1px solid ${h.Status === 'completed' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                                  {h.Status === 'completed' ? 'Selesai' : 'Pending'}
                                </span>
                              </div>
                              <div style={{ color: '#8890a4', lineHeight: 1.4, maxHeight: 60, overflow: 'hidden' }}>{h.ModuleName}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {sent ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <CheckCircle2 size={26} color="#4ade80" />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Rekomendasi Terkirim!</div>
                  <p style={{ fontSize: 12, color: '#8890a4', margin: 0 }}>
                    {selected.nama} akan menerima notifikasi di dashboard mereka.
                  </p>
                  <button onClick={() => { setSelected(null); setSent(false); }} style={{
                    marginTop: 16, padding: '10px 24px', borderRadius: 8, background: '#6c63ff', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>
                    Kembali
                  </button>
                </div>
              ) : (
                <>
                  {/* Category + Priority + Duration rows */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    {/* Category */}
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#8890a4', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Kategori</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', background: '#0f1117', border: '1px solid #1e2130', borderRadius: 8, color: '#e2e8f0', fontSize: 12, outline: 'none', cursor: 'pointer' }}
                      >
                        {categories.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#8890a4', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Prioritas</label>
                      <select
                        value={priority}
                        onChange={e => setPriority(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', background: '#0f1117', border: '1px solid #1e2130', borderRadius: 8, color: priConf[priority]?.color || '#e2e8f0', fontSize: 12, outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {priorities.map(p => (
                          <option key={p.value} value={p.value} style={{ color: p.color }}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#8890a4', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Durasi Program</label>
                      <select
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', background: '#0f1117', border: '1px solid #1e2130', borderRadius: 8, color: '#e2e8f0', fontSize: 12, outline: 'none', cursor: 'pointer' }}
                      >
                        {durations.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Follow-up Date */}
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#8890a4', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Follow-up</label>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4a5068' }} />
                        <input
                          type="date"
                          value={followUpDate}
                          onChange={e => setFollowUpDate(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px 8px 30px', background: '#0f1117', border: '1px solid #1e2130', borderRadius: 8, color: '#e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Template buttons */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#8890a4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Template Cepat</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {Object.entries(templates).map(([risk, template]) => (
                        <button
                          key={risk}
                          onClick={() => setMessage(template)}
                          style={{
                            padding: '5px 10px', borderRadius: 6, border: `1px solid ${riskColor(risk)}30`, background: riskColor(risk) + '08',
                            color: riskColor(risk), fontSize: 10, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          {riskLabel(risk)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message textarea */}
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#8890a4', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Rencana Penanganan
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Tulis rekomendasi penanganan yang akan dikirim ke responden..."
                    disabled={sending}
                    style={{
                      width: '100%', height: 140, background: '#0f1117', border: '1px solid #1e2130',
                      borderRadius: 10, padding: '12px 14px', color: '#e2e8f0', fontSize: 12, outline: 'none',
                      resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box',
                    }}
                  />

                  {/* Notification preview */}
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130' }}>
                    <div style={{ fontSize: 9, color: '#4a5068', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pratinjau Notifikasi User</div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bell size={13} color="#a89cff" />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>
                          [{priConf[priority]?.label}] Rekomendasi Penanganan
                        </div>
                        <div style={{ fontSize: 10, color: '#8890a4', lineHeight: 1.4 }}>
                          {message.substring(0, 100)}{message.length > 100 ? '...' : ''}
                        </div>
                        {followUpDate && (
                          <div style={{ fontSize: 9, color: '#4ade80', marginTop: 4 }}>Follow-up: {formatDate(followUpDate)}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button onClick={() => { setSelected(null); setSent(false); }}
                      style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'transparent', border: '1px solid #1e2130', color: '#8890a4', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                      Batal
                    </button>
                    <button onClick={handleSend} disabled={!message.trim() || sending}
                      style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: (!message.trim() || sending) ? '#2a2e42' : 'linear-gradient(135deg, #6c63ff, #a855f7)',
                        color: '#fff', fontSize: 12, fontWeight: 600, cursor: (!message.trim() || sending) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {sending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                      {sending ? 'Mengirim...' : 'Kirim Rekomendasi'}
                    </button>
                  </div>

                  <p style={{ fontSize: 10, color: '#4a5068', marginTop: 8, textAlign: 'center' }}>
                    Pesan akan muncul sebagai notifikasi di dashboard user dan dapat dilihat di riwayat penanganan
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
