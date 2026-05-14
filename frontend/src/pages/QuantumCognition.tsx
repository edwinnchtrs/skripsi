import { useState, useEffect } from 'react';
import {
  Brain, Atom, Gauge, Orbit, Split, ArrowLeftRight, Dna,
  Sparkles, Loader2, TrendingUp, Zap, Info
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  AreaChart, Area, LineChart, Line
} from 'recharts';
import ChartShell from '../components/ChartShell';
import api from '../api';
import { card, sectionTitle } from './dashboard/styles';

interface QuantumData {
  total_assessments: number;
  total_predictions: number;
  interference_avg: number;
  interference_min: number;
  interference_max: number;
  superposition: { alpha: number; beta: number; gamma: number };
  order_effects: OrderEffect[];
  contextuality_index: number;
  entanglement_degree: number;
  score_distribution: ScoreDist[];
}

interface OrderEffect {
  order_type: string;
  count: number;
  avg_fatigue: number;
  avg_cynicism: number;
  avg_efficacy: number;
  avg_interference: number;
}

interface ScoreDist {
  label: string;
  count: number;
  pct: number;
}

const conceptCards = [
  {
    icon: Orbit, title: 'Superposisi Kuantum', color: '#6c63ff',
    desc: 'Responden berada dalam superposisi state burnout sebelum pengukuran. State kolaps saat kuesioner dijawab.',
    formula: '|ψ⟩ = α|Rendah⟩ + β|Sedang⟩ + γ|Tinggi⟩',
  },
  {
    icon: Split, title: 'Interferensi Kuantum', color: '#3ecfcf',
    desc: 'Urutan pertanyaan mempengaruhi hasil akhir melalui interferensi konstruktif/destruktif.',
    formula: 'P = |ψ_A|² + |ψ_B|² + 2|ψ_A||ψ_B|cos(θ)',
  },
  {
    icon: ArrowLeftRight, title: 'Kontekstualitas', color: '#22c55e',
    desc: 'Jawaban bergantung pada konteks pertanyaan sebelumnya — model kuantum menangkap dependensi ini.',
    formula: 'P(A|context) ≠ P(A|context′)',
  },
  {
    icon: Dna, title: 'Entanglement', color: '#f59e0b',
    desc: 'Dimensi burnout (F, C, E) saling terkait secara non-lokal — perubahan satu mempengaruhi yang lain.',
    formula: 'I(F:C:E) > I(F)+I(C)+I(E)',
  },
];

