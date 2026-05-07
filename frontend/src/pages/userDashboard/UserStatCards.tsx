import { Activity, Zap, BrainCircuit, CalendarCheck } from 'lucide-react';
import { card } from '../dashboard/styles';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  Icon: React.ElementType;
  loading?: boolean;
}

function StatCard({ label, value, sub, accent, Icon, loading }: StatCardProps) {
  return (
    <div style={{ ...card, flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#8890a4', fontSize: 11, marginBottom: 6 }}>{label}</div>
          <div style={{
            color: loading ? '#3e3f50' : '#e2e8f0',
            fontSize: 24, fontWeight: 700, lineHeight: 1.1,
            background: loading ? 'linear-gradient(90deg, #1e2130 25%, #272a3e 50%, #1e2130 75%)' : 'none',
            backgroundSize: loading ? '200% 100%' : 'auto',
            animation: loading ? 'shimmer 1.5s infinite' : 'none',
            borderRadius: loading ? 6 : 0,
            minHeight: 28,
          }}>
            {loading ? '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0' : value}
          </div>
          {sub && !loading && (
            <div style={{ fontSize: 11, color: '#8890a4', marginTop: 4 }}>{sub}</div>
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
    </div>
  );
}

export interface Prediction {
  ID: number;
  BurnoutScore: number;
  PsychosomaticScore: number;
  RiskLevel: string;
  Timestamp: string;
}

export interface Assessment {
  ID: number;
  FatigueScore: number;
  CynicismScore: number;
  EfficacyScore: number;
  InterferenceScore: number;
  Timestamp: string;
}

interface UserStatCardsProps {
  predictions: Prediction[];
  assessments: Assessment[];
  loading: boolean;
}

// Derived label helpers
function getRiskLabel(level: string): { text: string; accent: string } {
  switch (level?.toLowerCase()) {
    case 'low':    return { text: 'Rendah ✅', accent: '#22c55e' };
    case 'medium': return { text: 'Sedang ⚠️', accent: '#f59e0b' };
    case 'high':   return { text: 'Tinggi 🔴', accent: '#ef4444' };
    default:       return { text: 'Belum Ada Data', accent: '#8890a4' };
  }
}

function calcEnergyFromAssessment(a: Assessment): number {
  // Energy proxy: efficacy (high = good) minus fatigue & cynicism (high = bad)
  const raw = (a.EfficacyScore * 100) - (a.FatigueScore * 40) - (a.CynicismScore * 30);
  return Math.min(100, Math.max(0, Math.round(raw)));
}

function getEnergyLabel(pct: number): { text: string; accent: string; sub: string } {
  if (pct >= 75) return { text: `${pct}%`, accent: '#22c55e', sub: 'Energi Optimal' };
  if (pct >= 45) return { text: `${pct}%`, accent: '#f59e0b', sub: 'Sedikit Terkuras' };
  return { text: `${pct}%`, accent: '#ef4444', sub: 'Energi Rendah' };
}

function calcStreak(assessments: Assessment[]): number {
  if (!assessments.length) return 0;
  // Sort newest first
  const sorted = [...assessments].sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());
  let streak = 0;
  let prev = new Date();
  prev.setHours(0, 0, 0, 0);
  for (const a of sorted) {
    const d = new Date(a.Timestamp);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((prev.getTime() - d.getTime()) / 86400000);
    if (diff <= 1) {
      streak++;
      prev = d;
    } else {
      break;
    }
  }
  return streak;
}

export default function UserStatCards({ predictions, assessments, loading }: UserStatCardsProps) {
  const latestPred = predictions[0];
  const latestAsmt = assessments[0];

  // --- Stress / Risk Level card ---
  const riskInfo = latestPred
    ? getRiskLabel(latestPred.RiskLevel)
    : { text: 'Belum Ada Data', accent: '#8890a4' };

  const stressSub = latestPred
    ? `Burnout: ${latestPred.BurnoutScore.toFixed(1)} | Psiko: ${latestPred.PsychosomaticScore.toFixed(1)}`
    : 'Isi kuisioner untuk mulai';

  // --- Energy card ---
  const energyPct = latestAsmt ? calcEnergyFromAssessment(latestAsmt) : null;
  const energyInfo = energyPct !== null
    ? getEnergyLabel(energyPct)
    : { text: '—', accent: '#8890a4', sub: 'Belum Ada Asesmen' };

  // --- Burnout Score card ---
  const burnoutValue = latestPred ? latestPred.BurnoutScore.toFixed(1) : '—';
  const burnoutSub = latestPred
    ? (latestPred.BurnoutScore < 4 ? 'Masih aman' : latestPred.BurnoutScore < 6 ? 'Perlu perhatian' : latestPred.BurnoutScore >= 7.5 ? 'Kritis' : 'Waspada')
    : 'Belum ada prediksi';

  // --- Streak card ---
  const streak = calcStreak(assessments);
  const streakSub = streak === 0 ? 'Mulai hari ini!' : streak >= 7 ? 'Luar biasa! 🔥' : 'Terus pertahankan!';

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <StatCard
        label="Risk Level Saat Ini"
        value={riskInfo.text}
        sub={stressSub}
        accent={riskInfo.accent}
        Icon={Activity}
        loading={loading}
      />
      <StatCard
        label="Level Energi"
        value={energyInfo.text}
        sub={energyInfo.sub}
        accent={energyInfo.accent}
        Icon={Zap}
        loading={loading}
      />
      <StatCard
        label="Skor Burnout Terakhir"
        value={burnoutValue}
        sub={burnoutSub}
        accent="#3ecfcf"
        Icon={BrainCircuit}
        loading={loading}
      />
      <StatCard
        label="Streak Kuisioner"
        value={streak > 0 ? `${streak} Hari` : '0 Hari'}
        sub={streakSub}
        accent="#6c63ff"
        Icon={CalendarCheck}
        loading={loading}
      />
    </div>
  );
}
