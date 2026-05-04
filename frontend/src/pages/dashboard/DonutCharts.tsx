
import { PieChart, Pie, Cell } from 'recharts';
import { burnoutDist, psychoDist } from './data';
import { card, sectionTitle } from './styles';

function DonutCard({ title, data, total }: { title: string; data: typeof burnoutDist; total: number }) {
  return (
    <div style={card}>
      <div style={{ ...sectionTitle, marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <PieChart width={150} height={150}>
            <Pie data={data} cx={70} cy={70} innerRadius={46} outerRadius={66} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{total.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: '#8890a4' }}>Total</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {data.map((d) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#8890a4', flex: 1 }}>{d.name}</span>
              <span style={{ fontSize: 11, color: d.color, fontWeight: 600 }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DonutCharts() {
  return (
    <>
      <DonutCard title="Distribusi Tingkat Burnout" data={burnoutDist} total={1256} />
      <DonutCard title="Distribusi Risiko Psikomatis" data={psychoDist} total={1256} />
    </>
  );
}
