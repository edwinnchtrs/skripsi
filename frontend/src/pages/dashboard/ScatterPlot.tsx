
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { scatterData } from './data';
import { card, sectionTitle, tooltipStyle } from './styles';

export default function ScatterPlot() {
  return (
    <div style={card}>
      <div style={sectionTitle}>Scatter Plot: Stres vs Burnout</div>
      <div style={{ fontSize: 10, color: '#3ecfcf', marginBottom: 8 }}>r = 0.68 (Korelasi Kuat)</div>
      <ResponsiveContainer width="100%" height={190}>
        <ScatterChart margin={{ top: 0, right: 0, left: -20, bottom: 14 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
          <XAxis
            dataKey="x" name="Tingkat Stres" type="number"
            tick={{ fill: '#8890a4', fontSize: 9 }}
            label={{ value: 'Tingkat Stres', position: 'insideBottom', offset: -4, fill: '#8890a4', fontSize: 10 }}
          />
          <YAxis
            dataKey="y" name="Burnout Score" type="number"
            tick={{ fill: '#8890a4', fontSize: 9 }}
            label={{ value: 'Burnout Score', angle: -90, position: 'insideLeft', fill: '#8890a4', fontSize: 10 }}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={scatterData} fill="#6c63ff" opacity={0.65} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
