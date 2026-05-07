import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Send, User, Loader2, CheckCircle2, X, AlertCircle } from 'lucide-react';
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

const riskColor = (r: string) => r === 'High' || r === 'Crisis' ? '#ef4444' : r === 'Medium' ? '#f59e0b' : r === 'Low' ? '#22c55e' : '#8890a4';
const riskLabel = (r: string) => r === 'High' || r === 'Crisis' ? 'Tinggi' : r === 'Medium' ? 'Sedang' : r === 'Low' ? 'Rendah' : 'N/A';
const riskBadge = (r: string) => ({ background: riskColor(r) + '15', color: riskColor(r), border: `1px solid ${riskColor(r)}30` });

export default function Responden() {
  const [data, setData] = useState<Responden[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Responden | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    const risk = r.latest_risk;
    const defaults: Record<string, string> = {
      'Crisis': 'Segera lakukan intervensi klinis. Responden menunjukkan tanda kelelahan ekstrem. Disarankan istirahat total dan konsultasi psikolog.',
      'High': 'Rekomendasi sesi konseling 1-on-1. Perlu penyesuaian beban kerja dan pemantauan berkala setiap minggu.',
      'Medium': 'Sarankan mengikuti program manajemen stres. Pantau perkembangan melalui kuisioner harian.',
      'Low': 'Pertahankan kondisi saat ini. Tetap lakukan kuisioner harian untuk monitoring rutin.',
    };
    setMessage(defaults[risk] || 'Tulis rekomendasi penanganan untuk responden ini...');
  };

  const handleSend = async () => {
    if (!selected || !message.trim() || sending) return;
    setSending(true);
    try {
      await api.post(`/admin/users/${selected.id}/treatment`, { message: message.trim() });
      setSent(true);
      setToast({ type: 'success', text: `Rekomendasi terkirim ke ${selected.nama}` });
    } catch (x: any) {
      setToast({ type: 'error', text: x.response?.data?.error || 'Gagal mengirim rekomendasi' });
    }
    finally { setSending(false); }
  };

  const formatDate = (d: string) => {
    if (!d || d.startsWith('0001')) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const hasData = (r: Responden) => r.latest_risk && r.latest_risk !== '';

  return (
    <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #6c63ff, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Data Responden</h1>
            <span style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{data.length} orang</span>
          </div>
          <p style={{ color: '#8890a4', fontSize: 12, margin: '2px 0 0' }}>Pantau kesehatan mental responden & kirim rekomendasi penanganan personal</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
          background: toast.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: toast.type === 'success' ? '#4ade80' : '#f87171',
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.text}
        </div>
      )}

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#131722', borderRadius: 10, padding: '8px 14px', border: '1px solid #1e2130', maxWidth: 400, marginBottom: 16 }}>
        <Search size={14} color="#8890a4" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau username..."
          style={{ background: 'none', border: 'none', color: '#e2e8f0', fontSize: 13, outline: 'none', flex: 1 }} />
        <span style={{ fontSize: 10, color: '#4a5068' }}>{filtered.length} orang</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={24} color="#8890a4" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
          {filtered.map(r => {
            const badge = hasData(r) ? riskBadge(r.latest_risk) : { background: 'transparent', color: '#4a5068', border: '1px solid #1e2130' };
            return (
              <div key={r.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12, padding: '18px 20px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2e42'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2130'; e.currentTarget.style.transform = 'none'; }}>
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
                  background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
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
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => { if (!sending) { setSelected(null); setSent(false); } }}>
          <div style={{ ...card, width: 520, maxWidth: '92vw', padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>Surat Rekomendasi</h3>
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
                  Tutup
                </button>
              </div>
            ) : (
              <>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#8890a4', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Rencana Penanganan
                </label>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Tulis rekomendasi penanganan yang akan dikirim ke responden..."
                  disabled={sending}
                  style={{
                    width: '100%', height: 120, background: '#0f1117', border: '1px solid #1e2130',
                    borderRadius: 10, padding: '12px 14px', color: '#e2e8f0', fontSize: 12, outline: 'none',
                    resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box',
                  }}
                />

                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button onClick={() => { setSelected(null); setSent(false); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'transparent', border: '1px solid #1e2130', color: '#8890a4', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                    Batal
                  </button>
                  <button onClick={handleSend} disabled={!message.trim() || sending}
                    style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: (!message.trim() || sending) ? '#2a2e42' : 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
                      color: '#fff', fontSize: 12, fontWeight: 600, cursor: (!message.trim() || sending) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {sending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                    {sending ? 'Mengirim...' : 'Kirim Rekomendasi'}
                  </button>
                </div>

                <p style={{ fontSize: 10, color: '#4a5068', marginTop: 8, textAlign: 'center' }}>
                  Pesan akan muncul sebagai notifikasi terapi di dashboard user
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
