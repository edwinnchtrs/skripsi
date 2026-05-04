import { useState, useEffect } from 'react';
import { User as UserIcon, Search, TrendingUp, Zap, ShieldAlert, Clock, ArrowLeft } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../api';

interface Responden {
  id: number;
  nama: string;
  username: string;
}

interface Prediction {
  id: number;
  burnout_score: number;
  psychosomatic_score: number;
  risk_level: string;
  Timestamp: string;
  date?: string;
  score?: string;
  psycho?: string;
}

export default function PrediksiIndividu() {
  const [users, setUsers] = useState<Responden[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/responden');
      setUsers(res.data.respondents || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserHistory = async (id: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/responden/${id}/history`);
      // Convert timestamp to readable date for chart
      const formatted = (res.data.predictions || []).map((p: any) => ({
        ...p,
        date: new Date(p.Timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        score: p.burnout_score.toFixed(1),
        psycho: p.psychosomatic_score.toFixed(1)
      })).reverse(); // Reverse for chronological order in chart
      setHistory(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nama.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users.find(u => u.id === selectedUserId);
  const latest = history[history.length - 1];

  return (
    <div style={{ padding: '40px', color: '#f8fafc', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Prediksi Individu
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '15px' }}>Analisis mendalam tren kesehatan mental responden secara personal.</p>
      </div>

      {!selectedUserId ? (
        <div style={{ background: '#1e293b', borderRadius: '24px', border: '1px solid #334155', padding: '40px', textAlign: 'center' }}>
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <UserIcon size={32} color="#6366f1" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Pilih Responden</h2>
            <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px' }}>Cari dan pilih nama responden untuk melihat laporan analitik individu.</p>
            
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <Search size={18} color="#64748b" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Cari nama responden..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '14px',
                  padding: '14px 16px 14px 48px', color: '#f8fafc', fontSize: '14px', outline: 'none'
                }}
              />
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '14px', background: '#0f172a' }}>
              {filteredUsers.length > 0 ? filteredUsers.map(u => (
                <div 
                  key={u.id}
                  onClick={() => {
                    setSelectedUserId(u.id);
                    fetchUserHistory(u.id);
                  }}
                  style={{ 
                    padding: '14px 20px', textAlign: 'left', borderBottom: '1px solid #1e293b', 
                    cursor: 'pointer', transition: 'background 0.2s' 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1e293b'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.nama}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{u.username}</div>
                </div>
              )) : (
                <div style={{ padding: '20px', color: '#475569', fontSize: '14px' }}>Tidak ada responden ditemukan.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button 
            onClick={() => setSelectedUserId(null)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', 
              border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer', marginBottom: '24px' 
            }}
          >
            <ArrowLeft size={16} /> Kembali ke daftar
          </button>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #1e293b', borderTopColor: '#6366f1', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
            {/* Sidebar Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#1e293b', borderRadius: '24px', border: '1px solid #334155', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserIcon size={20} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>{selectedUser?.nama}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{selectedUser?.username}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#0f172a', padding: '16px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Risk Level</div>
                    <div style={{ 
                      fontSize: '16px', fontWeight: 800, 
                      color: latest?.risk_level === 'Crisis' ? '#ff4d4d' : latest?.risk_level === 'High' ? '#ff944d' : '#00e676'
                    }}>
                      {latest?.risk_level || 'No Data'}
                    </div>
                  </div>
                  <div style={{ background: '#0f172a', padding: '16px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Latest Score</div>
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>{latest?.burnout_score.toFixed(1) || '0.0'}</div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#1e293b', borderRadius: '24px', border: '1px solid #334155', padding: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Insights</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Zap size={16} color="#6366f1" />
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Tren burnout responden cenderung {history.length > 1 && history[history.length-1].burnout_score > history[history.length-2].burnout_score ? 'meningkat' : 'stabil'} dalam 5 asesmen terakhir.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <ShieldAlert size={16} color="#f59e0b" />
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Risiko psikosomatis tercatat {latest?.psychosomatic_score > 7 ? 'sangat tinggi' : 'pada level normal'}.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Chart */}
              <div style={{ background: '#1e293b', borderRadius: '24px', border: '1px solid #334155', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingUp size={20} color="#6366f1" /> Tren Skor Burnout & Psikosomatis
                  </h3>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} /> Burnout
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e676' }} /> Psikosomatis
                    </div>
                  </div>
                </div>

                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPsycho" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00e676" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
                      <Tooltip 
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="score" name="Burnout" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                      <Area type="monotone" dataKey="psycho" name="Psikosomatis" stroke="#00e676" strokeWidth={3} fillOpacity={1} fill="url(#colorPsycho)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* History Table */}
              <div style={{ background: '#1e293b', borderRadius: '24px', border: '1px solid #334155', padding: '32px' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={20} color="#6366f1" /> Riwayat Asesmen
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #334155' }}>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontWeight: 600 }}>Tanggal</th>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontWeight: 600 }}>Skor Burnout</th>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontWeight: 600 }}>Psikosomatis</th>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontWeight: 600 }}>Status Risiko</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '16px 12px' }}>{p.date}</td>
                          <td style={{ padding: '16px 12px', fontWeight: 700 }}>{p.burnout_score.toFixed(1)}</td>
                          <td style={{ padding: '16px 12px' }}>{p.psychosomatic_score.toFixed(1)}</td>
                          <td style={{ padding: '16px 12px' }}>
                            <span style={{ 
                              padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                              background: p.risk_level === 'Crisis' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(0, 230, 118, 0.1)',
                              color: p.risk_level === 'Crisis' ? '#ff4d4d' : '#00e676'
                            }}>
                              {p.risk_level}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
    </div>
  );
}
