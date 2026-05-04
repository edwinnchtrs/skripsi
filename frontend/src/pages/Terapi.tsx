import { useState, useEffect } from 'react';
import api from '../api';

export default function Terapi() {
  const [riskLevel, setRiskLevel] = useState('Low');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerapi = async () => {
      try {
        const res = await api.get('/terapi');
        setRiskLevel(res.data.risk_level);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTerapi();
  }, []);

  if (loading) return <div className="p-8">Loading modules...</div>;

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-[48px] font-serif mb-4">Warung Terapi</h1>
        <p className="text-body-strong text-lg">
          Modul intervensi yang disesuaikan dengan kondisi mental Anda.
        </p>
      </header>

      <div className="bg-primary text-onPrimary rounded-xl p-8 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium tracking-widest uppercase mb-2">Status Risiko Anda</h2>
          <div className="text-3xl font-serif">{riskLevel}</div>
        </div>
        <div className="text-4xl">
          {riskLevel === 'Crisis' ? '🆘' : riskLevel === 'High' ? '⚠️' : riskLevel === 'Medium' ? '⚖️' : '🌿'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-cream">
          <div className="text-3xl mb-4">🧘</div>
          <h3 className="text-xl font-medium mb-3">Mindfulness Micro-session</h3>
          <p className="text-body-md mb-6">Latihan pernapasan 3 menit untuk menurunkan detak jantung dan mengurangi interference effect.</p>
          <button className="btn-secondary w-full">Mulai Sesi</button>
        </div>

        {(riskLevel === 'High' || riskLevel === 'Crisis') && (
          <div className="card-dark border border-red-500/30">
            <div className="text-3xl mb-4">👨‍⚕️</div>
            <h3 className="text-xl font-medium mb-3 text-onDark">Konseling Profesional</h3>
            <p className="text-onDark-soft mb-6">Skor burnout Anda menunjukkan butuh penanganan ahli. Segera jadwalkan sesi dengan psikolog kami.</p>
            <button className="btn-primary w-full bg-red-600 hover:bg-red-700 text-white">Jadwalkan Konseling</button>
          </div>
        )}

        {(riskLevel === 'Medium' || riskLevel === 'High') && (
          <div className="card-cream">
            <div className="text-3xl mb-4">📝</div>
            <h3 className="text-xl font-medium mb-3">Cognitive Restructuring</h3>
            <p className="text-body-md mb-6">Jurnal interaktif untuk mengelola ekspektasi berlebih dan mengurangi sinisme.</p>
            <button className="btn-secondary w-full">Buka Jurnal</button>
          </div>
        )}
      </div>
    </div>
  );
}
