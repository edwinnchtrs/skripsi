import { useState, useEffect } from 'react';
import api from '../api';

export default function Gosip() {
  const [curhats, setCurhats] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCurhats = async () => {
    try {
      const res = await api.get('/gosip');
      setCurhats(res.data.curhats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurhats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    try {
      await api.post('/curhat/submit', { text });
      setText('');
      fetchCurhats();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <header className="text-center">
        <h1 className="text-[48px] font-serif mb-4">Ruang Gosip Sehat</h1>
        <p className="text-body-strong text-lg max-w-xl mx-auto">
          Bagikan beban pikiran Anda secara anonim. Engine NLP kami akan menganalisis tren stres kolektif tanpa mengungkap identitas Anda.
        </p>
      </header>

      <div className="card-dark">
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full bg-surface-darkElevated text-onDark border border-surface-darkSoft rounded-lg p-4 h-32 focus:outline-none focus:ring-1 focus:ring-primary mb-4"
            placeholder="Apa yang membuat Anda merasa tertekan hari ini?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          ></textarea>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary bg-primary hover:bg-primary-active">Kirim Curhatan</button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <h3 className="font-serif text-2xl mb-6">Curhatan Terbaru</h3>
        {loading ? (
          <div>Loading feed...</div>
        ) : (
          curhats.map((curhat) => (
            <div key={curhat.ID} className="card-cream p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-surface-creamStrong flex items-center justify-center text-sm">👻</div>
                  <span className="font-medium text-sm">Anonim</span>
                </div>
                <span className="text-xs text-muted">
                  {new Date(curhat.Timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-body-md leading-relaxed mb-4">{curhat.Text}</p>
              <div className="flex gap-4 pt-4 border-t border-hairline">
                <button className="text-sm font-medium text-muted hover:text-primary transition-colors flex items-center gap-1">
                  ❤️ Peluk Virtual
                </button>
                <button className="text-sm font-medium text-muted hover:text-primary transition-colors flex items-center gap-1">
                  🏆 Semangat
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
