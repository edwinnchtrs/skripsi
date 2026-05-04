import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ScatterChart, Scatter,
} from 'recharts';
import { Download, Calendar, ChevronDown, AlertTriangle } from 'lucide-react';

// --- mock data ---
const trendData = [
  { date: '01 Mei', semua: 55, mahasiswa: 60, karyawan: 48 },
  { date: '06 Mei', semua: 62, mahasiswa: 68, karyawan: 54 },
  { date: '11 Mei', semua: 58, mahasiswa: 63, karyawan: 51 },
  { date: '16 Mei', semua: 70, mahasiswa: 75, karyawan: 63 },
  { date: '21 Mei', semua: 65, mahasiswa: 70, karyawan: 58 },
  { date: '26 Mei', semua: 72, mahasiswa: 78, karyawan: 65 },
  { date: '31 Mei', semua: 68, mahasiswa: 72, karyawan: 62 },
];

const burnoutDist = [
  { name: 'Rendah (0-33)', value: 412, color: '#22c55e' },
  { name: 'Sedang (34-66)', value: 578, color: '#f59e0b' },
  { name: 'Tinggi (67-100)', value: 266, color: '#ef4444' },
];

const psychoDist = [
  { name: 'Rendah', value: 480, color: '#22c55e' },
  { name: 'Sedang', value: 520, color: '#f59e0b' },
  { name: 'Tinggi', value: 256, color: '#ef4444' },
];

const korelasi = [
  { label: 'Beban Kerja', value: 0.71, positive: true },
  { label: 'Tingkat Stres', value: 0.68, positive: true },
  { label: 'Kualitas Tidur', value: 0.63, positive: true },
  { label: 'Dukungan Sosial', value: -0.42, positive: false },
  { label: 'Kepuasan Hidup', value: -0.38, positive: false },
  { label: 'Aktivitas Fisik', value: -0.29, positive: false },
];

const scatterData = Array.from({ length: 60 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
}));

const radarData = [
  { subject: 'R2 Score', value: 87 },
  { subject: 'Akurasi Klasifikasi', value: 93 },
  { subject: 'MAE', value: 75 },
  { subject: 'RMSE', value: 80 },
  { subject: 'MAPE', value: 89 },
];

const tableData = [
  { no: 1, id: 'MHS-2024-1001', kelompok: 'Mahasiswa', burnout: 87.6, psiko: 0.83, stres: 89, prediksi: '31 Mei 2024 10:23', status: 'Perlu Intervensi', statusColor: '#ef4444' },
  { no: 2, id: 'KRY-2024-0456', kelompok: 'Karyawan', burnout: 81.2, psiko: 0.79, stres: 85, prediksi: '31 Mei 2024 09:15', status: 'Perlu Intervensi', statusColor: '#ef4444' },
  { no: 3, id: 'MHS-2024-0823', kelompok: 'Mahasiswa', burnout: 73.5, psiko: 0.64, stres: 78, prediksi: '31 Mei 2024 08:47', status: 'Monitor Ketat', statusColor: '#f59e0b' },
  { no: 4, id: 'KRY-2024-0321', kelompok: 'Karyawan', burnout: 69.1, psiko: 0.64, stres: 72, prediksi: '31 Mei 2024 08:12', status: 'Monitor Ketat', statusColor: '#f59e0b' },
  { no: 5, id: 'MHS-2024-0765', kelompok: 'Mahasiswa', burnout: 65.3, psiko: 0.58, stres: 65, prediksi: '31 Mei 2024 07:45', status: 'Monitor', statusColor: '#6c63ff' },
];

const earlyWarnings = [
  { label: 'Risiko Burnout Tinggi', count: '142 orang', desc: 'Perlu perhatian segera', color: '#ef4444' },
  { label: 'Risiko Psikomatis Tinggi', count: '114 orang', desc: 'Perlu monitoring', color: '#f59e0b' },
  { label: 'Perubahan Drastis', count: '28 orang', desc: 'Perubahan > 30% dari minggu lalu', color: '#f59e0b' },
];

// --- style helpers ---
const S = {
  page: {
    padding: '24px 28px',
    background: '#0b0d14',
    minHeight: '100vh',
    color: '#e2e8f0',
    fontFamily: 'Inter, sans-serif',
  } as React.CSSProperties,
  card: {
    background: '#131722',
    borderRadius: 12,
    border: '1px solid #1e2130',
    padding: 18,
  } as React.CSSProperties,
  label: { color: '#8890a4', fontSize: 12, marginBottom: 4 } as React.CSSProperties,
  bigNum: { color: '#e2e8f0', fontSize: 28, fontWeight: 700, lineHeight: 1.1 } as React.CSSProperties,
  sectionTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: 600, marginBottom: 14 } as React.CSSProperties,
};

