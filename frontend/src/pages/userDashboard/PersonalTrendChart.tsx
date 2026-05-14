import { BarChart3 } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartShell from '../../components/ChartShell';
import type { Assessment, Prediction } from './UserStatCards';

interface PersonalTrendChartProps {
  predictions: Prediction[];
  assessments: Assessment[];
  loading: boolean;
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

const tooltipStyle = {
  background: '#0f172a',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  borderRadius: 12,
  color: '#e2e8f0',
  boxShadow: '0 18px 50px rgba(0, 0, 0, 0.35)',
};

export default function PersonalTrendChart({ predictions, assessments, loading }: PersonalTrendChartProps) {
  const predData = [...predictions]
    .sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime())
    .slice(-12)
    .map((prediction) => ({
      date: formatDate(prediction.Timestamp),
      burnout: Number(prediction.BurnoutScore.toFixed(1)),
      psikosomatik: Number(prediction.PsychosomaticScore.toFixed(1)),
    }));

  const asmtData = [...assessments]
    .sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime())
    .slice(-12)
    .map((assessment) => ({
      date: formatDate(assessment.Timestamp),
      efikasi: Number(assessment.EfficacyScore.toFixed(1)),
      kelelahan: Number(assessment.FatigueScore.toFixed(1)),
      gangguan: Number(assessment.InterferenceScore.toFixed(1)),
    }));

  const hasData = predData.length > 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/10 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Tren Psikologis Personal</h2>
          <p className="mt-1 text-xs text-slate-400">Pantauan burnout, psikosomatik, dan asesmen terbaru.</p>
        </div>
        {hasData && (
          <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs font-medium text-slate-300">
            {predData.length} sesi terakhir
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid min-h-72 place-items-center rounded-xl border border-white/10 bg-slate-950/40">
          <div className="h-8 w-44 animate-pulse rounded-lg bg-slate-700/40" />
        </div>
      ) : !hasData ? (
        <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-5 text-center">
          <div>
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-teal-300/10 text-teal-200">
              <BarChart3 className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">Belum ada data tren</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Isi kuisioner harian untuk melihat grafik perkembanganmu.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="min-w-0 rounded-xl border border-white/10 bg-slate-950/35 p-3">
            <div className="mb-3 text-xs font-semibold uppercase tracking-normal text-slate-400">
              Skor Burnout dan Psikosomatik
            </div>
            <ChartShell height={288} className="rounded-lg">
              <LineChart data={predData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconSize={9} wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                <Line type="monotone" dataKey="burnout" name="Burnout" stroke="#fb7185" strokeWidth={2.4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="psikosomatik" name="Psikosomatik" stroke="#fbbf24" strokeWidth={2.4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ChartShell>
          </div>

          {asmtData.length > 0 && (
            <div className="min-w-0 rounded-xl border border-white/10 bg-slate-950/35 p-3">
              <div className="mb-3 text-xs font-semibold uppercase tracking-normal text-slate-400">
                Asesmen Kuisioner
              </div>
              <ChartShell height={256} className="rounded-lg">
                <LineChart data={asmtData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 'dataMax + 1']} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconSize={9} wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Line type="monotone" dataKey="efikasi" name="Efikasi" stroke="#34d399" strokeWidth={2.4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="kelelahan" name="Kelelahan" stroke="#38bdf8" strokeWidth={2.4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="gangguan" name="Gangguan" stroke="#a78bfa" strokeWidth={2.4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ChartShell>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
