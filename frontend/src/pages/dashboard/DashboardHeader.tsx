
import { Download, Calendar, ChevronDown } from 'lucide-react';

const btn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: '#131722', border: '1px solid #1e2130',
  borderRadius: 8, color: '#c0c9e0', fontSize: 12,
  padding: '7px 14px', cursor: 'pointer',
};

export default function DashboardHeader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#8890a4', fontSize: 12, marginTop: 3, marginBottom: 0 }}>
          Overview analitik prediktif burnout dan risiko psikomatis
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button style={btn}>
          <Calendar size={13} /> 01 Mei 2024 – 31 Mei 2024 <ChevronDown size={12} />
        </button>
        <button style={btn}>
          Semua Kelompok <ChevronDown size={12} />
        </button>
        <button style={{ ...btn, background: '#6c63ff', border: 'none', color: '#fff', fontWeight: 600 }}>
          <Download size={13} /> Export Laporan
        </button>
      </div>
    </div>
  );
}
