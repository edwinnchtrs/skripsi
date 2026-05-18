import type { ElementType } from 'react';
import { Activity, BrainCircuit, CalendarCheck, Zap } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  tone: 'teal' | 'green' | 'amber' | 'red' | 'violet' | 'slate';
  Icon: ElementType;
  loading?: boolean;
}

const toneClasses: Record<StatCardProps['tone'], { icon: string; ring: string; text: string }> = {
  teal: { icon: 'bg-teal-400/10 text-teal-200', ring: 'ring-teal-300/20', text: 'text-teal-200' },
  green: { icon: 'bg-emerald-400/10 text-emerald-200', ring: 'ring-emerald-300/20', text: 'text-emerald-200' },
  amber: { icon: 'bg-amber-400/10 text-amber-200', ring: 'ring-amber-300/20', text: 'text-amber-200' },
  red: { icon: 'bg-rose-400/10 text-rose-200', ring: 'ring-rose-300/20', text: 'text-rose-200' },
  violet: { icon: 'bg-violet-400/10 text-violet-200', ring: 'ring-violet-300/20', text: 'text-violet-200' },
  slate: { icon: 'bg-slate-400/10 text-slate-300', ring: 'ring-slate-300/10', text: 'text-slate-200' },
};

function StatCard({ label, value, sub, tone, Icon, loading }: StatCardProps) {
  const classes = toneClasses[tone];

  return (
    <article className={`min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/10 ring-1 ${classes.ring}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">{label}</p>
          {loading ? (
            <div className="mt-3 h-7 w-28 animate-pulse rounded-lg bg-slate-700/40" />
          ) : (
            <p className={`mt-2 break-words text-xl font-bold leading-tight tracking-normal sm:text-2xl ${classes.text}`}>
              {value}
            </p>
          )}
          {sub && !loading && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{sub}</p>}
        </div>

        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${classes.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
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

function getRiskLabel(level: string): { text: string; tone: StatCardProps['tone'] } {
  switch (level?.toLowerCase()) {
    case 'low':
    case 'rendah':
      return { text: 'Rendah', tone: 'green' };
    case 'medium':
    case 'sedang':
      return { text: 'Sedang', tone: 'amber' };
    case 'high':
    case 'tinggi':
      return { text: 'Tinggi', tone: 'red' };
    default:
      return { text: 'Belum Ada Data', tone: 'slate' };
  }
}

function latestByTimestamp<T extends { Timestamp: string }>(items: T[]): T | undefined {
  return [...items].sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime())[0];
}

function calcEnergyFromAssessment(a: Assessment): number {
  const raw = 58 + a.EfficacyScore * 8 - a.FatigueScore * 7 - a.CynicismScore * 5 - a.InterferenceScore * 3;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

function getEnergyLabel(pct: number): { text: string; tone: StatCardProps['tone']; sub: string } {
  if (pct >= 75) return { text: `${pct}%`, tone: 'green', sub: 'Energi dalam rentang baik' };
  if (pct >= 45) return { text: `${pct}%`, tone: 'amber', sub: 'Mulai terkuras, perlu jeda' };
  return { text: `${pct}%`, tone: 'red', sub: 'Butuh pemulihan lebih serius' };
}

function getBurnoutSub(score: number) {
  if (score <= 4) return 'Masih dalam rentang rendah';
  if (score <= 6) return 'Perlu perhatian dan pemantauan';
  return 'Prioritaskan pemulihan hari ini';
}

function calcStreak(assessments: Assessment[]): number {
  if (!assessments.length) return 0;
  const sorted = [...assessments].sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());
  let streak = 0;
  let prev = new Date();
  prev.setHours(0, 0, 0, 0);

  for (const assessment of sorted) {
    const date = new Date(assessment.Timestamp);
    date.setHours(0, 0, 0, 0);
    const diff = Math.round((prev.getTime() - date.getTime()) / 86400000);
    if (diff <= 1) {
      streak += 1;
      prev = date;
    } else {
      break;
    }
  }

  return streak;
}

export default function UserStatCards({ predictions, assessments, loading }: UserStatCardsProps) {
  const latestPred = latestByTimestamp(predictions);
  const latestAsmt = latestByTimestamp(assessments);

  const riskInfo = latestPred ? getRiskLabel(latestPred.RiskLevel) : { text: 'Belum Ada Data', tone: 'slate' as const };
  const stressSub = latestPred
    ? `Burnout ${latestPred.BurnoutScore.toFixed(1)} | Psikosomatik ${latestPred.PsychosomaticScore.toFixed(1)}`
    : 'Isi kuisioner untuk mulai membaca tren';

  const energyPct = latestAsmt ? calcEnergyFromAssessment(latestAsmt) : null;
  const energyInfo = energyPct !== null
    ? getEnergyLabel(energyPct)
    : { text: '-', tone: 'slate' as const, sub: 'Belum ada asesmen hari ini' };

  const burnoutValue = latestPred ? latestPred.BurnoutScore.toFixed(1) : '-';
  const burnoutSub = latestPred ? getBurnoutSub(latestPred.BurnoutScore) : 'Belum ada prediksi';

  const streak = calcStreak(assessments);
  const streakSub = streak === 0 ? 'Mulai isi kuisioner hari ini' : streak >= 7 ? 'Konsisten selama satu pekan' : 'Pertahankan ritme harian';

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Risk Level Saat Ini"
        value={riskInfo.text}
        sub={stressSub}
        tone={riskInfo.tone}
        Icon={Activity}
        loading={loading}
      />
      <StatCard
        label="Level Energi"
        value={energyInfo.text}
        sub={energyInfo.sub}
        tone={energyInfo.tone}
        Icon={Zap}
        loading={loading}
      />
      <StatCard
        label="Skor Burnout Terakhir"
        value={burnoutValue}
        sub={burnoutSub}
        tone="teal"
        Icon={BrainCircuit}
        loading={loading}
      />
      <StatCard
        label="Streak Kuisioner"
        value={`${streak} Hari`}
        sub={streakSub}
        tone="violet"
        Icon={CalendarCheck}
        loading={loading}
      />
    </section>
  );
}