function StatCard({ label, value, sub, badge, badgeColor, accent }: any) {
  return (
    <div style={{ ...S.card, flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={S.label}>{label}</div>
          <div style={S.bigNum}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: '#8890a4', marginTop: 4 }}>{sub}</div>}
          {badge && (
            <span style={{ fontSize: 10, color: badgeColor || '#f59e0b', background: (badgeColor || '#f59e0b') + '22', padding: '2px 8px', borderRadius: 20, marginTop: 6, display: 'inline-block' }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: (accent || '#6c63ff') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: accent || '#6c63ff', opacity: 0.85 }} />
        </div>
      </div>
    </div>
  );
}

function DonutChart({ data, total }: { data: typeof burnoutDist, total: number }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <PieChart width={160} height={160}>
        <Pie data={data} cx={75} cy={75} innerRadius={48} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
      </PieChart>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{total.toLocaleString()}</div>
        <div style={{ fontSize: 9, color: '#8890a4' }}>Total</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#8890a4', fontSize: 13, marginTop: 2 }}>Overview analitik prediktif burnout dan risiko psikomatis</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#131722', border: '1px solid #1e2130', borderRadius: 8, color: '#c0c9e0', fontSize: 12, padding: '7px 14px', cursor: 'pointer' }}>
            <Calendar size={14} /> 01 Mei 2024 - 31 Mei 2024 <ChevronDown size={12} />
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#131722', border: '1px solid #1e2130', borderRadius: 8, color: '#c0c9e0', fontSize: 12, padding: '7px 14px', cursor: 'pointer' }}>
            Semua Kelompok <ChevronDown size={12} />
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6c63ff', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, padding: '7px 14px', cursor: 'pointer', fontWeight: 600 }}>
            <Download size={14} /> Export Laporan
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Responden" value="1.256" sub="-12.5% dari bulan lalu" accent="#6c63ff" />
        <StatCard label="Rata-rata Burnout Score" value="62.4 /100" badge="Tingkat Sedang" badgeColor="#f59e0b" sub="+8.1% dari bulan lalu" accent="#f59e0b" />
        <StatCard label="Risiko Psikosomatis Tinggi" value="256 (20.4%)" sub="+8.1% dari bulan lalu" accent="#ef4444" />
        <StatCard label="Akurasi Model" value="92.7%" badge="Sangat Baik" badgeColor="#22c55e" accent="#22c55e" />
        <StatCard label="Prediksi Dilakukan" value="3.847" sub="Total prediksi" accent="#3ecfcf" />
      </div>

      {/* Row 2: Trend chart + 2 donuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Trend */}
        <div style={{ ...S.card, gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={S.sectionTitle}>Tren Burnout Score (Rata-rata)</div>
            <select style={{ background: '#1e2130', border: '1px solid #2a2e42', color: '#8890a4', borderRadius: 6, fontSize: 11, padding: '3px 8px' }}>
              <option>Harian</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
              <XAxis dataKey="date" tick={{ fill: '#8890a4', fontSize: 10 }} />
              <YAxis tick={{ fill: '#8890a4', fontSize: 10 }} domain={[40, 100]} />
              <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: '#8890a4' }} />
              <Line type="monotone" dataKey="semua" stroke="#6c63ff" strokeWidth={2} dot={false} name="Semua" />
              <Line type="monotone" dataKey="mahasiswa" stroke="#22c55e" strokeWidth={2} dot={false} name="Mahasiswa" />
              <Line type="monotone" dataKey="karyawan" stroke="#f59e0b" strokeWidth={2} dot={false} name="Karyawan" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Burnout Donut */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Distribusi Tingkat Burnout</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <DonutChart data={burnoutDist} total={1256} />
            <div style={{ flex: 1 }}>
              {burnoutDist.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#8890a4', flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 11, color: d.color, fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Psycho Donut */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Distribusi Risiko Psikomatis</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <DonutChart data={psychoDist} total={1256} />
            <div style={{ flex: 1 }}>
              {psychoDist.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#8890a4', flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 11, color: d.color, fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Korelasi + Scatter + Model + Early Warning */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 300px', gap: 14, marginBottom: 14 }}>
        {/* Korelasi bar */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Korelasi Faktor terhadap Burnout Score</div>
          <div style={{ fontSize: 10, color: '#8890a4', marginBottom: 10 }}>Pearson (r)</div>
          {korelasi.map((k) => (
            <div key={k.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#c0c9e0', marginBottom: 3 }}>
                <span>{k.label}</span>
                <span style={{ color: k.positive ? '#6c63ff' : '#ef4444' }}>{k.value}</span>
              </div>
              <div style={{ background: '#1e2130', borderRadius: 4, height: 7, width: '100%', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: 4,
                    background: k.positive ? '#6c63ff' : '#ef4444',
                    width: `${Math.abs(k.value) * 100}%`,
                    marginLeft: k.positive ? 0 : undefined,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Scatter */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Scatter Plot: Stres vs Burnout</div>
          <div style={{ fontSize: 10, color: '#3ecfcf', marginBottom: 6 }}>r = 0.68 (Korelasi Kuat)</div>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
              <XAxis dataKey="x" name="Tingkat Stres" tick={{ fill: '#8890a4', fontSize: 9 }} label={{ value: 'Tingkat Stres', position: 'insideBottom', offset: -2, fill: '#8890a4', fontSize: 10 }} />
              <YAxis dataKey="y" name="Burnout Score" tick={{ fill: '#8890a4', fontSize: 9 }} label={{ value: 'Burnout Score', angle: -90, position: 'insideLeft', fill: '#8890a4', fontSize: 10 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', fontSize: 11 }} />
              <Scatter data={scatterData} fill="#6c63ff" opacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Model Performance</div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <PolarGrid stroke="#2a2e42" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#8890a4', fontSize: 9 }} />
              <Radar name="Model Saat Ini" dataKey="value" stroke="#6c63ff" fill="#6c63ff" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
            {[['R2 Score', '0.872'], ['Akurasi', '92.7%'], ['MAE', '0.128'], ['RMSE', '0.176'], ['MAPE', '11.23%']].map(([k, v]) => (
              <div key={k} style={{ fontSize: 10, color: '#8890a4' }}>{k}: <span style={{ color: '#c0c9e0', fontWeight: 600 }}>{v}</span></div>
            ))}
          </div>
        </div>

        {/* Early Warning */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={S.sectionTitle}>Early Warning System</div>
            <span style={{ fontSize: 11, color: '#6c63ff', cursor: 'pointer' }}>Lihat Semua</span>
          </div>
          {earlyWarnings.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < earlyWarnings.length - 1 ? '1px solid #1e2130' : 'none' }}>
              <AlertTriangle size={16} color={w.color} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{w.label}</div>
                <div style={{ fontSize: 13, color: w.color, fontWeight: 700 }}>{w.count}</div>
                <div style={{ fontSize: 10, color: '#8890a4' }}>{w.desc}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 10 }}>Quick Actions</div>
            {[
              ['Prediksi Individu Baru', 'Lakukan prediksi untuk responden baru'],
              ['Import Data Responden', 'Upload data dari file CSV/Excel'],
              ['Lihat Laporan Lengkap', 'Analisis lengkap & export'],
              ['Kelola Early Warning', 'Review pengaturan & tindakan'],
            ].map(([t, s], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #1e2130', cursor: 'pointer' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#1e2130', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: '#c0c9e0', fontWeight: 500 }}>{t}</div>
                  <div style={{ fontSize: 10, color: '#8890a4' }}>{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={S.sectionTitle}>Responden dengan Risiko Tertinggi</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Semua', 'Mahasiswa', 'Karyawan'].map((tab, i) => (
              <button key={tab} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, background: i === 0 ? '#6c63ff22' : 'transparent', color: i === 0 ? '#a89cff' : '#8890a4', border: i === 0 ? '1px solid #6c63ff44' : '1px solid transparent', cursor: 'pointer' }}>{tab}</button>
            ))}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e2130' }}>
              {['No', 'Nama / ID', 'Kelompok', 'Burnout Score', 'Risiko Psikomatis', 'Tingkat Stres', 'Prediksi Terakhir', 'Status', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#8890a4', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.no} style={{ borderBottom: '1px solid #1e2130' }}>
                <td style={{ padding: '10px', color: '#8890a4' }}>{row.no}</td>
                <td style={{ padding: '10px', color: '#c0c9e0', fontWeight: 500 }}>{row.id}</td>
                <td style={{ padding: '10px', color: '#8890a4' }}>{row.kelompok}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>{row.burnout}</span>
                  <span style={{ fontSize: 10, color: '#ef4444', background: '#ef444422', borderRadius: 4, padding: '1px 6px', marginLeft: 6 }}>Tinggi</span>
                </td>
                <td style={{ padding: '10px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>{row.psiko}</span>
                  <span style={{ fontSize: 10, color: '#ef4444', background: '#ef444422', borderRadius: 4, padding: '1px 6px', marginLeft: 6 }}>Tinggi</span>
                </td>
                <td style={{ padding: '10px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>{row.stres}</span>
                  <span style={{ fontSize: 10, color: '#ef4444', background: '#ef444422', borderRadius: 4, padding: '1px 6px', marginLeft: 6 }}>Tinggi</span>
                </td>
                <td style={{ padding: '10px', color: '#8890a4', fontSize: 11 }}>{row.prediksi}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ fontSize: 11, color: row.statusColor, background: row.statusColor + '22', borderRadius: 6, padding: '3px 10px' }}>{row.status}</span>
                </td>
                <td style={{ padding: '10px', color: '#8890a4', cursor: 'pointer' }}>...</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <span style={{ fontSize: 11, color: '#8890a4' }}>Halaman 1 dari 252</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['<', '1', '2', '3', '...', '252', '>'].map((p, i) => (
              <button key={i} style={{ width: 28, height: 28, borderRadius: 6, background: p === '1' ? '#6c63ff' : '#1e2130', border: 'none', color: p === '1' ? '#fff' : '#8890a4', fontSize: 12, cursor: 'pointer' }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
