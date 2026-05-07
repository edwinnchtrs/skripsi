import { useNavigate } from 'react-router-dom';
import { card, sectionTitle } from '../dashboard/styles';
import { ClipboardList, ArrowRight, Sparkles } from 'lucide-react';

interface DailyQuestionnaireProps {
  onSubmitSuccess?: () => void;
}

export default function DailyQuestionnaire({ onSubmitSuccess }: DailyQuestionnaireProps) {
  const nav = useNavigate();

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Sparkles size={13} color="#a855f7" />
        <div style={{ ...sectionTitle, margin: 0 }}>Kuisioner Harian</div>
      </div>

      <p style={{ fontSize: 11, color: '#8890a4', margin: '0 0 16px', lineHeight: 1.5 }}>
        Kuisioner berbasis AI dengan pertanyaan baru setiap hari. Menggunakan model <strong style={{ color: '#a89cff' }}>Quantum Cognition</strong> + <strong style={{ color: '#3ecfcf' }}>Regresi Linier</strong> untuk menganalisis tingkat burnout dan risiko psikosomatis Anda.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {[
          { icon: '🧠', text: '10 pertanyaan AI-generated baru setiap hari' },
          { icon: '⏱️', text: 'Analisis quantum + reaction time tracking' },
          { icon: '📊', text: 'Hasil prediksi burnout & psikosomatis' },
          { icon: '🔔', text: 'Notifikasi otomatis setelah analisis selesai' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#c0c9e0' }}>
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => nav('/user/kuisioner')}
        style={{
          width: '100%', padding: '11px', borderRadius: 10,
          background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
          border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 4px 16px rgba(108,99,255,0.3)',
        }}>
        <ClipboardList size={15} />
        Mulai Kuisioner Hari Ini
        <ArrowRight size={15} />
      </button>

      <p style={{ fontSize: 10, color: '#4a5068', textAlign: 'center', marginTop: 10 }}>
        Hasil otomatis tersimpan & tampil di dashboard
      </p>
    </div>
  );
}
