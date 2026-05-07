import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, Brain, ArrowRight, Loader2, Sparkles,
  CheckCircle2, Clock, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Minus, Shield, Lightbulb
} from 'lucide-react';
import api from '../api';
import { card } from './dashboard/styles';

interface Question {
  id: string;
  text: string;
  construct_type: string;
}

interface Result {
  risk_level: string;
  burnout_score: number;
  psychosomatic_score: number;
  prediction_id: number;
}

const labels = ['Sangat Tidak Setuju', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju'];

export default function UserKuisioner() {
  const nav = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [orderType, setOrderType] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [prevPrediction, setPrevPrediction] = useState<{ burnout: number; psycho: number; risk: string } | null>(null);
  const [selectedVal, setSelectedVal] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assessment');
      setQuestions(res.data.questions || []);
      setOrderType(res.data.order_type);
      startRef.current = Date.now();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAnswer = (value: number) => {
    if (animating) return;
    setSelectedVal(value);
    setAnimating(true);

    const rt = Date.now() - startRef.current;
    const q = questions[currentIdx];
    const newR = [...responses, { id: q.id, construct_type: q.construct_type, value, reaction_time_ms: rt }];
    setResponses(newR);

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setSelectedVal(null);
        setAnimating(false);
        startRef.current = Date.now();
      } else {
        submitAssessment(newR);
      }
    }, 350);
  };

  const goBack = () => {
    if (currentIdx > 0 && !animating) {
      setResponses(responses.slice(0, -1));
      setCurrentIdx(currentIdx - 1);
      setSelectedVal(null);
      startRef.current = Date.now();
    }
  };

  const submitAssessment = async (finalR: any[]) => {
    setSubmitting(true);
    try {
      // Fetch previous prediction for comparison BEFORE submitting new one
      let prev: { burnout: number; psycho: number; risk: string } | null = null;
      try {
        const histRes = await api.get('/user/history');
        const preds = histRes.data.predictions || [];
        if (preds.length > 0) {
          prev = { burnout: preds[0].BurnoutScore, psycho: preds[0].PsychosomaticScore, risk: preds[0].RiskLevel };
        }
      } catch {}

      const res = await api.post('/assessment/submit', { order_type: orderType, responses: finalR });
      setPrevPrediction(prev);
      setResult(res.data);
      setSubmitting(false);
    } catch (e) {
      console.error(e);
      alert('Gagal mengirim hasil kuisioner. Silakan coba lagi.');
      setSubmitting(false);
    }
  };

  const progress = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0;

  const riskColor = (r: string) =>
    r === 'High' || r === 'Crisis' ? '#ef4444' : r === 'Medium' ? '#f59e0b' : '#22c55e';

  const riskLabel = (r: string) =>
    r === 'High' || r === 'Crisis' ? 'Tinggi' : r === 'Medium' ? 'Sedang' : 'Rendah';

  const typeIcon = (t: string) => {
    if (t === 'fatigue') return { icon: '😴', label: 'Kelelahan' };
    if (t === 'cynicism') return { icon: '😤', label: 'Sinisme' };
    return { icon: '💪', label: 'Efikasi' };
  };

  // Loading
  if (loading) {
    return (
      <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={28} color="#8890a4" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <div style={{ color: '#8890a4', fontSize: 13 }}>Menyiapkan pertanyaan hari ini...</div>
        </div>
      </div>
    );
  }

  // Submitting (only show if no result yet)
  if (submitting && !result) {
    return (
      <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(62,207,207,0.2))', border: '1px solid rgba(108,99,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Loader2 size={28} color="#a89cff" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>Menganalisis Respon</h2>
          <p style={{ color: '#8890a4', fontSize: 13 }}>Quantum engine sedang memproses pola jawabanmu...</p>
        </div>
      </div>
    );
  }

  // Result (must be before submitting to avoid stuck state)
  if (result) {
    const color = riskColor(result.risk_level);
    const burnoutScore = result.burnout_score || 0;
    const psychoScore = result.psychosomatic_score || 0;
    const gaugePercent = Math.min(burnoutScore / 10 * 100, 100);
    const diff = prevPrediction ? burnoutScore - prevPrediction.burnout : 0;
    const trendIcon = Math.abs(diff) < 0.3 ? Minus : diff > 0 ? TrendingUp : TrendingDown;
    const trendColor = Math.abs(diff) < 0.3 ? '#8890a4' : diff > 0 ? '#ef4444' : '#22c55e';
    const trendLabel = Math.abs(diff) < 0.3 ? 'Stabil' : diff > 0 ? `Naik ${diff.toFixed(1)}` : `Turun ${Math.abs(diff).toFixed(1)}`;

    const recommendations = result.risk_level === 'High' || result.risk_level === 'Crisis'
      ? ['Segera konsultasi dengan psikolog', 'Kurangi beban kerja berlebih', 'Latihan pernapasan & meditasi harian', 'Perbanyak istirahat dan tidur cukup']
      : result.risk_level === 'Medium'
        ? ['Pantau kondisi secara berkala', 'Jaga work-life balance', 'Olahraga ringan 3x seminggu', 'Bicarakan dengan teman terpercaya']
        : ['Pertahankan pola hidup sehat', 'Tetap jaga work-life balance', 'Lanjutkan olahraga rutin', 'Apresiasi diri sendiri'];

    return (
      <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes gaugeFill { from{stroke-dasharray:0 314} }
          .result-anim { animation: fadeUp 0.5s ease-out; }
          .result-anim-d1 { animation: fadeUp 0.5s ease-out both; animation-delay: 0.1s; }
          .result-anim-d2 { animation: fadeUp 0.5s ease-out both; animation-delay: 0.2s; }
          .result-anim-d3 { animation: fadeUp 0.5s ease-out both; animation-delay: 0.3s; }
          .gauge-ring { animation: gaugeFill 1s ease-out; }
        `}</style>

        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Success Header */}
          <div className="result-anim" style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #22c55e, #3ecfcf)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 28px rgba(34,197,94,0.35)' }}>
              <CheckCircle2 size={30} color="#fff" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>Analisis Selesai!</h2>
            <p style={{ color: '#8890a4', fontSize: 13, margin: 0 }}>
              Quantum Cognition + Regresi Linier — data tersimpan di database
            </p>
          </div>

          {/* Main Card: Gauge + Scores */}
          <div className="result-anim-d1" style={{ ...card, marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, alignItems: 'center' }}>
              {/* Gauge */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto' }}>
                  <svg viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="65" cy="65" r="56" fill="none" stroke="#1e2130" strokeWidth="10" />
                    <circle className="gauge-ring" cx="65" cy="65" r="56" fill="none" stroke={`url(#rg)`} strokeWidth="10"
                      strokeDasharray={`${352 * gaugePercent / 100} 352`} strokeLinecap="round" />
                    <defs>
                      <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 30, fontWeight: 800, color }}>{burnoutScore.toFixed(1)}</span>
                    <span style={{ fontSize: 10, color: '#8890a4' }}>/ 10</span>
                  </div>
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ padding: '4px 14px', borderRadius: 14, fontSize: 11, fontWeight: 700, background: color + '15', color, border: `1px solid ${color}30` }}>
                    {riskLabel(result.risk_level)}
                  </span>
                </div>
              </div>

              {/* Scores + Trend */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div style={{ padding: '14px', background: '#0f1117', borderRadius: 10, border: '1px solid #1e2130' }}>
                    <div style={{ fontSize: 10, color: '#8890a4', marginBottom: 4 }}>Skor Burnout</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0' }}>{burnoutScore.toFixed(1)}<span style={{ fontSize: 12, color: '#4a5068' }}>/10</span></div>
                    <div style={{ fontSize: 10, color: '#8890a4', marginTop: 2 }}>Regresi Linier</div>
                  </div>
                  <div style={{ padding: '14px', background: '#0f1117', borderRadius: 10, border: '1px solid #1e2130' }}>
                    <div style={{ fontSize: 10, color: '#8890a4', marginBottom: 4 }}>Psikosomatis</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0' }}>{psychoScore.toFixed(1)}<span style={{ fontSize: 12, color: '#4a5068' }}>/10</span></div>
                    <div style={{ fontSize: 10, color: '#8890a4', marginTop: 2 }}>Quantum × 1.5</div>
                  </div>
                </div>

                {/* Previous Comparison */}
                {prevPrediction && (
                  <div style={{ padding: '10px 14px', background: '#0f1117', borderRadius: 10, border: '1px solid #1e2130', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: '#8890a4' }}>vs Sebelumnya ({prevPrediction.burnout.toFixed(1)})</span>
                    <trendIcon size={14} color={trendColor} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: trendColor }}>{trendLabel}</span>
                    {prevPrediction.risk !== result.risk_level && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: '#f59e0b' }}>
                        Risk berubah: {riskLabel(prevPrediction.risk)} → {riskLabel(result.risk_level)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Algorithm Breakdown + Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {/* How it works */}
            <div className="result-anim-d2" style={card}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Brain size={14} color="#6c63ff" /> Cara Kerja Analisis
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { step: '1', title: 'Quantum Cognition', desc: 'Interference score dihitung dari variansi reaction time jawaban Anda', color: '#a855f7' },
                  { step: '2', title: 'Regresi Linier', desc: 'Formula: 0.4F + 0.3C + 0.2(5−E) + 0.1I + 2.0S → skor burnout', color: '#3ecfcf' },
                  { step: '3', title: 'Klasifikasi Risiko', desc: `Skor ${burnoutScore.toFixed(1)} → ${riskLabel(result.risk_level)} (${result.risk_level === 'High' ? '>7.5' : result.risk_level === 'Medium' ? '4-6' : '<4'})`, color },
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: s.color + '18', border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: s.color }}>{s.step}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#c0c9e0' }}>{s.title}</div>
                      <div style={{ fontSize: 10, color: '#8890a4', lineHeight: 1.4 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="result-anim-d2" style={card}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lightbulb size={14} color="#f59e0b" /> Rekomendasi
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recommendations.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130', fontSize: 11, color: '#c0c9e0' }}>
                    <Shield size={12} color={color} style={{ flexShrink: 0 }} />
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score Bar */}
          <div className="result-anim-d3" style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#8890a4' }}>Level Burnout</span>
              <span style={{ fontSize: 11, fontWeight: 600, color }}>{burnoutScore.toFixed(1)} / 10</span>
            </div>
            <div style={{ height: 10, background: '#1e2130', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: `${gaugePercent}%`, height: '100%', borderRadius: 5,
                background: 'linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)',
                backgroundSize: '200% 100%', backgroundPosition: `${100 - gaugePercent}% 0`,
                transition: 'width 1s ease' }} />
              {/* Threshold markers */}
              <div style={{ position: 'absolute', top: 0, left: '40%', width: 1, height: '100%', background: '#f59e0b60' }} />
              <div style={{ position: 'absolute', top: 0, left: '75%', width: 1, height: '100%', background: '#ef444460' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 9, color: '#22c55e' }}>Rendah (0-4)</span>
              <span style={{ fontSize: 9, color: '#f59e0b' }}>Sedang (4-7.5)</span>
              <span style={{ fontSize: 9, color: '#ef4444' }}>Tinggi (7.5-10)</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={() => nav('/user/dashboard')} style={{
              flex: 1, padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              Lihat Dashboard <ArrowRight size={15} />
            </button>
            <button onClick={() => { setResult(null); setCurrentIdx(0); setResponses([]); setSelectedVal(null); setPrevPrediction(null); startRef.current = Date.now(); }} style={{
              padding: '12px 20px', borderRadius: 10, background: '#131722', border: '1px solid #1e2130',
              color: '#8890a4', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>
              Ulangi Kuisioner
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No questions
  if (questions.length === 0) {
    return (
      <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#8890a4' }}>
          <ClipboardList size={36} color="#4a5068" />
          <div style={{ marginTop: 12 }}>Belum ada pertanyaan. Coba lagi nanti.</div>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const ti = typeIcon(q.construct_type);

  return (
    <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        .q-slide { animation: slideUp 0.3s ease-out; }
        .btn-pulse { animation: pulse 0.35s ease; }
      `}</style>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #6c63ff, #3ecfcf)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Kuisioner Harian</h1>
            <p style={{ color: '#8890a4', fontSize: 12, margin: '2px 0 0' }}>
              {questions.length} pertanyaan — AI-generated · {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(168,85,247,0.1)', padding: '4px 10px', borderRadius: 14, fontSize: 10, color: '#c4b5fd' }}>
            <Sparkles size={11} /> AI
          </span>
        </div>

        {/* Progress */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#8890a4', fontWeight: 500 }}>
              Pertanyaan {currentIdx + 1} / {questions.length}
            </span>
            <span style={{ fontSize: 12, color: '#a89cff', fontWeight: 600 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 6, background: '#1e2130', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #6c63ff, #3ecfcf)', borderRadius: 3, transition: 'width 0.4s' }} />
          </div>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'center' }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i < currentIdx ? '#6c63ff' : i === currentIdx ? '#a89cff' : '#1e2130',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* Question Card */}
        <div className="q-slide" key={q.id} style={{ ...card, padding: 28 }}>
          {/* Category badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <span style={{
              padding: '4px 10px', borderRadius: 10, fontSize: 10, fontWeight: 600,
              background: q.construct_type === 'fatigue' ? 'rgba(239,68,68,0.1)' : q.construct_type === 'cynicism' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
              color: q.construct_type === 'fatigue' ? '#f87171' : q.construct_type === 'cynicism' ? '#fbbf24' : '#4ade80',
              border: `1px solid ${q.construct_type === 'fatigue' ? 'rgba(239,68,68,0.2)' : q.construct_type === 'cynicism' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
            }}>
              {ti.icon} {ti.label}
            </span>
            <Clock size={11} color="#4a5068" />
            <span style={{ fontSize: 10, color: '#4a5068' }}>Jawab spontan</span>
          </div>

          {/* Question Text */}
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.5, margin: '0 0 28px', minHeight: 60 }}>
            {q.text}
          </h2>

          {/* Scale buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(val => {
              const isSelected = selectedVal === val;
              const accent = val <= 2 ? '#ef4444' : val === 3 ? '#f59e0b' : '#22c55e';
              return (
                <button
                  key={val}
                  onClick={() => handleAnswer(val)}
                  disabled={animating}
                  className={isSelected ? 'btn-pulse' : ''}
                  style={{
                    padding: '16px 8px', borderRadius: 14, cursor: 'pointer', border: 'none',
                    background: isSelected ? accent + '20' : '#0f1117',
                    border: isSelected ? `2px solid ${accent}60` : '1px solid #1e2130',
                    color: isSelected ? accent : '#8890a4',
                    transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transform: isSelected ? 'translateY(-3px)' : 'none',
                  }}
                  onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#1a1e2e', e.currentTarget.style.borderColor = '#2a2e42')}
                  onMouseLeave={e => !isSelected && (e.currentTarget.style.background = '#0f1117', e.currentTarget.style.borderColor = '#1e2130')}
                >
                  <span style={{ fontSize: 24, fontWeight: 800 }}>{val}</span>
                  <span style={{ fontSize: 9, whiteSpace: 'nowrap', textAlign: 'center', lineHeight: 1.3 }}>
                    {labels[val - 1]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Back button */}
          {currentIdx > 0 && (
            <button onClick={goBack} disabled={animating} style={{
              marginTop: 14, padding: '7px 14px', borderRadius: 8, background: 'transparent',
              border: '1px solid #1e2130', color: '#8890a4', fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <ChevronLeft size={13} /> Kembali
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
