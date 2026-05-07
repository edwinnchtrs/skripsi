import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, TrendingUp, ArrowLeft, User, Clock, ShieldAlert, Zap, Brain,
  Activity, Target, Loader2, X, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import api from '../api';
import { card } from './dashboard/styles';

interface Responden {
  id: number;
  nama: string;
  username: string;
  latest_burnout: number;
  latest_risk: string;
  latest_psychosomatic: number;
  last_activity: string;
}

// Matches Go backend PascalCase JSON keys
interface RealPrediction {
  ID: number;
  BurnoutScore: number;
  PsychosomaticScore: number;
  RiskLevel: string;
  Timestamp: string;
}

interface FormattedPrediction {
  id: number;
  burnout: number;
  psycho: number;
  risk: string;
  date: string;
  timestamp: string;
}

const formatPrediction = (p: RealPrediction): FormattedPrediction => ({
  id: p.ID,
  burnout: p.BurnoutScore,
  psycho: p.PsychosomaticScore,
  risk: p.RiskLevel || '-',
  date: new Date(p.Timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }),
  timestamp: p.Timestamp,
});

export default function PrediksiIndividu() {
  const [users, setUsers] = useState<Responden[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [history, setHistory] = useState<FormattedPrediction[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');
  const [detailModal, setDetailModal] = useState<FormattedPrediction | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/responden');
      setUsers(res.data.respondents || []);
    } catch (e) { console.error(e); }
    finally { setLoadingUsers(false); }
  };

  const fetchHistory = async (id: number) => {
    setLoading(true);
    setHistory([]);
    setAssessments([]);
    try {
      const res = await api.get(`/responden/${id}/history`);
      const predictions: FormattedPrediction[] = (res.data.predictions || [])
        .map((p: RealPrediction) => formatPrediction(p))
        .reverse();
      setHistory(predictions);
      setAssessments(res.data.assessments || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const s = search.toLowerCase();
    return users.filter(u => u.nama.toLowerCase().includes(s) || u.username.toLowerCase().includes(s));
  }, [users, search]);

  const selectUser = (id: number) => {
    setSelectedId(id);
    fetchHistory(id);
    setShowDropdown(false);
    setSearch('');
  };

  const selected = users.find(u => u.id === selectedId);
  const latest = history[history.length - 1];
  const prev = history.length > 1 ? history[history.length - 2] : null;

  const trendDir = prev && latest
    ? (latest.burnout > prev.burnout ? 'up' : latest.burnout < prev.burnout ? 'down' : 'steady')
    : null;

  const maxScore = useMemo(() => {
    if (history.length === 0) return 10;
    return Math.ceil(Math.max(...history.map(h => Math.max(h.burnout, h.psycho))) / 5) * 5 + 5;
  }, [history]);

  const riskColor = (risk: string) =>
    risk === 'High' ? '#ef4444' : risk === 'Medium' ? '#f59e0b' : risk === 'Low' ? '#22c55e' : '#8890a4';

  const riskLabel = (risk: string) =>
    risk === 'High' ? 'Tinggi' : risk === 'Medium' ? 'Sedang' : risk === 'Low' ? 'Rendah' : risk || '-';

  const riskBadge = (risk: string) => {
    const c = riskColor(risk);
    return { background: c + '18', color: c, border: `1px solid ${c}30` };
  };

  const formatDateTime = (d: string) => {
    if (!d || d.startsWith('0001')) return '-';
    return new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const hasData = (r: Responden) => r.latest_risk && r.latest_risk !== '';

  return (
    <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Prediksi Individu</h1>
            <p style={{ color: '#8890a4', fontSize: 12, margin: '2px 0 0' }}>Analisis mendalam tren kesehatan mental responden — data real dari database</p>
          </div>
        </div>
      </div>

      {/* User Selection Screen */}
      {!selectedId ? (
        <div style={{ ...card, maxWidth: 640, margin: '0 auto', padding: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Search size={24} color="#6366f1" />
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>Pilih Responden</h3>
          <p style={{ color: '#8890a4', fontSize: 12, margin: '0 0 20px' }}>Cari dan pilih responden untuk melihat laporan analitik personal berdasarkan data asesmen nyata</p>

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f1117', borderRadius: 10, padding: '10px 14px', border: '1px solid #1e2130' }}>
              <Search size={15} color="#8890a4" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => { setSearch(e.target.value); setShowDropdown(true); setHoverIdx(-1); }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setHoverIdx(i => Math.min(i + 1, filtered.length - 1)); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setHoverIdx(i => Math.max(i - 1, -1)); }
                  if (e.key === 'Enter' && hoverIdx >= 0 && filtered[hoverIdx]) {
                    selectUser(filtered[hoverIdx].id);
                  }
                  if (e.key === 'Escape') setShowDropdown(false);
                }}
                placeholder="Cari nama atau username responden..."
                style={{ background: 'none', border: 'none', color: '#e2e8f0', fontSize: 13, outline: 'none', flex: 1 }}
              />
              {loadingUsers && <Loader2 size={14} color="#8890a4" style={{ animation: 'spin 1s linear infinite' }} />}
            </div>

            {showDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: '#131722', border: '1px solid #1e2130', borderRadius: 10,
                maxHeight: 320, overflowY: 'auto', zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#8890a4', fontSize: 12 }}>
                    {loadingUsers ? 'Memuat...' : 'Tidak ada responden ditemukan'}
                  </div>
                ) : (
                  filtered.map((u, i) => {
                    const badge = hasData(u) ? riskBadge(u.latest_risk) : { background: 'transparent', color: '#4a5068', border: '1px solid #1e2130' };
                    return (
                      <div key={u.id} onClick={() => selectUser(u.id)}
                        onMouseEnter={() => setHoverIdx(i)}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                          background: hoverIdx === i ? '#181b28' : 'transparent',
                          borderBottom: '1px solid #1a1d2a', transition: 'background 0.1s',
                        }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: `linear-gradient(135deg, ${hasData(u) ? riskColor(u.latest_risk) + '30' : '#4a506830'}, ${hasData(u) ? riskColor(u.latest_risk) + '10' : '#4a506810'})`,
                          border: `1.5px solid ${hasData(u) ? riskColor(u.latest_risk) + '40' : '#4a506830'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: hasData(u) ? riskColor(u.latest_risk) : '#4a5068',
                        }}>
                          {u.nama.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{u.nama}</div>
                          <div style={{ fontSize: 11, color: '#8890a4' }}>{u.username}</div>
                        </div>
                        {hasData(u) ? (
                          <>
                            <span style={{ padding: '3px 10px', borderRadius: 14, fontSize: 10, fontWeight: 600, ...badge }}>
                              {riskLabel(u.latest_risk)}
                            </span>
                            <span style={{ fontSize: 10, color: '#4a5068', width: 36, textAlign: 'right', fontWeight: 600 }}>
                              {u.latest_burnout?.toFixed(1)}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: 10, color: '#4a5068', fontStyle: 'italic' }}>Belum ada data</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Detail View */
        <div>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <button onClick={() => { setSelectedId(null); setHistory([]); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#131722', border: '1px solid #1e2130', borderRadius: 8, color: '#8890a4', padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>
              <ArrowLeft size={14} /> Kembali
            </button>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{selected?.nama}</div>
              <div style={{ fontSize: 11, color: '#8890a4' }}>{selected?.username} · ID: {selected?.id}</div>
            </div>
            {latest && (
              <span style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, ...riskBadge(latest.risk) }}>
                {riskLabel(latest.risk)}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
              <Loader2 size={28} color="#8890a4" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : history.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: 48 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(136,144,164,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Clock size={26} color="#8890a4" />
              </div>
              <h3 style={{ margin: '0 0 6px', color: '#e2e8f0', fontSize: 16 }}>Belum Ada Data</h3>
              <p style={{ color: '#8890a4', fontSize: 13, margin: 0 }}>Responden ini belum memiliki riwayat prediksi. Ajak responden untuk menyelesaikan asesmen terlebih dahulu.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 12 }}>
              {/* Left Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Gauge */}
                <div style={{ ...card, textAlign: 'center', padding: '20px 16px' }}>
                  <div style={{ fontSize: 10, color: '#8890a4', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 }}>
                    Skor Burnout Terkini
                  </div>
                  <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 10px' }}>
                    <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#1e2130" strokeWidth="9" />
                      {latest && (
                        <circle cx="60" cy="60" r="50" fill="none" stroke={`url(#gGrad)`} strokeWidth="9"
                          strokeDasharray={`${314 * Math.min(latest.burnout / maxScore, 1)} 314`} strokeLinecap="round" />
                      )}
                      <defs>
                        <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: riskColor(latest?.risk || '') }}>
                        {latest?.burnout.toFixed(1)}
                      </span>
                      <span style={{ fontSize: 9, color: '#8890a4' }}>/ {maxScore}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {trendDir === 'up' ? <TrendingUp size={13} color="#ef4444" /> : trendDir === 'down' ? <TrendingUp size={13} color="#22c55e" style={{ transform: 'scaleY(-1)' }} /> : null}
                    <span style={{ fontSize: 10, color: trendDir === 'up' ? '#ef4444' : trendDir === 'down' ? '#22c55e' : '#8890a4', fontWeight: 600 }}>
                      {trendDir === 'up' ? 'Meningkat' : trendDir === 'down' ? 'Menurun' : trendDir === 'steady' ? 'Stabil' : '-'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { icon: Activity, label: 'Psikosomatis', value: latest?.psycho.toFixed(1) || '-', color: '#3ecfcf' },
                    { icon: Clock, label: 'Total Prediksi', value: history.length, color: '#6c63ff' },
                    { icon: Target, label: 'Total Asesmen', value: assessments.length, color: '#a855f7' },
                    { icon: Brain, label: 'Skor Interferensi', value: assessments.length > 0 ? assessments[assessments.length - 1]?.InterferenceScore?.toFixed(2) : '-', color: '#f59e0b' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: s.color + '15', border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <s.icon size={13} color={s.color} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: 10, color: '#8890a4' }}>{s.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Insight */}
                <div style={{ ...card }}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: '#8890a4', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>
                    <Zap size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Insight
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <TrendingUp size={13} color="#6c63ff" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 11, color: '#8890a4', lineHeight: 1.5 }}>
                        Tren burnout <strong style={{ color: '#e2e8f0' }}>{trendDir === 'up' ? 'meningkat' : trendDir === 'down' ? 'menurun' : 'stabil'}</strong> dalam {history.length} prediksi terakhir.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ShieldAlert size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 11, color: '#8890a4', lineHeight: 1.5 }}>
                        {latest?.risk === 'High'
                          ? <span>Risiko tinggi — <strong style={{ color: '#e2e8f0' }}>perlu intervensi segera</strong>.</span>
                          : latest?.risk === 'Medium'
                            ? <span>Risiko sedang — <strong style={{ color: '#e2e8f0' }}>monitor secara berkala</strong>.</span>
                            : <span>Risiko rendah — <strong style={{ color: '#e2e8f0' }}>kondisi masih terkendali</strong>.</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Chart + History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Trend Chart */}
                <div style={{ ...card, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TrendingUp size={16} color="#6c63ff" /> Tren Skor
                    </h3>
                    <div style={{ display: 'flex', gap: 3, background: '#0f1117', borderRadius: 6, padding: 3, border: '1px solid #1e2130' }}>
                      {(['area', 'bar'] as const).map(mode => (
                        <button key={mode} onClick={() => setChartMode(mode)}
                          style={{
                            padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11,
                            background: chartMode === mode ? 'rgba(108,99,255,0.15)' : 'transparent',
                            color: chartMode === mode ? '#a89cff' : '#8890a4',
                          }}>
                          {mode === 'area' ? 'Area' : 'Bar'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                    {[
                      { label: 'Burnout', color: '#6c63ff' },
                      { label: 'Psikosomatis', color: '#22c55e' },
                    ].map(l => (
                      <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#8890a4' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} /> {l.label}
                      </span>
                    ))}
                  </div>

                  <ResponsiveContainer width="100%" height={250}>
                    {chartMode === 'area' ? (
                      <AreaChart data={history} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                        <defs>
                          <linearGradient id="ab" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="ap" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                        <XAxis dataKey="date" tick={{ fill: '#8890a4', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#8890a4', fontSize: 10 }} domain={[0, maxScore]} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} />
                        <Area type="monotone" dataKey="burnout" name="Burnout" stroke="#6c63ff" strokeWidth={2.5} fill="url(#ab)" dot={{ r: 4, fill: '#6c63ff' }} />
                        <Area type="monotone" dataKey="psycho" name="Psikosomatis" stroke="#22c55e" strokeWidth={2.5} fill="url(#ap)" dot={{ r: 4, fill: '#22c55e' }} />
                      </AreaChart>
                    ) : (
                      <BarChart data={history} margin={{ top: 5, right: 5, bottom: 5, left: -15 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                        <XAxis dataKey="date" tick={{ fill: '#8890a4', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#8890a4', fontSize: 10 }} domain={[0, maxScore]} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} />
                        <Bar dataKey="burnout" name="Burnout" fill="#6c63ff" radius={[4, 4, 0, 0]} barSize={18} />
                        <Bar dataKey="psycho" name="Psikosomatis" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={18} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* History Table */}
                <div style={{ ...card, overflow: 'hidden' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={15} color="#6c63ff" /> Riwayat Prediksi ({history.length})
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e2130' }}>
                          {['Tanggal', 'Skor Burnout', 'Psikosomatis', 'Status', 'Detail'].map(h => (
                            <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.slice().reverse().map((p) => {
                          const badge = riskBadge(p.risk);
                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #1a1d2a' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#181b28')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <td style={{ padding: '10px 12px', color: '#c0c9e0', fontSize: 11 }}>{p.date}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 700, color: '#e2e8f0', minWidth: 36 }}>{p.burnout.toFixed(1)}</span>
                                  <div style={{ flex: 1, maxWidth: 70, height: 4, background: '#1e2130', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(p.burnout / maxScore * 100, 100)}%`, height: '100%', background: riskColor(p.risk), borderRadius: 2 }} />
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '10px 12px', color: '#c0c9e0' }}>{p.psycho.toFixed(1)}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, ...badge }}>
                                  {riskLabel(p.risk)}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <button onClick={() => setDetailModal(p)}
                                  style={{ padding: '5px 10px', borderRadius: 5, background: 'transparent', border: '1px solid #1e2130', color: '#8890a4', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <ChevronRight size={12} /> Detail
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDetailModal(null)}>
          <div style={{ ...card, width: 380, maxWidth: '92vw', padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Detail Prediksi</h3>
                <span style={{ fontSize: 10, color: '#8890a4' }}>{detailModal.date}</span>
              </div>
              <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', color: '#8890a4', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Skor Burnout', value: detailModal.burnout.toFixed(2), color: riskColor(detailModal.risk) },
                { label: 'Skor Psikosomatis', value: detailModal.psycho.toFixed(2), color: '#3ecfcf' },
                { label: 'Status Risiko', value: riskLabel(detailModal.risk), color: riskColor(detailModal.risk) },
                { label: 'ID Prediksi', value: `#${detailModal.id}`, color: '#8890a4' },
                { label: 'Timestamp', value: formatDateTime(detailModal.timestamp) },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130' }}>
                  <span style={{ fontSize: 11, color: '#8890a4' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: color || '#e2e8f0' }}>{value}</span>
                </div>
              ))}
              {/* Progress bar */}
              <div style={{ padding: '10px 12px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#8890a4' }}>Level Burnout</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: riskColor(detailModal.risk) }}>{detailModal.burnout.toFixed(1)} / {maxScore}</span>
                </div>
                <div style={{ height: 8, background: '#1e2130', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(detailModal.burnout / maxScore * 100, 100)}%`, height: '100%', borderRadius: 4,
                    background: 'linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)',
                    backgroundSize: '200% 100%',
                    backgroundPosition: `${100 - Math.min(detailModal.burnout / maxScore * 100, 100)}% 0`,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: '#22c55e' }}>Rendah</span>
                  <span style={{ fontSize: 9, color: '#f59e0b' }}>Sedang</span>
                  <span style={{ fontSize: 9, color: '#ef4444' }}>Tinggi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
