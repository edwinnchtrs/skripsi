import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Assessment() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [orderType, setOrderType] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/assessment');
        setQuestions(res.data.questions);
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
      await api.post('/assessment/submit', {
        order_type: orderType,
        responses: finalResponses
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading assessment...</div>;
  if (submitting) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="text-6xl mb-8 animate-spin">🌀</div>
      <h2 className="text-[36px] font-serif mb-4">Quantum Engine Calculating...</h2>
      <p className="text-muted">Menganalisis interference effect dan reaction times Anda.</p>
    </div>
  );

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium mb-2 text-muted">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-hairline rounded-full h-1">
          <div className="bg-primary rounded-full h-1 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="card-cream text-center py-16 px-8">
        <h2 className="text-[28px] font-serif mb-12 leading-relaxed">{currentQ?.text}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              onClick={() => handleAnswer(val)}
              className="btn-secondary h-auto py-4 flex flex-col gap-2 hover:border-primary hover:text-primary transition-all"
            >
              <span className="text-2xl font-serif">{val}</span>
              <span className="text-xs opacity-70">
                {val === 1 ? 'Sangat Tidak Setuju' : val === 5 ? 'Sangat Setuju' : 'Netral'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
