import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { card, sectionTitle, tooltipStyle } from '../dashboard/styles';
import type { Prediction, Assessment } from './UserStatCards';

interface PersonalTrendChartProps {
  predictions: Prediction[];
  assessments: Assessment[];
  loading: boolean;
}

function formatDate(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

export default function PersonalTrendChart({ predictions, assessments, loading }: PersonalTrendChartProps) {
  // Build chart data: map predictions chronologically (oldest first)
  // Stress = burnout score normalized 0-100, Energi = 100 - psychosomatic_score
  const predData = [...predictions]
    .sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime())
    .slice(-10) // last 10 entries
    .map(p => ({
      date: formatDate(p.Timestamp),
      burnout: Number(p.BurnoutScore.toFixed(1)),
      psikosomatik: Number(p.PsychosomaticScore.toFixed(1)),
    }));

  const asmtData = [...assessments]
    .sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime())
    .slice(-10)
    .map(a => ({
      date: formatDate(a.Timestamp),
      efisiensi: Number(a.EfficacyScore.toFixed(1)),
      kelelahan: Number(a.FatigueScore.toFixed(1)),
    }));

  const hasData = predData.length > 0;

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={sectionTitle}>Tren Psikologis Personal</div>
        {hasData && (
          <div style={{ fontSize: 10, color: '#8890a4' }}>
            {predData.length} sesi terakhir
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8890a4', fontSize: 13 }}>
          Memuat data...
        </div>
      ) : !hasData ? (
        <div style={{
          height: 220, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          color: '#8890a4', fontSize: 13,
        }}>
          <span style={{ fontSize: 28 }}>📋</span>
          <span>Belum ada data tren</span>
          <span style={{ fontSize: 11 }}>Isi kuisioner harian untuk melihat grafik perkembanganmu</span>
        </div>
      ) : (
        <>
          {/* Burnout & Psychosomatic Trend */}
          <div style={{ marginBottom: 8, fontSize: 11, color: '#8890a4' }}>Skor Burnout & Psikosomatik</div>
          <ResponsiveContainer width="100%" height={180} minWidth={1} minHeight={1}>
            <LineChart data={predData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
              <XAxis dataKey="date" tick={{ fill: '#8890a4', fontSize: 9 }} />
              <YAxis tick={{ fill: '#8890a4', fontSize: 9 }} domain={[0, 10]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: '#8890a4' }} />
              <Line
                type="monotone" dataKey="burnout" name="Burnout"
                stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
              />
              <Line
                type="monotone" dataKey="psikosomatik" name="Psikosomatik"
                stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Efficacy & Fatigue Trend (only if assessment data available) */}
          {asmtData.length > 0 && (
            <>
              <div style={{ marginTop: 16, marginBottom: 8, fontSize: 11, color: '#8890a4' }}>
                Efikasi & Kelelahan (dari Kuisioner)
              </div>
              <ResponsiveContainer width="100%" height={160} minWidth={1} minHeight={1}>
                <LineChart data={asmtData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                  <XAxis dataKey="date" tick={{ fill: '#8890a4', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#8890a4', fontSize: 9 }} domain={[0, 10]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: '#8890a4' }} />
                  <Line
                    type="monotone" dataKey="eficiensi" name="Efikasi"
                    stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone" dataKey="kelelahan" name="Kelelahan"
                    stroke="#3ecfcf" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </>
      )}
    </div>
  );
}
