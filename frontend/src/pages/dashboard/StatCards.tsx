
import { Users, Brain, AlertTriangle, Target, BarChart2 } from 'lucide-react';
import { card } from './styles';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  badge?: string;
  badgeColor?: string;
  accent: string;
  Icon: React.ElementType;
  miniChart?: React.ReactNode;
}

function StatCard({ label, value, sub, badge, badgeColor, accent, Icon, miniChart }: StatCardProps) {
  return (
    <div style={{ ...card, flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#8890a4', fontSize: 11, marginBottom: 6 }}>{label}</div>
          <div style={{ color: '#e2e8f0', fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: '#8890a4', marginTop: 4 }}>{sub}</div>}
          {badge && (
            <span style={{
              fontSize: 10, color: badgeColor || '#f59e0b',
              background: (badgeColor || '#f59e0b') + '22',
              padding: '2px 8px', borderRadius: 20, marginTop: 6, display: 'inline-block',
            }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: accent + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={18} color={accent} />
        </div>
      </div>
      {miniChart && <div style={{ marginTop: 10 }}>{miniChart}</div>}
    </div>
  );
}

export default function StatCards() {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <StatCard label="Total Responden" value="1.256" sub="↓12.5% dari bulan lalu" accent="#6c63ff" Icon={Users} />
      <StatCard label="Rata-rata Burnout Score" value="62.4 /100" sub="+8.1% dari bulan lalu" badge="Tingkat Sedang" badgeColor="#f59e0b" accent="#f59e0b" Icon={Brain} />
      <StatCard label="Risiko Psikomatis Tinggi" value="256 (20.4%)" sub="+8.1% dari bulan lalu" accent="#ef4444" Icon={AlertTriangle} />
      <StatCard label="Akurasi Model" value="92.7%" badge="Sangat Baik" badgeColor="#22c55e" accent="#22c55e" Icon={Target} />
      <StatCard label="Prediksi Dilakukan" value="3.847" sub="Total prediksi" accent="#3ecfcf" Icon={BarChart2} />
    </div>
  );
}
