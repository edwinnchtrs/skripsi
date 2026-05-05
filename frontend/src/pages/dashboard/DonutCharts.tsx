import { PieChart, Pie, Cell } from 'recharts';
import { card, sectionTitle } from './styles';

function DonutCard({ title, data, total, loading }: { title: string; data: { name: string; value: number; color: string }[]; total: number; loading?: boolean }) {
  return (
    <div style={card}>
      <div style={{ ...sectionTitle, marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {loading ? (
            <div style={{ width: 150, height: 150, borderRadius: '50%', background: '#1e2130', animation: 'pulse 1.5s infinite' }} />
          ) : (
            <PieChart width={150} height={150}>
              <Pie data={data} cx={70} cy={70} innerRadius={46} outerRadius={66} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
          )}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{loading ? '-' : total.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: '#8890a4' }}>Total</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {loading ? (
            <div style={{ color: '#8890a4', fontSize: 11 }}>Memuat data...</div>
          ) : (
            data.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: '#8890a4', flex: 1 }}>{d.name}</span>
                <span style={{ fontSize: 11, color: d.color, fontWeight: 600 }}>{d.value}</span>
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }`}</style>
    </div>
  );
}

export default function DonutCharts({ data, loading }: { data: any, loading: boolean }) {
  const total = data?.totalRespondents ?? 0;
  
  const bRendah = data?.burnoutDist?.["Rendah"] ?? 0;
  const bSedang = data?.burnoutDist?.["Sedang"] ?? 0;
  const bTinggi = data?.burnoutDist?.["Tinggi"] ?? 0;
  const totalB = bRendah + bSedang + bTinggi;

  const pRendah = data?.psychoDist?.["Rendah"] ?? 0;
  const pSedang = data?.psychoDist?.["Sedang"] ?? 0;
  const pTinggi = data?.psychoDist?.["Tinggi"] ?? 0;
  const totalP = pRendah + pSedang + pTinggi;

  const burnoutDist = [
    { name: 'Rendah (0-33)', value: bRendah, color: '#22c55e' },
    { name: 'Sedang (34-66)', value: bSedang, color: '#f59e0b' },
    { name: 'Tinggi (67-100)', value: bTinggi, color: '#ef4444' },
  ];

  const psychoDist = [
    { name: 'Rendah', value: pRendah, color: '#22c55e' },
    { name: 'Sedang', value: pSedang, color: '#f59e0b' },
    { name: 'Tinggi', value: pTinggi, color: '#ef4444' },
  ];

  return (
    <>
      <DonutCard title="Distribusi Tingkat Burnout" data={burnoutDist} total={totalB || total} loading={loading} />
      <DonutCard title="Distribusi Risiko Psikomatis" data={psychoDist} total={totalP || total} loading={loading} />
    </>
  );
}
