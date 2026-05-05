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
  loading?: boolean;
}

function StatCard({ label, value, sub, badge, badgeColor, accent, Icon, miniChart, loading }: StatCardProps) {
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
          {sub && !loading && <div style={{ fontSize: 11, color: '#8890a4', marginTop: 4 }}>{sub}</div>}
          {badge && !loading && (
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

export default function StatCards({ data, loading }: { data: any, loading: boolean }) {
  const totalResp = data?.totalRespondents ?? 0;
  const avgBurnout = data?.avgBurnout ? data.avgBurnout.toFixed(1) : "0";
  const highRisk = data?.highRiskCount ?? 0;
  const highRiskPct = totalResp > 0 ? ((highRisk / totalResp) * 100).toFixed(1) : "0";
  const totalPreds = data?.totalPredictions ?? 0;

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <StatCard label="Total Responden" value={totalResp.toLocaleString('id-ID')} sub="Dari database aktif" accent="#6c63ff" Icon={Users} loading={loading} />
      <StatCard label="Rata-rata Burnout Score" value={`${avgBurnout} /100`} badge={Number(avgBurnout) > 66 ? "Tinggi" : Number(avgBurnout) > 33 ? "Sedang" : "Rendah"} badgeColor={Number(avgBurnout) > 66 ? "#ef4444" : Number(avgBurnout) > 33 ? "#f59e0b" : "#22c55e"} accent="#f59e0b" Icon={Brain} loading={loading} />
      <StatCard label="Risiko Psikomatis Tinggi" value={`${highRisk} (${highRiskPct}%)`} sub="Dari total responden" accent="#ef4444" Icon={AlertTriangle} loading={loading} />
      <StatCard label="Akurasi Model" value="92.7%" badge="Sangat Baik" badgeColor="#22c55e" accent="#22c55e" Icon={Target} loading={loading} />
      <StatCard label="Prediksi Dilakukan" value={totalPreds.toLocaleString('id-ID')} sub="Total prediksi" accent="#3ecfcf" Icon={BarChart2} loading={loading} />
    </div>
  );
}
