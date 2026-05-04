import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Brain, ArrowRight } from 'lucide-react';
import api from '../api';

export default function UserKuisioner() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [orderType, setOrderType] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/assessment');
        setQuestions(res.data.questions || []);
        setOrderType(res.data.order_type);
        startTimeRef.current = Date.now();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleAnswer = (value: number) => {
    const reactionTime = Date.now() - startTimeRef.current;
    const currentQ = questions[currentIndex];
    
    const newResponses = [...responses, {
      id: currentQ.id,
      construct_type: currentQ.construct_type,
      value: value,
      reaction_time_ms: reactionTime
    }];
    
    setResponses(newResponses);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      startTimeRef.current = Date.now();
    } else {
      submitAssessment(newResponses);
    }
  };

  const submitAssessment = async (finalResponses: any[]) => {
    setSubmitting(true);
    try {
      const res = await api.post('/assessment/submit', {
        order_type: orderType,
        responses: finalResponses
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim hasil kuisioner.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #1e2538', borderTopColor: '#3ecfcf', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: '#8890a4', fontSize: 14 }}>Memuat kuisioner...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (submitting) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column', gap: 20 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #6c63ff22, #3ecfcf22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #2a3150', borderTopColor: '#6c63ff', animation: 'spin 1s linear infinite' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Quantum Engine sedang Menganalisis...</h2>
          <p style={{ color: '#8890a4', fontSize: 14 }}>Memproses pola respon dan reaction time Anda.</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div style={{ padding: '30px 40px', maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeSlideIn 0.5s ease' }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: 24, 
          background: 'linear-gradient(135deg, #3ecfcf, #6c63ff)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          boxShadow: '0 12px 32px rgba(108,99,255,0.4)', marginBottom: 24
        }}>
          <Brain size={40} color="#fff" />
        </div>
        
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#f8fafc', marginBottom: 12, textAlign: 'center', letterSpacing: '-0.5px' }}>
          Hasil Analisis Quantum
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 15, textAlign: 'center', maxWidth: 480, marginBottom: 40, lineHeight: 1.6 }}>
          Berdasarkan pola respon dan *reaction time* Anda, berikut adalah prediksi tingkat stres dan risiko *burnout* saat ini.
        </p>

        <div style={{ 
          width: '100%', 
          background: 'linear-gradient(145deg, #161b26, #12151f)', 
          borderRadius: 24, 
          border: '1px solid #1e2538', 
          padding: 32,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          {/* Risk Level Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 30 }}>
            <div style={{ 
              background: result.risk_level === 'High' || result.risk_level === 'Crisis' ? '#ef444422' : result.risk_level === 'Medium' ? '#f59e0b22' : '#22c55e22',
              color: result.risk_level === 'High' || result.risk_level === 'Crisis' ? '#ff6b6b' : result.risk_level === 'Medium' ? '#fbbf24' : '#4ade80',
              border: `1px solid ${result.risk_level === 'High' || result.risk_level === 'Crisis' ? '#ef444444' : result.risk_level === 'Medium' ? '#f59e0b44' : '#22c55e44'}`,
              padding: '8px 24px', borderRadius: 30, fontSize: 16, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase'
            }}>
              Risiko: {result.risk_level}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Burnout Score */}
            <div style={{ background: '#0d1017', borderRadius: 16, padding: 20, border: '1px solid #1e2538', textAlign: 'center' }}>
              <div style={{ color: '#8890a4', fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Skor Burnout
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>
                {result.burnout_score?.toFixed(1) || '0.0'}
                <span style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>/10</span>
              </div>
            </div>

            {/* Psychosomatic Risk */}
            <div style={{ background: '#0d1017', borderRadius: 16, padding: 20, border: '1px solid #1e2538', textAlign: 'center' }}>
              <div style={{ color: '#8890a4', fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Risiko Psikosomatis
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>
                {result.psychosomatic_score?.toFixed(1) || '0.0'}
                <span style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>/10</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/user/dashboard')}
          style={{
            marginTop: 40,
            background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
            color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 12,
            fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 8px 20px rgba(108,99,255,0.3)', transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Kembali ke Dashboard <ArrowRight size={18} />
        </button>

        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#8890a4' }}>
        Tidak ada pertanyaan yang tersedia saat ini.
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div style={{ padding: '30px 40px', maxWidth: 800, margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #6c63ff, #3ecfcf)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(108,99,255,0.3)' }}>
            <ClipboardList size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px 0' }}>Kuisioner Harian</h1>
            <p style={{ color: '#8890a4', fontSize: 13, margin: 0 }}>Cek kondisi mentalmu hari ini. Jawab dengan jujur dan spontan.</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ background: '#131722', borderRadius: 16, padding: '16px 20px', border: '1px solid #1e2538' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', fontWeight: 600, marginBottom: 10 }}>
            <span>Pertanyaan {currentIndex + 1} dari {questions.length}</span>
            <span>{Math.round(progress)}% Selesai</span>
          </div>
          <div style={{ width: '100%', background: '#1e2538', borderRadius: 8, height: 8, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(90deg, #6c63ff, #3ecfcf)', height: '100%', width: `${progress}%`, transition: 'width 0.4s ease-out', borderRadius: 8 }} />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div style={{ 
        flex: 1, 
        background: 'linear-gradient(180deg, #131722 0%, #0f1219 100%)', 
        borderRadius: 24, 
        border: '1px solid #1e2538', 
        padding: '50px 40px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(108,99,255,0.05) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        
        <h2 style={{ fontSize: 32, fontWeight: 700, color: '#f8fafc', textAlign: 'center', marginBottom: 50, lineHeight: 1.4, letterSpacing: '-0.5px' }}>
          {currentQ?.text}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[1, 2, 3, 4, 5].map((val) => {
            return (
              <button
                key={val}
                onClick={() => handleAnswer(val)}
                className="q-btn"
                style={{
                  background: '#1a1f2e',
                  border: '1px solid #2a3150',
                  borderRadius: 16,
                  padding: '24px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#e2e8f0'
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 800, color: val === 3 ? '#94a3b8' : (val < 3 ? '#ef4444' : '#22c55e') }}>
                  {val}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#8890a4', textAlign: 'center', height: 28 }}>
                  {val === 1 ? 'Sangat Tidak Setuju' : val === 5 ? 'Sangat Setuju' : val === 3 ? 'Netral' : ''}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <style>{`
        .q-btn:hover {
          background: #23293b !important;
          border-color: #3ecfcf !important;
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(62,207,207,0.15);
        }
      `}</style>

    </div>
  );
}
