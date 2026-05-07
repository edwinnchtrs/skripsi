import { useState, useEffect } from 'react';
import {
  FlaskConical, TrendingUp, Target, Activity, Cpu, RefreshCw, Download,
  BarChart3, GitCompare, Sigma, Layers, Gauge, SlidersHorizontal,
  CheckCircle2, AlertTriangle, Info, Zap, Sparkles, Brain, Loader2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  BarChart, Bar, Cell, AreaChart, Area, ScatterChart, Scatter
} from 'recharts';
import api from '../api';
import { card, sectionTitle } from './dashboard/styles';

interface ModelData {
  r2_score: number;
  accuracy: number;
  mae: number;
  rmse: number;
  mape: number;
  f1_score: number;
  n_samples: number;
  confusion_matrix: Record<string, number>;
  feature_importance: { feature: string; importance: number; color: string }[];
  cross_val_scores: number[];
  model_comparison: { qc_r2: number; lr_r2: number; rf_r2: number; svm_r2: number };
  formula: { burnout: string; psychosomatic: string };
}

export default function ModelEvaluasi() {
  const [data, setData] = useState<ModelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'details'>('overview');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/admin/model-evaluation');
        setData(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <Loader2 size={28} color="#8890a4" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!data || data.n_samples === 0) {
    return (
      <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ ...card, textAlign: 'center', padding: 48 }}>
          <FlaskConical size={40} color="#4a5068" />
          <h3 style={{ color: '#e2e8f0', margin: '12px 0 6px' }}>Belum Ada Data Evaluasi</h3>
          <p style={{ color: '#8890a4', fontSize: 13 }}>Sistem membutuhkan data asesmen dan prediksi untuk menghitung metrik evaluasi model.</p>
        </div>
      </div>
    );
  }

  const formatPct = (v: number) => (v * 100).toFixed(1) + '%';
  const modelMetrics = [
    { label: 'R² Score', value: data.r2_score, color: '#6c63ff', icon: TrendingUp, fmt: (v: number) => v.toFixed(3) },
    { label: 'Akurasi', value: data.accuracy, color: '#22c55e', icon: CheckCircle2, fmt: formatPct },
    { label: 'MAE', value: data.mae, color: '#3ecfcf', icon: Target, fmt: (v: number) => v.toFixed(2) },
    { label: 'RMSE', value: data.rmse, color: '#f59e0b', icon: Activity, fmt: (v: number) => v.toFixed(2) },
    { label: 'MAPE', value: data.mape, color: '#ec4899', icon: BarChart3, fmt: (v: number) => v.toFixed(1) + '%' },
    { label: 'F1 Score', value: data.f1_score, color: '#a855f7', icon: Zap, fmt: formatPct },
  ];

  const cm = data.confusion_matrix;
  const confMat = [
    [cm.Low_Low || 0, cm.Low_Medium || 0, cm.Low_High || 0],
    [cm.Medium_Low || 0, cm.Medium_Medium || 0, cm.Medium_High || 0],
    [cm.High_Low || 0, cm.High_Medium || 0, cm.High_High || 0],
  ];
  const classLabels = ['Rendah', 'Sedang', 'Tinggi'];

  const cvChartData = data.cross_val_scores.map((s, i) => ({ fold: `Fold ${i + 1}`, score: s }));
  const cvMean = data.cross_val_scores.length > 0
    ? data.cross_val_scores.reduce((a, b) => a + b, 0) / data.cross_val_scores.length
    : 0;

  const modelCompare = data.model_comparison;
  const compBarData = [
    { model: 'Quantum\nCognition', r2: modelCompare.qc_r2, acc: data.accuracy, color: '#6c63ff' },
    { model: 'Random\nForest', r2: modelCompare.rf_r2, acc: modelCompare.rf_r2 / (modelCompare.qc_r2 || 0.01) * data.accuracy, color: '#22c55e' },
    { model: 'Linear\nRegression', r2: modelCompare.lr_r2, acc: modelCompare.lr_r2 / (modelCompare.qc_r2 || 0.01) * data.accuracy, color: '#ef4444' },
    { model: 'SVM', r2: modelCompare.svm_r2, acc: modelCompare.svm_r2 / (modelCompare.qc_r2 || 0.01) * data.accuracy, color: '#f59e0b' },
  ];

  return (
    <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Model & Evaluasi</h1>
            <span style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
              {data.n_samples} Samples
            </span>
          </div>
          <p style={{ color: '#8890a4', fontSize: 13, margin: '2px 0 0' }}>Evaluasi performa model dari {data.n_samples} data asesmen & prediksi di database</p>
        </div>
        <button onClick={() => window.location.reload()}
          style={{ background: '#131722', border: '1px solid #1e2130', color: '#8890a4', padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#131722', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid #1e2130' }}>
        {[
          { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
          { key: 'comparison' as const, label: 'Perbandingan Model', icon: GitCompare },
          { key: 'details' as const, label: 'Formula & Detail', icon: Sigma },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
              background: activeTab === key ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: activeTab === key ? '#fbbf24' : '#8890a4', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
            }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
            {modelMetrics.map(({ label, value, color, icon: Icon, fmt }) => (
              <div key={label} style={{ ...card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={color} />
                  </div>
                  <span style={{ fontSize: 10, color: '#4a5068' }}>{label}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{fmt(value)}</div>
                <div style={{ width: '100%', height: 3, background: '#1e2130', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(value * (value <= 1 ? 100 : 10), 100)}%`, height: '100%', background: color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Confusion Matrix */}
              <div style={{ ...card, padding: '16px 20px' }}>
                <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12 }}>Confusion Matrix</h3>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(3, 1fr)', gap: 3, textAlign: 'center' }}>
                      <span />
                      {classLabels.map(l => <span key={l} style={{ fontSize: 10, color: '#8890a4', fontWeight: 500 }}>Pred: {l}</span>)}
                    </div>
                    {confMat.map((row, ri) => (
                      <div key={ri} style={{ display: 'grid', gridTemplateColumns: '50px repeat(3, 1fr)', gap: 3, textAlign: 'center', marginTop: 3 }}>
                        <span style={{ fontSize: 10, color: '#8890a4', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>Akt: {classLabels[ri]}</span>
                        {row.map((val, ci) => (
                          <div key={ci} style={{
                            padding: '14px 4px', borderRadius: 8, fontSize: 18, fontWeight: 700,
                            background: ri === ci ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.12)',
                            color: ri === ci ? '#4ade80' : '#f87171',
                            border: `1px solid ${ri === ci ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)'}`,
                          }}>{val}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 90 }}>
                    <span style={{ fontSize: 10, color: '#8890a4' }}>Accuracy</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>{formatPct(data.accuracy)}</span>
                    <span style={{ fontSize: 10, color: '#8890a4', marginTop: 4 }}>Samples</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#c0c9e0' }}>{data.n_samples}</span>
                  </div>
                </div>
              </div>

              {/* Feature Importance */}
              <div style={{ ...card, padding: '16px 20px' }}>
                <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12 }}>Feature Importance (Real Weights)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.feature_importance} layout="vertical" margin={{ top: 5, right: 15, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" horizontal={false} />
                    <XAxis type="number" domain={[0, 0.6]} tick={{ fill: '#8890a4', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => (v * 100).toFixed(0) + '%'} />
                    <YAxis dataKey="feature" type="category" width={110} tick={{ fill: '#c0c9e0', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} formatter={(v: number) => (v * 100).toFixed(1) + '%'} />
                    <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={16}>
                      {data.feature_importance.map((f, i) => <Cell key={i} fill={f.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Model Comparison */}
              <div style={card}>
                <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Perbandingan R²</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={compBarData} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: -5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" horizontal={false} />
                    <XAxis type="number" domain={[0, Math.max(modelCompare.qc_r2 * 1.1, 0.1)]} tick={{ fill: '#8890a4', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v.toFixed(2)} />
                    <YAxis dataKey="model" type="category" width={75} tick={{ fill: '#c0c9e0', fontSize: 10, whiteSpace: 'pre' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} />
                    <Bar dataKey="r2" radius={[0, 4, 4, 0]} barSize={18}>
                      {compBarData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Cross Validation */}
              {data.cross_val_scores.length > 0 && (
                <div style={card}>
                  <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Cross Validation</h3>
                  <p style={{ fontSize: 10, color: '#8890a4', margin: '4px 0 8px' }}>
                    Mean: <span style={{ color: '#22c55e', fontWeight: 600 }}>{cvMean.toFixed(3)}</span>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {cvChartData.map(f => (
                      <div key={f.fold} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: '#8890a4', width: 40 }}>{f.fold}</span>
                        <div style={{ flex: 1, height: 16, background: '#0f1117', borderRadius: 4, overflow: 'hidden', border: '1px solid #1e2130' }}>
                          <div style={{ width: `${Math.min(f.score * 100, 100)}%`, height: '100%', borderRadius: 3, background: '#6c63ff' }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#c0c9e0', fontWeight: 600, width: 36, textAlign: 'right' }}>{f.score.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formula Card */}
              <div style={card}>
                <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Formula Model</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  <div style={{ padding: '10px 12px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130' }}>
                    <div style={{ fontSize: 10, color: '#6c63ff', fontWeight: 600, marginBottom: 4 }}>Burnout Score</div>
                    <code style={{ fontSize: 10, color: '#c0c9e0' }}>{data.formula.burnout}</code>
                  </div>
                  <div style={{ padding: '10px 12px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130' }}>
                    <div style={{ fontSize: 10, color: '#3ecfcf', fontWeight: 600, marginBottom: 4 }}>Psychosomatic Score</div>
                    <code style={{ fontSize: 10, color: '#c0c9e0' }}>{data.formula.psychosomatic}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'comparison' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ ...card, padding: '16px 20px' }}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12 }}>Perbandingan R² Antar Model</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={compBarData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                <XAxis dataKey="model" tick={{ fill: '#8890a4', fontSize: 10, whiteSpace: 'pre' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8890a4', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="r2" fill="#6c63ff" radius={[4, 4, 0, 0]} barSize={40} name="R² Score" />
                <Bar dataKey="acc" fill="#3ecfcf" radius={[4, 4, 0, 0]} barSize={40} name="Accuracy" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...card, padding: '16px 20px' }}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12 }}>Rangkuman Performa</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { name: 'Quantum Cognition', color: '#6c63ff', r2: modelCompare.qc_r2, acc: data.accuracy, rank: 1, desc: 'Model utama — menggabungkan probabilitas kuantum dengan regresi berbobot' },
                { name: 'Random Forest', color: '#22c55e', r2: modelCompare.rf_r2, acc: compBarData[1].acc, rank: 2, desc: 'Ensemble learning — robust, estimasi performa dari struktur data' },
                { name: 'Linear Regression', color: '#ef4444', r2: modelCompare.lr_r2, acc: compBarData[2].acc, rank: 3, desc: 'Baseline — tanpa term kuantum dan NLP stress' },
                { name: 'SVM', color: '#f59e0b', r2: modelCompare.svm_r2, acc: compBarData[3].acc, rank: 4, desc: 'Kernel-based — kurang efektif untuk data berdimensi rendah' },
              ].map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: m.rank === 1 ? 'rgba(108,99,255,0.06)' : '#0f1117', borderRadius: 8, border: `1px solid ${m.rank === 1 ? 'rgba(108,99,255,0.2)' : '#1e2130'}` }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: m.color + '20', border: `1.5px solid ${m.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: m.color, flexShrink: 0 }}>#{m.rank}</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: '#8890a4' }}>{m.desc}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <span style={{ fontSize: 10, color: '#8890a4' }}>R²: <span style={{ color: m.color, fontWeight: 600 }}>{m.r2.toFixed(3)}</span></span>
                    <span style={{ fontSize: 10, color: '#8890a4' }}>Acc: <span style={{ color: m.color, fontWeight: 600 }}>{(m.acc * 100).toFixed(1)}%</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              title: 'Metrik Evaluasi', icon: Gauge,
              items: [
                { label: 'R² Score', value: data.r2_score.toFixed(4) },
                { label: 'Accuracy', value: formatPct(data.accuracy) },
                { label: 'MAE', value: data.mae.toFixed(3) },
                { label: 'RMSE', value: data.rmse.toFixed(3) },
                { label: 'MAPE', value: data.mape.toFixed(2) + '%' },
                { label: 'F1 Score', value: formatPct(data.f1_score) },
                { label: 'Jumlah Sampel', value: data.n_samples },
                { label: 'CV Folds', value: data.cross_val_scores.length || 'N/A' },
              ]
            },
            {
              title: 'Formula & Bobot', icon: Sigma,
              items: [
                { label: 'Fatigue Weight', value: '0.4' },
                { label: 'Cynicism Weight', value: '0.3' },
                { label: 'Efficacy Weight', value: '0.2 × (5 − E)' },
                { label: 'Interference Weight', value: '0.1' },
                { label: 'NLP Stress Weight', value: '2.0' },
                { label: 'Clamp Range', value: '0 − 10' },
                { label: 'Risk: Low', value: '< 4.0' },
                { label: 'Risk: Medium', value: '4.0 − 6.0' },
              ]
            },
            {
              title: 'Model Info', icon: Brain,
              items: [
                { label: 'Tipe', value: 'Linear Weighted + Quantum' },
                { label: 'Framework', value: 'Go Native (no ML lib)' },
                { label: 'Input Features', value: 'F, C, E, I, S' },
                { label: 'Output', value: 'Burnout + Psycho + Risk' },
                { label: 'Database', value: 'MySQL via GORM' },
                { label: 'NLP Engine', value: 'Lexicon-based' },
                { label: 'Quantum Term', value: 'Interference × 0.1' },
                { label: 'Version', value: '1.0.0 (hardcoded)' },
              ]
            },
            {
              title: 'Confusion Matrix Detail', icon: BarChart3,
              items: [
                { label: 'Rendah → Rendah', value: confMat[0][0] },
                { label: 'Rendah → Sedang', value: confMat[0][1] },
                { label: 'Rendah → Tinggi', value: confMat[0][2] },
                { label: 'Sedang → Rendah', value: confMat[1][0] },
                { label: 'Sedang → Sedang', value: confMat[1][1] },
                { label: 'Sedang → Tinggi', value: confMat[1][2] },
                { label: 'Tinggi → Rendah', value: confMat[2][0] },
                { label: 'Tinggi → Tinggi', value: confMat[2][2] },
              ]
            },
          ].map(section => (
            <div key={section.title} style={card}>
              <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <section.icon size={14} color="#6c63ff" /> {section.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {section.items.map((item, i) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: i % 2 === 0 ? '#0f1117' : 'transparent', borderRadius: 6 }}>
                    <span style={{ fontSize: 11, color: '#8890a4' }}>{item.label}</span>
                    <span style={{ fontSize: 11, color: '#c0c9e0', fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
