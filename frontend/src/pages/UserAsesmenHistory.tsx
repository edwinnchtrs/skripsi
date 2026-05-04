import { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  BrainCircuit, 
  AlertTriangle 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import api from '../api';

interface Prediction {
  ID: number;
  Timestamp: string;
  BurnoutScore: number;
  PsychosomaticScore: number;
  RiskLevel: string;
}

interface Assessment {
  ID: number;
  Timestamp: string;
  OrderType: string;
  FatigueScore: number;
  CynicismScore: number;
  EfficacyScore: number;
  InterferenceScore: number;
}

export default function UserAsesmenHistory() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/history');
      if (response.data) {
        const sortedPredictions = (response.data.predictions || []).sort((a: Prediction, b: Prediction) => 
          new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime()
        );
        setPredictions(sortedPredictions);
      }
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const chartData = predictions.map(p => ({
    date: new Date(p.Timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    Burnout: p.BurnoutScore,
    Psikosomatis: p.PsychosomaticScore
  }));

  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': 
        return { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.3)', icon: <ShieldAlert size={14} /> };
      case 'medium': 
        return { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', border: 'rgba(234, 179, 8, 0.3)', icon: <AlertTriangle size={14} /> };
      case 'high': 
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)', icon: <AlertTriangle size={14} /> };
      default: 
        return { bg: 'rgba(136, 144, 164, 0.15)', text: '#94a3b8', border: 'rgba(136, 144, 164, 0.3)', icon: <Activity size={14} /> };
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -10, background: '#3ecfcf', filter: 'blur(20px)', opacity: 0.5, borderRadius: '50%' }}></div>
            <Activity className="animate-spin" size={32} color="#3ecfcf" style={{ position: 'relative', zIndex: 1 }} />
          </div>
          <span style={{ fontWeight: 500, letterSpacing: 0.5, color: '#e2e8f0' }}>Memuat Data Riwayat...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto', color: '#f8fafc' }}>
      
      {/* Header Section */}
      <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ 
          width: 56, 
          height: 56, 
          borderRadius: 16, 
          background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)'
        }}>
          <Activity size={28} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px', color: '#f8fafc', textShadow: '0 2px 10px rgba(255,255,255,0.1)' }}>
            Riwayat Asesmen
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 15, fontWeight: 400 }}>
            Pantau perkembangan tingkat kelelahan dan risiko psikosomatis Anda.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
        
        {/* Trend Card with AreaChart */}
        <div style={{ 
          background: 'linear-gradient(145deg, rgba(30, 33, 48, 0.9), rgba(22, 25, 37, 0.95))', 
          borderRadius: 20, 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          padding: 32,
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
            <div style={{ padding: 8, background: 'rgba(167, 139, 250, 0.15)', borderRadius: 10 }}>
              <TrendingUp size={20} color="#a78bfa" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f8fafc' }}>Tren Tingkat Burnout & Psikosomatis</h3>
          </div>
          
          {chartData.length > 0 ? (
            <div style={{ height: 400, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <defs>
                    <linearGradient id="colorBurnout" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPsikosomatis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={13} tickMargin={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={13} tickFormatter={(value) => `${value.toFixed(1)}`} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 17, 23, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: 12, 
                      color: '#fff',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(8px)'
                    }}
                    itemStyle={{ color: '#fff', fontSize: 14, fontWeight: 500 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 24 }} iconType="circle" />
                  <Area 
                    type="monotone" 
                    name="Skor Burnout"
                    dataKey="Burnout" 
                    stroke="#f43f5e" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorBurnout)" 
                    activeDot={{ r: 7, stroke: '#1e2130', strokeWidth: 2 }} 
                  />
                  <Area 
                    type="monotone" 
                    name="Skor Psikosomatis"
                    dataKey="Psikosomatis" 
                    stroke="#0ea5e9" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorPsikosomatis)" 
                    activeDot={{ r: 7, stroke: '#1e2130', strokeWidth: 2 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)' }}>
              <TrendingUp size={32} opacity={0.5} style={{ marginBottom: 12 }} />
              Belum ada data historis yang cukup untuk menampilkan tren.
            </div>
          )}
        </div>

        {/* History Table Card */}
        <div style={{ 
          background: 'linear-gradient(145deg, rgba(30, 33, 48, 0.9), rgba(22, 25, 37, 0.95))', 
          borderRadius: 20, 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          overflow: 'hidden',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, background: 'rgba(34, 197, 94, 0.15)', borderRadius: 10 }}>
              <Clock size={20} color="#4ade80" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f8fafc' }}>Log Asesmen Terakhir</h3>
          </div>
          
          <div style={{ overflowX: 'auto', padding: '0 16px 16px 16px' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0 24px 8px 24px', fontWeight: 600, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tanggal Asesmen</th>
                  <th style={{ padding: '0 24px 8px 24px', fontWeight: 600, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Skor Burnout</th>
                  <th style={{ padding: '0 24px 8px 24px', fontWeight: 600, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Skor Psikosomatis</th>
                  <th style={{ padding: '0 24px 8px 24px', fontWeight: 600, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tingkat Risiko</th>
                </tr>
              </thead>
              <tbody>
                {predictions.slice().reverse().map((pred) => {
                  const badge = getRiskBadge(pred.RiskLevel);
                  return (
                    <tr key={pred.ID} 
                        style={{ 
                          background: 'rgba(255,255,255,0.02)', 
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                          cursor: 'default',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }}>
                      <td style={{ padding: '18px 24px', fontSize: 15, borderRadius: '12px 0 0 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e2e8f0', fontWeight: 500 }}>
                          <BrainCircuit size={16} color="#64748b" />
                          {formatDate(pred.Timestamp)}
                        </div>
                      </td>
                      <td style={{ padding: '18px 24px', fontSize: 16, fontWeight: 600, color: '#f43f5e' }}>
                        {pred.BurnoutScore.toFixed(2)}
                      </td>
                      <td style={{ padding: '18px 24px', fontSize: 16, fontWeight: 600, color: '#0ea5e9' }}>
                        {pred.PsychosomaticScore.toFixed(2)}
                      </td>
                      <td style={{ padding: '18px 24px', borderRadius: '0 12px 12px 0' }}>
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 8,
                          background: badge.bg, 
                          color: badge.text, 
                          border: `1px solid ${badge.border}`,
                          padding: '6px 14px', 
                          borderRadius: 20, 
                          fontSize: 13, 
                          fontWeight: 700,
                          letterSpacing: 0.5
                        }}>
                          {badge.icon}
                          {pred.RiskLevel.toUpperCase()}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                
                {predictions.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.01)', borderRadius: 12 }}>
                      <Activity size={32} opacity={0.3} style={{ margin: '0 auto 12px' }} />
                      Belum ada riwayat asesmen yang dikerjakan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
