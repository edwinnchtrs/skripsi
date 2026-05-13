import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { card, sectionTitle, tooltipStyle } from './styles';

export default function TrendChart({ data, loading }: { data: any[], loading: boolean }) {
  const chartData = data && data.length > 0 ? data : []; // Use empty array if no data to show empty state

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={sectionTitle}>Tren Burnout Score (Rata-rata)</div>
        <select style={{ background: '#1e2130', border: '1px solid #2a2e42', color: '#8890a4', borderRadius: 6, fontSize: 11, padding: '3px 8px' }}>
          <option>Harian</option>
          <option>Mingguan</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        {[['Semua','#6c63ff'],['Mahasiswa','#22c55e'],['Karyawan','#f59e0b']].map(([l,c]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#8890a4' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} /> {l}
          </span>
        ))}
      </div>
      {loading ? (
        <div style={{ height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8890a4', fontSize: 13 }}>
          Memuat data...
        </div>
      ) : chartData.length === 0 ? (
        <div style={{ height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8890a4', fontSize: 13 }}>
          Belum ada data tren
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={170} minWidth={1} minHeight={1}>
          <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis dataKey="date" tick={{ fill: '#8890a4', fontSize: 9 }} />
            <YAxis tick={{ fill: '#8890a4', fontSize: 9 }} domain={[40, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="semua" stroke="#6c63ff" strokeWidth={2} dot={{ r: 3 }} name="Semua" />
            <Line type="monotone" dataKey="mahasiswa" stroke="#22c55e" strokeWidth={2} dot={false} name="Mahasiswa (Mock)" />
            <Line type="monotone" dataKey="karyawan" stroke="#f59e0b" strokeWidth={2} dot={false} name="Karyawan (Mock)" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
