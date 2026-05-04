
import { korelasi } from './data';
import { card, sectionTitle } from './styles';

export default function KorelasiChart() {
  const maxAbs = 1;
  return (
    <div style={card}>
      <div style={sectionTitle}>Korelasi Faktor terhadap Burnout Score</div>
      <div style={{ fontSize: 10, color: '#8890a4', marginBottom: 10 }}>Pearson (r)</div>
      {korelasi.map((k) => {
        const pct = Math.abs(k.value) / maxAbs * 100;
        const color = k.positive ? '#6c63ff' : '#ef4444';
        return (
          <div key={k.label} style={{ marginBottom: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#c0c9e0', marginBottom: 4 }}>
              <span>{k.label}</span>
              <span style={{ color, fontWeight: 600 }}>{k.value}</span>
            </div>
            <div style={{ background: '#1e2130', borderRadius: 4, height: 7, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, background: color, width: `${pct}%`, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
