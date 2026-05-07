import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Brain, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0b0d14', fontFamily: 'Inter, sans-serif', padding: 24,
    }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse404 { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
        @keyframes glitch { 0%,100%{transform:translate(0)} 20%{transform:translate(-3px,2px)} 40%{transform:translate(3px,-1px)} 60%{transform:translate(-2px,-2px)} 80%{transform:translate(2px,1px)} }
        .float-anim { animation: float 3s ease-in-out infinite; }
        .pulse-anim { animation: pulse404 2s ease-in-out infinite; }
        .glitch-anim { animation: glitch 0.3s ease-in-out infinite; animation-play-state: paused; }
        .glitch-anim:hover { animation-play-state: running; }
      `}</style>

      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        {/* 404 Number */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <div style={{
            fontSize: 140, fontWeight: 900, lineHeight: 1,
            background: 'linear-gradient(135deg, #6c63ff 30%, #3ecfcf 70%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: -4,
          }} className="glitch-anim">
            404
          </div>
          {/* Shadow text */}
          <div style={{
            position: 'absolute', inset: 0, fontSize: 140, fontWeight: 900, lineHeight: 1,
            color: 'rgba(108,99,255,0.06)', letterSpacing: -4, userSelect: 'none', pointerEvents: 'none',
            filter: 'blur(4px)', transform: 'translateY(8px)',
          }}>
            404
          </div>
        </div>

        {/* Icon */}
        <div className="float-anim" style={{ marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(62,207,207,0.1))',
            border: '1px solid rgba(108,99,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Search size={32} color="#6c63ff" />
          </div>
        </div>

        <h2 style={{
          fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px',
          letterSpacing: -0.5,
        }}>
          Halaman Tidak Ditemukan
        </h2>
        <p style={{
          color: '#8890a4', fontSize: 13, lineHeight: 1.6, margin: '0 0 28px',
          maxWidth: 380, marginLeft: 'auto', marginRight: 'auto',
        }}>
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
          Mungkin Anda salah mengetik alamat atau halaman sudah tidak ada.
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
            borderRadius: 10, background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
            color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(108,99,255,0.25)',
          }}>
            <Home size={15} /> Beranda
          </Link>
          <button onClick={() => window.history.back()} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
            borderRadius: 10, background: '#131722', border: '1px solid #1e2130',
            color: '#8890a4', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>
            <ArrowLeft size={15} /> Kembali
          </button>
        </div>

        {/* Brand */}
        <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0.4 }}>
          <Brain size={14} color="#8890a4" />
          <span style={{ fontSize: 11, color: '#8890a4' }}>QC Analytics · Quantum Cognition</span>
        </div>
      </div>
    </div>
  );
}
