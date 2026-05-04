import { useState, useEffect } from 'react';
import { Search, Filter, FileText, Send, AlertCircle, User as UserIcon } from 'lucide-react';
import api from '../api';

interface Responden {
  id: number;
  nama: string;
  username: string;
  latest_burnout: number;
  latest_risk: string;
  latest_psychosomatic: number;
  last_activity: string;
}

export default function Responden() {
  const [data, setData] = useState<Responden[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedResponden, setSelectedResponden] = useState<Responden | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchResponden();
  }, []);

  const fetchResponden = async () => {
    try {
      const res = await api.get('/responden');
      setData(res.data.respondents || []);
    } catch (err) {
      console.error('Error fetching respondents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(r => 
    r.nama.toLowerCase().includes(search.toLowerCase()) || 
    r.username.toLowerCase().includes(search.toLowerCase())
  );

  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case 'Crisis': return { color: '#ff4d4d', bg: 'rgba(255, 77, 77, 0.1)', border: 'rgba(255, 77, 77, 0.2)' };
      case 'High': return { color: '#ff944d', bg: 'rgba(255, 148, 77, 0.1)', border: 'rgba(255, 148, 77, 0.2)' };
      case 'Medium': return { color: '#ffcc00', bg: 'rgba(255, 204, 0, 0.1)', border: 'rgba(255, 204, 0, 0.2)' };
      case 'Low': return { color: '#00e676', bg: 'rgba(0, 230, 118, 0.1)', border: 'rgba(0, 230, 118, 0.2)' };
      default: return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.2)' };
    }
  };

  const openTreatmentLetter = (responden: Responden) => {
    setSelectedResponden(responden);
    setShowModal(true);
  };

  return (
    <div style={{ padding: '40px', color: '#f8fafc', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Data Responden
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '15px' }}>Pantau kesehatan mental dan kelola rekomendasi untuk seluruh pengguna.</p>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari responden..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: '#1e293b', border: '1px solid #334155', borderRadius: '14px',
                padding: '12px 16px 12px 48px', color: '#f8fafc', fontSize: '14px', width: '320px',
                outline: 'none', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            />
          </div>
          <button style={{ 
            background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', 
            padding: '0 20px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '10px', 
            cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1e293b'}
          >
            <Filter size={18} /> Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #1e293b', borderTopColor: '#6366f1', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
          {filteredData.map((responden) => {
            const risk = getRiskStyles(responden.latest_risk);
            return (
              <div 
                key={responden.id}
                style={{
                  background: '#1e293b',
                  borderRadius: '24px', border: '1px solid #334155', padding: '28px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  display: 'flex', flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = '#475569';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#334155';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '56px', height: '56px', borderRadius: '18px', 
                      background: 'linear-gradient(135deg, #334155, #1e293b)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid #475569'
                    }}>
                      <UserIcon size={28} color="#6366f1" />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{responden.nama}</h3>
                      <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 500 }}>{responden.username}</p>
                    </div>
                  </div>
                  <div style={{ 
                    padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 800,
                    background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`,
                    textTransform: 'uppercase', letterSpacing: '0.8px'
                  }}>
                    {responden.latest_risk || 'N/A'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                  <div style={{ background: '#0f172a', padding: '16px', borderRadius: '16px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>Burnout Score</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      {responden.latest_burnout?.toFixed(1) || '0.0'} 
                      <span style={{ fontSize: '14px', color: '#475569', fontWeight: 600 }}>/10</span>
                    </div>
                  </div>
                  <div style={{ background: '#0f172a', padding: '16px', borderRadius: '16px', border: '1px solid #1e2538' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>Psikosomatis</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      {responden.latest_psychosomatic?.toFixed(1) || '0.0'} 
                      <span style={{ fontSize: '14px', color: '#475569', fontWeight: 600 }}>/10</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => openTreatmentLetter(responden)}
                  style={{
                    width: '100%', background: '#6366f1', color: '#fff',
                    border: 'none', padding: '14px', borderRadius: '16px',
                    fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4f46e5';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#6366f1';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <FileText size={18} /> Berikan Penanganan
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Treatment Letter Modal */}
      {showModal && selectedResponden && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(2, 6, 23, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(12px)', padding: '20px'
        }}>
          <div style={{ 
            background: '#1e293b', width: '100%', maxWidth: '640px', borderRadius: '32px', border: '1px solid #334155',
            overflow: 'hidden', animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ padding: '32px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, #1e293b, #1e293b)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>Surat Rekomendasi</h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>Untuk responden: <span style={{ color: '#6366f1', fontWeight: 700 }}>{selectedResponden.nama}</span></p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: '#334155', border: 'none', color: '#cbd5e1', width: '36px', height: '36px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#475569'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#334155'}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '32px' }}>
              <div style={{ background: getRiskStyles(selectedResponden.latest_risk).bg, padding: '24px', borderRadius: '20px', border: `1px solid ${getRiskStyles(selectedResponden.latest_risk).border}`, marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <AlertCircle size={24} color={getRiskStyles(selectedResponden.latest_risk).color} />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>Analisis Risiko: {selectedResponden.latest_risk}</div>
                    <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                      Hasil asesmen menunjukkan tingkat kecemasan dan kelelahan yang perlu diperhatikan. Rekomendasi penanganan otomatis telah disiapkan di bawah ini.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Rencana Penanganan</label>
                <textarea 
                  placeholder="Tuliskan instruksi penanganan spesifik..."
                  style={{
                    width: '100%', height: '140px', background: '#0f172a', border: '1px solid #334155',
                    borderRadius: '20px', padding: '20px', color: '#f8fafc', fontSize: '15px', outline: 'none', resize: 'none',
                    lineHeight: 1.6, transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#334155'}
                  defaultValue={
                    selectedResponden.latest_risk === 'Crisis' ? 'Segera lakukan intervensi klinis. Responden menunjukkan tanda-tanda kelelahan ekstrem. Disarankan untuk istirahat total dan konsultasi psikolog/psikiater secepatnya.' :
                    selectedResponden.latest_risk === 'High' ? 'Rekomendasi sesi konseling 1-on-1. Perlu penyesuaian beban kerja dan pemantauan kondisi mental secara berkala setiap 3 hari.' :
                    'Sarankan untuk mengikuti program mindfulness atau manajemen stres mandiri. Tetap pantau perkembangan melalui kuis harian.'
                  }
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '16px', borderRadius: '18px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    alert('Surat rekomendasi telah berhasil dikirim!');
                    setShowModal(false);
                  }}
                  style={{ 
                    flex: 2, padding: '16px', borderRadius: '18px', border: 'none', 
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', 
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    transition: 'all 0.2s', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 20px rgba(99, 102, 241, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(99, 102, 241, 0.4)';
                  }}
                >
                  <Send size={20} /> Kirim Rekomendasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
