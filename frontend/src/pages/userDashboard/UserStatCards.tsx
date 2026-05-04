import { Activity, Zap, BrainCircuit, CalendarCheck } from 'lucide-react';
import { card } from '../dashboard/styles';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  Icon: React.ElementType;
}

function StatCard({ label, value, sub, accent, Icon }: StatCardProps) {
  return (
    <div style={{ ...card, flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#8890a4', fontSize: 11, marginBottom: 6 }}>{label}</div>
          <div style={{ color: '#e2e8f0', fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: '#8890a4', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: accent + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={18} color={accent} />
        </div>
      </div>
    </div>
  );
}

export default function UserStatCards() {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <StatCard label="Tingkat Stres Saat Ini" value="Sedang" sub="Sedikit naik dari kemarin" accent="#f59e0b" Icon={Activity} />
      <StatCard label="Level Energi" value="75%" sub="Optimal" accent="#22c55e" Icon={Zap} />
      <StatCard label="Skor Burnout Terakhir" value="42.5" sub="Batas aman" accent="#3ecfcf" Icon={BrainCircuit} />
      <StatCard label="Streak Kuisioner" value="5 Hari" sub="Terus pertahankan!" accent="#6c63ff" Icon={CalendarCheck} />
    </div>
  );
}
