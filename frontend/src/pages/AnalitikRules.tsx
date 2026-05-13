import { useState, useMemo } from 'react';
import {
  Search, Filter, ArrowDownUp, Eye, Trash2, Sparkles, TrendingUp,
  Target, Zap, BarChart3, AlertCircle, CheckCircle2, Hash, Percent,
  ArrowRight, Lightbulb, Layers, SlidersHorizontal, RotateCcw
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie, BarChart, Bar, Legend
} from 'recharts';
import { card, sectionTitle } from './dashboard/styles';

interface Rule {
  id: number;
  antecedent: string;
  consequent: string;
  confidence: number;
  support: number;
  lift: number;
  conviction: number;
  category: string;
  status: 'active' | 'inactive' | 'review';
  impact: 'high' | 'medium' | 'low';
}

const rulesData: Rule[] = [
  { id: 1, antecedent: 'Beban Kerja Tinggi & Kualitas Tidur Rendah', consequent: 'Burnout Tinggi', confidence: 0.92, support: 0.38, lift: 2.85, conviction: 3.2, category: 'Burnout', status: 'active', impact: 'high' },
  { id: 2, antecedent: 'Stres Kronis & Dukungan Sosial Rendah', consequent: 'Risiko Psikosomatis Tinggi', confidence: 0.88, support: 0.32, lift: 2.64, conviction: 2.9, category: 'Psikosomatis', status: 'active', impact: 'high' },
  { id: 3, antecedent: 'Jam Kerja > 50 jam & Istirahat < 6 jam', consequent: 'Burnout Sedang-Tinggi', confidence: 0.85, support: 0.41, lift: 2.31, conviction: 2.5, category: 'Burnout', status: 'active', impact: 'high' },
  { id: 4, antecedent: 'Kepuasan Hidup Rendah & Aktivitas Fisik Rendah', consequent: 'Burnout Sedang', confidence: 0.81, support: 0.29, lift: 2.18, conviction: 2.1, category: 'Burnout', status: 'active', impact: 'medium' },
  { id: 5, antecedent: 'Ketidakpastian Pekerjaan & Konflik Peran', consequent: 'Stres Tinggi', confidence: 0.79, support: 0.35, lift: 2.05, conviction: 1.9, category: 'Stres', status: 'active', impact: 'medium' },
  { id: 6, antecedent: 'Mahasiswa Semester Akhir & Tugas Menumpuk', consequent: 'Burnout Tinggi', confidence: 0.87, support: 0.44, lift: 2.72, conviction: 3.0, category: 'Burnout', status: 'active', impact: 'high' },
  { id: 7, antecedent: 'Lingkungan Kerja Toksik & Feedback Negatif', consequent: 'Turnover Intention', confidence: 0.76, support: 0.25, lift: 2.42, conviction: 2.2, category: 'Organisasi', status: 'review', impact: 'medium' },
  { id: 8, antecedent: 'Kualitas Tidur Rendah & Pola Makan Buruk', consequent: 'Gangguan Psikosomatis', confidence: 0.83, support: 0.31, lift: 2.55, conviction: 2.7, category: 'Psikosomatis', status: 'active', impact: 'high' },
  { id: 9, antecedent: 'Dukungan Sosial Tinggi & Olahraga Teratur', consequent: 'Burnout Rendah', confidence: 0.91, support: 0.42, lift: 2.78, conviction: 3.1, category: 'Protektif', status: 'active', impact: 'high' },
  { id: 10, antecedent: 'Mindfulness Rutin & Work-Life Balance', consequent: 'Stres Rendah', confidence: 0.86, support: 0.36, lift: 2.48, conviction: 2.4, category: 'Protektif', status: 'active', impact: 'medium' },
  { id: 11, antecedent: 'Deadline Ketat & Multitasking Berlebih', consequent: 'Burnout Sedang', confidence: 0.73, support: 0.47, lift: 1.89, conviction: 1.6, category: 'Burnout', status: 'active', impact: 'medium' },
  { id: 12, antecedent: 'Perfeksionisme & Self-Criticism Tinggi', consequent: 'Anxiety & Burnout', confidence: 0.82, support: 0.28, lift: 2.35, conviction: 2.3, category: 'Psikologis', status: 'review', impact: 'low' },
];

