
import { useState } from 'react';
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { tableData } from './data';
import { card } from './styles';

const tabs = ['Semua', 'Mahasiswa', 'Karyawan'];
const headers = ['No', 'Nama / ID', 'Kelompok', 'Burnout Score', 'Risiko Psikomatis', 'Tingkat Stres', 'Prediksi Terakhir', 'Status', ''];

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, color, background: color + '22',
      borderRadius: 4, padding: '2px 7px', marginLeft: 5,
    }}>{label}</span>
  );
}

export default function RespondentTable() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>Responden dengan Risiko Tertinggi</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} style={{
              fontSize: 11, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
              background: activeTab === i ? '#6c63ff22' : 'transparent',
              color: activeTab === i ? '#a89cff' : '#8890a4',
              border: activeTab === i ? '1px solid #6c63ff44' : '1px solid transparent',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1e2130' }}>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#8890a4', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => (
            <tr key={row.no} style={{ borderBottom: '1px solid #1a1e2e' }}>
              <td style={{ padding: '10px', color: '#8890a4' }}>{row.no}</td>
              <td style={{ padding: '10px', color: '#c0c9e0', fontWeight: 500 }}>{row.id}</td>
              <td style={{ padding: '10px' }}>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 4,
                  background: row.kelompok === 'Mahasiswa' ? '#6c63ff22' : '#3ecfcf22',
                  color: row.kelompok === 'Mahasiswa' ? '#a89cff' : '#3ecfcf',
                }}>{row.kelompok}</span>
              </td>
              <td style={{ padding: '10px' }}>
                <span style={{ color: row.burnoutLevel === 'Tinggi' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{row.burnout}</span>
                <Badge label={row.burnoutLevel} color={row.burnoutLevel === 'Tinggi' ? '#ef4444' : '#f59e0b'} />
              </td>
              <td style={{ padding: '10px' }}>
                <span style={{ color: row.psikoLevel === 'Tinggi' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{row.psiko}</span>
                <Badge label={row.psikoLevel} color={row.psikoLevel === 'Tinggi' ? '#ef4444' : '#f59e0b'} />
              </td>
              <td style={{ padding: '10px' }}>
                <span style={{ color: row.stresLevel === 'Tinggi' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{row.stres}</span>
                <Badge label={row.stresLevel} color={row.stresLevel === 'Tinggi' ? '#ef4444' : '#f59e0b'} />
              </td>
              <td style={{ padding: '10px', color: '#8890a4', fontSize: 11, whiteSpace: 'pre-line' }}>{row.prediksi}</td>
              <td style={{ padding: '10px' }}>
                <span style={{
                  fontSize: 11, color: row.statusColor, background: row.statusColor + '22',
                  borderRadius: 6, padding: '3px 10px', whiteSpace: 'nowrap',
                }}>{row.status}</span>
              </td>
              <td style={{ padding: '10px', color: '#8890a4', cursor: 'pointer' }}>
                <MoreHorizontal size={15} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <span style={{ fontSize: 11, color: '#8890a4' }}>Halaman 1 dari 252</span>
        <div style={{ display: 'flex', gap: 5 }}>
          <button style={{ width: 28, height: 28, borderRadius: 6, background: '#1e2130', border: 'none', color: '#8890a4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={13} />
          </button>
          {['1','2','3','…','252'].map((p, i) => (
            <button key={i} style={{
              width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
              background: p === '1' ? '#6c63ff' : '#1e2130',
              color: p === '1' ? '#fff' : '#8890a4',
            }}>{p}</button>
          ))}
          <button style={{ width: 28, height: 28, borderRadius: 6, background: '#1e2130', border: 'none', color: '#8890a4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
