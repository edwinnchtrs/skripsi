import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { card, sectionTitle, tooltipStyle } from './styles';

export default function ScatterPlot({ data, loading }: { data: any[], loading: boolean }) {
  const chartData = data && data.length > 0 ? data : [];

  return (
    <div style={card}>
      <div style={sectionTitle}>Scatter Plot: Psikosomatik vs Burnout</div>
      <div style={{ fontSize: 10, color: '#3ecfcf', marginBottom: 8 }}>r = 0.68 (Mocked Correlation)</div>
      {loading ? (
        <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8890a4', fontSize: 13 }}>
          Memuat data...
        </div>
      ) : chartData.length === 0 ? (
        <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8890a4', fontSize: 13 }}>
          Belum ada data sebaran
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={190}>
          <ScatterChart margin={{ top: 0, right: 0, left: -20, bottom: 14 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis
              dataKey="x" name="Skor Psikosomatik" type="number"
              tick={{ fill: '#8890a4', fontSize: 9 }} domain={[0, 100]}
              label={{ value: 'Skor Psikosomatik', position: 'insideBottom', offset: -4, fill: '#8890a4', fontSize: 10 }}
            />
            <YAxis
              dataKey="y" name="Burnout Score" type="number"
              tick={{ fill: '#8890a4', fontSize: 9 }} domain={[0, 100]}
              label={{ value: 'Burnout Score', angle: -90, position: 'insideLeft', fill: '#8890a4', fontSize: 10 }}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={chartData} fill="#6c63ff" opacity={0.65} />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
