
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { radarData } from './data';
import { card, sectionTitle } from './styles';

const metrics = [
  ['R² Score', '0.872'],
  ['Akurasi Klasifikasi', '92.7%'],
  ['MAE', '0.128'],
  ['RMSE', '0.176'],
  ['MAPE', '11.23%'],
];

export default function ModelPerformance() {
  return (
    <div style={card}>
      <div style={sectionTitle}>Model Performance</div>
      <ResponsiveContainer width="100%" height={190}>
        <RadarChart data={radarData} margin={{ top: 10, right: 28, left: 28, bottom: 0 }}>
          <PolarGrid stroke="#2a2e42" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#8890a4', fontSize: 9 }} />
          <Radar name="Model Saat Ini" dataKey="A" stroke="#6c63ff" fill="#6c63ff" fillOpacity={0.35} />
          <Radar name="Model Sebelumnya" dataKey="B" stroke="#3ecfcf" fill="#3ecfcf" fillOpacity={0.15} strokeDasharray="4 2" />
        </RadarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 8 }}>
        {[['#6c63ff','Model Saat Ini'],['#3ecfcf','Model Sebelumnya']].map(([c,l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#8890a4' }}>
            <span style={{ width: 8, height: 3, background: c, borderRadius: 2, display: 'inline-block' }} /> {l}
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {metrics.map(([k, v]) => (
          <div key={k} style={{ fontSize: 10, color: '#8890a4' }}>
            {k}: <span style={{ color: '#c0c9e0', fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
