import { useState } from 'react';
import { card, sectionTitle } from '../dashboard/styles';
import { questionsPool } from './userData';

export default function DailyQuestionnaire() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  
  // Ambil 3 pertanyaan acak (untuk mockup kita ambil 3 pertama)
  const todaysQuestions = questionsPool.slice(0, 3);

  const handleAnswer = (score: number) => {
    setAnswers([...answers, score]);
    if (currentQuestionIndex < todaysQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsCompleted(true);
      // Di sini nanti bisa panggil API untuk submit hasil
    }
  };

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
      <div style={sectionTitle}>Kuisioner Harian</div>
      
      {isCompleted ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#22c55e22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>🎉</span>
          </div>
          <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Terima kasih!</div>
          <div style={{ color: '#8890a4', fontSize: 11, textAlign: 'center' }}>Data Anda telah dicatat untuk analisis hari ini.</div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, color: '#8890a4', marginBottom: 12 }}>
            Pertanyaan {currentQuestionIndex + 1} dari {todaysQuestions.length}
          </div>
          <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500, marginBottom: 24, lineHeight: 1.4 }}>
            {todaysQuestions[currentQuestionIndex]}
          </div>
          
          <div style={{ marginTop: 'auto', display: 'flex', gap: 8, flexDirection: 'column' }}>
            {[
              { label: 'Sangat Buruk / Sering', score: 1, color: '#ef4444' },
              { label: 'Buruk / Lumayan', score: 2, color: '#f59e0b' },
              { label: 'Biasa Saja', score: 3, color: '#3ecfcf' },
              { label: 'Baik / Jarang', score: 4, color: '#6c63ff' },
              { label: 'Sangat Baik / Tidak Pernah', score: 5, color: '#22c55e' }
            ].map((opt) => (
              <button
                key={opt.score}
                onClick={() => handleAnswer(opt.score)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${opt.color}40`,
                  padding: '8px 12px',
                  borderRadius: 8,
                  color: '#e2e8f0',
                  fontSize: 12,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = `${opt.color}15`)}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