const scatterRuleData = rulesData.map(r => ({ x: r.support, y: r.confidence, z: r.lift * 30, name: r.antecedent.substring(0, 30) + '...' }));
const categoryDist = [
  { name: 'Burnout', value: 4, color: '#ef4444' },
  { name: 'Psikosomatis', value: 2, color: '#f59e0b' },
  { name: 'Protektif', value: 2, color: '#22c55e' },
  { name: 'Stres', value: 1, color: '#3b82f6' },
  { name: 'Organisasi', value: 1, color: '#8b5cf6' },
  { name: 'Psikologis', value: 2, color: '#ec4899' },
];
const importanceData = rulesData.slice(0, 8).map(r => ({
  name: r.antecedent.length > 35 ? r.antecedent.substring(0, 35) + '...' : r.antecedent,
  lift: r.lift,
  confidence: r.confidence,
}));

const impactColor = { high: '#22c55e', medium: '#f59e0b', low: '#ef4444' };
const statusBadge: Record<string, { bg: string; c: string; label: string }> = {
  active:  { bg: 'rgba(34,197,94,0.12)', c: '#22c55e', label: 'Aktif' },
  inactive:{ bg: 'rgba(136,144,164,0.12)', c: '#8890a4', label: 'Nonaktif' },
  review:  { bg: 'rgba(245,158,11,0.12)', c: '#f59e0b', label: 'Review' },
};