export default function QuantumCognition() {
  const [data, setData] = useState<QuantumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeConcept, setActiveConcept] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/admin/quantum');
        if (res.data.message) { setError(res.data.message); return; }
        setData(res.data);
      } catch { setError('Gagal memuat data kuantum'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <Loader2 size={28} color="#8890a4" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ ...card, textAlign: 'center', padding: 48 }}>
          <Atom size={40} color="#4a5068" />
          <h3 style={{ color: '#e2e8f0', margin: '12px 0 6px' }}>Belum Ada Data Kuantum</h3>
          <p style={{ color: '#8890a4', fontSize: 13 }}>{error || 'Sistem membutuhkan data asesmen untuk menganalisis quantum cognition. Ajak responden menyelesaikan asesmen.'}</p>
        </div>
      </div>
    );
  }

  const s = data.superposition;
  const qParams = [
    { label: 'Interference Score', value: data.interference_avg, desc: 'Rata-rata interferensi kuantum', color: '#6c63ff' },
    { label: 'Superposition α|Rendah⟩', value: s.alpha, desc: 'Amplitudo state rendah', color: '#3ecfcf' },
    { label: 'Contextuality Index', value: data.contextuality_index, desc: 'Dependensi konteks', color: '#22c55e' },
    { label: 'Entanglement Degree', value: data.entanglement_degree, desc: 'Keterkaitan F/C/E', color: '#f59e0b' },
  ];

  const radarData = [
    { metric: 'Interferensi', kuantum: Math.min(data.interference_avg * 60, 95), klasik: 18, fullMark: 100 },
    { metric: 'Kontekstualitas', kuantum: data.contextuality_index * 100, klasik: 22, fullMark: 100 },
    { metric: 'Superposisi', kuantum: Math.max(s.alpha, s.beta, s.gamma) * 100, klasik: 45, fullMark: 100 },
    { metric: 'Entanglement', kuantum: data.entanglement_degree * 100, klasik: 30, fullMark: 100 },
    { metric: 'Order Effects', kuantum: Math.min(data.order_effects.length * 20 + data.contextuality_index * 50, 94), klasik: 34, fullMark: 100 },
  ];

  const probDist = [
    { state: 'Rendah', q: (data.score_distribution.find(d => d.label === 'Rendah')?.pct || 0) / 100, c: 0.42 },
    { state: 'Sedang', q: (data.score_distribution.find(d => d.label === 'Sedang')?.pct || 0) / 100, c: 0.33 },
    { state: 'Tinggi', q: (data.score_distribution.find(d => d.label === 'Tinggi')?.pct || 0) / 100, c: 0.25 },
  ];

  const orderChartData = data.order_effects.map((oe, i) => ({
    order: `Order #${i + 1}\n(${oe.count} asesmen)`,
    fatigue: oe.avg_fatigue,
    cynicism: oe.avg_cynicism,
    efficacy: oe.avg_efficacy,
    interference: oe.avg_interference,
  }));

  return (
    <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #a855f7, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Atom size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Quantum Cognition</h1>
            <span style={{ background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
              {data.total_assessments} Asesmen · {data.total_predictions} Prediksi
            </span>
          </div>
          <p style={{ color: '#8890a4', fontSize: 13, margin: '2px 0 0', maxWidth: 640 }}>
            Pemodelan kognisi berbasis probabilitas kuantum — data real dari {data.total_assessments} asesmen responden
          </p>
        </div>
      </div>

      {/* Quantum Parameter Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {qParams.map(({ label, value, desc, color }) => (
          <div key={label} style={{ ...card, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#8890a4', fontWeight: 500 }}>{label}</span>
              <Info size={13} color="#4a5068" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value.toFixed(2)}</div>
            <div style={{ width: '100%', height: 4, background: '#1e2130', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(value * 100, 100)}%`, height: '100%', background: color, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 10, color: '#8890a4', lineHeight: 1.4 }}>{desc}</span>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 12, marginBottom: 16 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Probability Distribution */}
          <div style={{ ...card, padding: '16px 20px' }}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12 }}>Distribusi Probabilitas |ψ⟩² (Real Data)</h3>
            <ChartShell height={190}>
              <BarChart data={probDist} margin={{ top: 5, right: 10, bottom: 5, left: -15 }} barSize={32} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
                <XAxis dataKey="state" tick={{ fill: '#8890a4', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8890a4', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} tickFormatter={v => (v * 100).toFixed(0) + '%'} />
                <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} formatter={(v: number) => (v * 100).toFixed(1) + '%'} />
                <Bar dataKey="c" fill="#4a5068" radius={[4, 4, 0, 0]} name="Klasik (Expected)" />
                <Bar dataKey="q" fill="#6c63ff" radius={[4, 4, 0, 0]} name="Kuantum (Actual)" />
              </BarChart>
            </ChartShell>
          </div>

          {/* Interference Pattern */}
          <div style={{ ...card, padding: '16px 20px' }}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12 }}>Pola Interferensi Kuantum (μ={data.interference_avg.toFixed(2)})</h3>
            <ChartShell height={200}>
              <AreaChart data={Array.from({ length: 24 }, (_, i) => ({
                angle: i * 15,
                amplitude: Math.abs(Math.sin(i * data.interference_avg * 0.4 + 0.8) * 0.7 + Math.cos(i * 0.31) * 0.3),
              }))} margin={{ top: 10, right: 10, bottom: 5, left: -15 }}>
                <defs>
                  <linearGradient id="ig2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6c63ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                <XAxis dataKey="angle" tick={{ fill: '#8890a4', fontSize: 10 }} tickFormatter={a => a + '°'} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8890a4', fontSize: 10 }} domain={[-1, 1]} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} />
                <Area type="monotone" dataKey="amplitude" stroke="#a855f7" strokeWidth={2} fill="url(#ig2)" name="Amplitudo" />
              </AreaChart>
            </ChartShell>
          </div>

          {/* Order Effects (only if multiple orders exist) */}
          {data.order_effects.length > 1 && (
            <div style={{ ...card, padding: '16px 20px' }}>
              <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12 }}>Efek Urutan Pertanyaan ({data.order_effects.length} variasi)</h3>
              <ChartShell height={220}>
                <BarChart data={orderChartData} margin={{ top: 10, right: 10, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                  <XAxis dataKey="order" tick={{ fill: '#8890a4', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8890a4', fontSize: 10 }} domain={[0, 5]} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="fatigue" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} name="Fatigue" />
                  <Bar dataKey="cynicism" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} name="Cynicism" />
                  <Bar dataKey="efficacy" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={16} name="Efficacy" />
                </BarChart>
              </ChartShell>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Radar Comparison */}
          <div style={card}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Kuantum vs Klasik</h3>
            <ChartShell height={240}>
              <RadarChart data={radarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <PolarGrid stroke="#1e2130" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#8890a4', fontSize: 9 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#8890a4', fontSize: 9 }} axisLine={false} />
                <Radar dataKey="klasik" stroke="#ef4444" fill="#ef4444" fillOpacity={0.08} name="Klasik" />
                <Radar dataKey="kuantum" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="Kuantum" />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </RadarChart>
            </ChartShell>
          </div>

          {/* Superposition States */}
          <div style={card}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Superposisi State |ψ⟩</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {[
                { label: 'α |Rendah⟩', value: s.alpha, color: '#22c55e' },
                { label: 'β |Sedang⟩', value: s.beta, color: '#f59e0b' },
                { label: 'γ |Tinggi⟩', value: s.gamma, color: '#ef4444' },
              ].map(st => (
                <div key={st.label} style={{ padding: '10px 12px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#c0c9e0', fontFamily: 'monospace' }}>{st.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{(st.value * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 5, background: '#1e2130', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${st.value * 100}%`, height: '100%', background: st.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(108,99,255,0.06)', borderRadius: 6, border: '1px solid rgba(108,99,255,0.1)' }}>
              <span style={{ fontSize: 10, color: '#8890a4', fontFamily: 'monospace' }}>
                |ψ⟩ = √{s.alpha.toFixed(2)}|R⟩ + √{s.beta.toFixed(2)}|S⟩ + √{s.gamma.toFixed(2)}|T⟩
              </span>
            </div>
          </div>

          {/* Score Distribution */}
          <div style={card}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Distribusi Skor Real</h3>
            {data.score_distribution.map(d => {
              const c = d.label === 'Rendah' ? '#22c55e' : d.label === 'Sedang' ? '#f59e0b' : '#ef4444';
              return (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#8890a4', width: 48 }}>{d.label}</span>
                  <div style={{ flex: 1, height: 20, background: '#0f1117', borderRadius: 4, overflow: 'hidden', border: '1px solid #1e2130' }}>
                    <div style={{ width: `${d.pct}%`, height: '100%', background: c, borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#c0c9e0', width: 50, textAlign: 'right' }}>{d.count} ({d.pct.toFixed(0)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quantum Concepts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {conceptCards.map(({ icon: Icon, title, color, desc, formula }, i) => (
          <div key={title} onClick={() => setActiveConcept(i)}
            style={{
              ...card, padding: '18px', cursor: 'pointer',
              border: activeConcept === i ? `1.5px solid ${color}40` : '1px solid #1e2130',
              background: activeConcept === i ? `linear-gradient(135deg, ${color}10, #131722)` : '#131722',
              transition: 'all 0.2s', transform: activeConcept === i ? 'translateY(-2px)' : 'none',
              boxShadow: activeConcept === i ? `0 4px 20px ${color}12` : 'none',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} color={color} />
              </div>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{title}</h4>
            </div>
            <p style={{ fontSize: 11, color: '#8890a4', lineHeight: 1.6, margin: '0 0 12px' }}>{desc}</p>
            <div style={{ background: '#0f1117', borderRadius: 6, padding: '8px 12px', border: '1px solid #1e2130', fontFamily: 'monospace', fontSize: 11, color, overflowX: 'auto', whiteSpace: 'nowrap' }}>
              {formula}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
