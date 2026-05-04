import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { userTrendData } from './userData';
import { card, sectionTitle, tooltipStyle } from '../dashboard/styles';

export default function PersonalTrendChart() {
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={sectionTitle}>Tren Emosional Mingguan</div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={userTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
          <XAxis dataKey="date" tick={{ fill: '#8890a4', fontSize: 9 }} />
          <YAxis tick={{ fill: '#8890a4', fontSize: 9 }} domain={[0, 100]} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: '#8890a4' }} />
          <Line type="monotone" dataKey="stress" name="Tingkat Stres" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="energi" name="Level Energi" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