export default function AnalitikRules() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'lift' | 'confidence' | 'support'>('lift');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const categories = useMemo(() => ['all', ...new Set(rulesData.map(r => r.category))], []);

  const filtered = useMemo(() => {
    let arr = [...rulesData];
    if (catFilter !== 'all') arr = arr.filter(r => r.category === catFilter);
    if (search) {
      const s = search.toLowerCase();
      arr = arr.filter(r => r.antecedent.toLowerCase().includes(s) || r.consequent.toLowerCase().includes(s));
    }
    arr.sort((a, b) => sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);
    return arr;
  }, [search, catFilter, sortKey, sortDir]);

  const stats = useMemo(() => ({
    total: rulesData.length,
    avgConf: (rulesData.reduce((s, r) => s + r.confidence, 0) / rulesData.length * 100).toFixed(0),
    avgSupp: (rulesData.reduce((s, r) => s + r.support, 0) / rulesData.length * 100).toFixed(0),
    avgLift: (rulesData.reduce((s, r) => s + r.lift, 0) / rulesData.length).toFixed(2),
    maxLift: Math.max(...rulesData.map(r => r.lift)).toFixed(2),
  }), []);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const s = (o: React.CSSProperties) => o as React.CSSProperties;

  return (
    <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #6c63ff, #3ecfcf)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Analitik & Rules</h1>
            <span style={{ background: 'rgba(108,99,255,0.15)', color: '#a89cff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>Association Rules</span>
          </div>
          <p style={{ color: '#8890a4', fontSize: 13, margin: '2px 0 0', maxWidth: 600 }}>
            Analisis aturan asosiasi dari data responden untuk mengidentifikasi pola prediktif burnout dan risiko psikosomatis
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ background: '#131722', border: '1px solid #1e2130', color: '#8890a4', padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={14} /> Refresh
          </button>
          <button style={{ background: 'linear-gradient(135deg, #6c63ff, #3ecfcf)', border: 'none', color: '#fff', padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lightbulb size={14} /> Generate Rules
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { icon: Layers, label: 'Total Rules', value: stats.total, color: '#6c63ff' },
          { icon: Percent, label: 'Avg Confidence', value: stats.avgConf + '%', color: '#22c55e' },
          { icon: Target, label: 'Avg Support', value: stats.avgSupp + '%', color: '#3ecfcf' },
          { icon: TrendingUp, label: 'Avg Lift', value: stats.avgLift, color: '#f59e0b' },
          { icon: Zap, label: 'Max Lift', value: stats.maxLift, color: '#ef4444' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 11, color: '#8890a4', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f1117', borderRadius: 8, padding: '7px 12px', flex: 1, border: '1px solid #1e2130' }}>
          <Search size={14} color="#8890a4" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari antecedent atau consequent..."
            style={{ background: 'none', border: 'none', color: '#e2e8f0', fontSize: 12, outline: 'none', flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0f1117', borderRadius: 8, padding: '5px 6px', border: '1px solid #1e2130' }}>
          <Filter size={14} color="#8890a4" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500,
                background: catFilter === cat ? 'rgba(108,99,255,0.18)' : 'transparent',
                color: catFilter === cat ? '#a89cff' : '#8890a4',
                transition: 'all 0.15s',
              }}
            >
              {cat === 'all' ? 'Semua' : cat}
            </button>
          ))}
        </div>
        <div style={{ color: '#4a5068', fontSize: 11 }}>{filtered.length} rules ditemukan</div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 12, marginBottom: 16 }}>
        {/* Rules Table */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Daftar Aturan Asosiasi</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button onClick={() => toggleSort('confidence')} style={s({ background: 'transparent', border: '1px solid #1e2130', color: sortKey === 'confidence' ? '#a89cff' : '#8890a4', padding: '5px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 })}>
                Confidence{sortKey === 'confidence' ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
              </button>
              <button onClick={() => toggleSort('support')} style={s({ background: 'transparent', border: '1px solid #1e2130', color: sortKey === 'support' ? '#a89cff' : '#8890a4', padding: '5px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 })}>
                Support{sortKey === 'support' ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
              </button>
              <button onClick={() => toggleSort('lift')} style={s({ background: 'transparent', border: '1px solid #1e2130', color: sortKey === 'lift' ? '#a89cff' : '#8890a4', padding: '5px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 })}>
                Lift{sortKey === 'lift' ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2130' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>#</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>Antecedent (IF)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>Consequent (THEN)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>Conf</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>Supp</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>Lift</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>Impact</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rule, i) => (
                  <tr key={rule.id} style={{ borderBottom: '1px solid #1a1d2a', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#181b28')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '11px 12px', color: '#4a5068', fontSize: 11 }}>{i + 1}</td>
                    <td style={{ padding: '11px 12px', color: '#c0c9e0', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ background: 'rgba(108,99,255,0.1)', color: '#a89cff', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                        {rule.antecedent}
                      </span>
                    </td>
                    <td style={{ padding: '11px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ArrowRight size={12} color="#6c63ff" />
                        <span style={{ background: 'rgba(62,207,207,0.1)', color: '#3ecfcf', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                          {rule.consequent}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>{(rule.confidence * 100).toFixed(0)}%</span>
                        <div style={{ width: 50, height: 3, background: '#1e2130', borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${rule.confidence * 100}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #3ecfcf)', borderRadius: 2 }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                      <span style={{ color: '#c0c9e0' }}>{(rule.support * 100).toFixed(0)}%</span>
                    </td>
                    <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                      <span style={{ color: rule.lift >= 2.5 ? '#22c55e' : rule.lift >= 2 ? '#f59e0b' : '#8890a4', fontWeight: 600 }}>
                        {rule.lift.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, background: impactColor[rule.impact] + '18', color: impactColor[rule.impact] }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: impactColor[rule.impact] }} />
                        {rule.impact === 'high' ? 'Tinggi' : rule.impact === 'medium' ? 'Sedang' : 'Rendah'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, background: statusBadge[rule.status].bg, color: statusBadge[rule.status].c }}>
                        {statusBadge[rule.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Rules Quality Distribution */}
          <div style={card}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Distribusi Kategori</h3>
            <ResponsiveContainer width="100%" height={160} minWidth={1} minHeight={1}>
              <PieChart>
                <Pie data={categoryDist} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {categoryDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {categoryDist.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#8890a4' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                  {c.name} ({c.value})
                </div>
              ))}
            </div>
          </div>

          {/* Top Rules by Lift */}
          <div style={{ ...card, flex: 1 }}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Top Rules by Lift</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rulesData.sort((a, b) => b.lift - a.lift).slice(0, 5).map((rule, i) => (
                <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #6c63ff, #3ecfcf)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11, color: '#c0c9e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {rule.antecedent.substring(0, 40)}...
                    </div>
                    <div style={{ fontSize: 10, color: '#8890a4', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ color: '#3ecfcf' }}>→ {rule.consequent}</span>
                      <span style={{ color: '#6c63ff', fontWeight: 600 }}>Lift: {rule.lift.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rule Confidence Distribution */}
          <div style={card}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Confidence Distribution</h3>
            <ResponsiveContainer width="100%" height={130} minWidth={1} minHeight={1}>
              <BarChart data={[
                { range: '70-80%', count: rulesData.filter(r => r.confidence >= 0.7 && r.confidence < 0.8).length },
                { range: '80-85%', count: rulesData.filter(r => r.confidence >= 0.8 && r.confidence < 0.85).length },
                { range: '85-90%', count: rulesData.filter(r => r.confidence >= 0.85 && r.confidence < 0.9).length },
                { range: '90%+', count: rulesData.filter(r => r.confidence >= 0.9).length },
              ]} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                <XAxis dataKey="range" tick={{ fill: '#8890a4', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8890a4', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#6c63ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Scatter + Importance Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Support vs Confidence Scatter */}
        <div style={card}>
          <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Support vs Confidence (bubble: Lift)</h3>
          <ResponsiveContainer width="100%" height={280} minWidth={1} minHeight={1}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
              <XAxis dataKey="x" type="number" name="Support" unit="%" domain={[0.2, 0.5]} tick={{ fill: '#8890a4', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="y" type="number" name="Confidence" unit="%" domain={[0.7, 1]} tick={{ fill: '#8890a4', fontSize: 10 }} axisLine={false} tickLine={false} />
              <ZAxis dataKey="z" range={[60, 400]} />
              <Tooltip
                contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }}
                formatter={(value: any, name: string) => [name === 'z' ? value.toFixed(2) : (value * 100).toFixed(0) + '%', name === 'x' ? 'Support' : name === 'y' ? 'Confidence' : 'Lift']}
              />
              <Scatter data={scatterRuleData} fill="#6c63ff" opacity={0.7}>
                {scatterRuleData.map((_, i) => (
                  <Cell key={i} fill={rulesData[i].lift >= 2.5 ? '#22c55e' : rulesData[i].lift >= 2 ? '#f59e0b' : '#6c63ff'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#8890a4' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} /> Lift &ge; 2.5
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#8890a4' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} /> Lift &ge; 2.0
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#8890a4' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#6c63ff' }} /> Lift &lt; 2.0
            </span>
          </div>
        </div>

        {/* Rule Importance Ranking */}
        <div style={card}>
          <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Rule Importance (Lift & Confidence)</h3>
          <ResponsiveContainer width="100%" height={280} minWidth={1} minHeight={1}>
            <BarChart data={importanceData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
              <XAxis type="number" domain={[0, 3.5]} tick={{ fill: '#8890a4', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={160} tick={{ fill: '#c0c9e0', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="lift" fill="#6c63ff" radius={[0, 4, 4, 0]} name="Lift" />
              <Bar dataKey="confidence" fill="#3ecfcf" radius={[0, 4, 4, 0]} name="Confidence" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
