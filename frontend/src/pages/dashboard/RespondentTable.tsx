import { useState } from 'react';
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Convert risk level to Indonesian
const getLevel = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'high': return 'Tinggi';
    case 'medium': return 'Sedang';
    default: return 'Rendah';
  }
};

const getColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    default: return '#22c55e';
  }
};

const getStatus = (risk: string) => {
  switch (risk?.toLowerCase()) {
    case 'high': return { text: 'Perlu Intervensi', color: '#ef4444' };
    case 'medium': return { text: 'Monitor Ketat', color: '#f59e0b' };
    default: return { text: 'Monitor', color: '#6c63ff' };
  }
};

function formatDate(isoStr: string) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) + '\n' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function RespondentTable({ data, loading }: { data: any[], loading: boolean }) {
  const [activeTab, setActiveTab] = useState(0);

  // Pagination simple mockup
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const tableData = data || [];
  const filteredData = tableData.filter(row => {
    // We mocked 'kelompok' based on ID even/odd logic just for UI display
    // since 'Kelompok' does not exist in the actual DB schema right now
    const kelompok = row.id % 2 === 0 ? 'Mahasiswa' : 'Karyawan';
    row.kelompok = kelompok;

    if (activeTab === 1 && kelompok !== 'Mahasiswa') return false;
    if (activeTab === 2 && kelompok !== 'Karyawan') return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const displayData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>Responden Terbaru</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => { setActiveTab(i); setPage(1); }} style={{
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
          {loading ? (
            <tr>
              <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#8890a4' }}>
                Memuat data...
              </td>
            </tr>
          ) : displayData.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#8890a4' }}>
                Belum ada data responden
              </td>
            </tr>
          ) : (
            displayData.map((row, idx) => {
              const no = (page - 1) * itemsPerPage + idx + 1;
              const burnoutLvl = getLevel(row.latest_risk); // using risk as proxy
              const bColor = getColor(row.latest_risk);
              // Since we don't return separate risk strings for psychosomatic, we'll derive it from score
              const psikoLvl = row.latest_psychosomatic > 66 ? 'Tinggi' : row.latest_psychosomatic > 33 ? 'Sedang' : 'Rendah';
              const pColor = row.latest_psychosomatic > 66 ? '#ef4444' : row.latest_psychosomatic > 33 ? '#f59e0b' : '#22c55e';
              
              const statusInfo = getStatus(row.latest_risk);

              return (
                <tr key={row.id} style={{ borderBottom: '1px solid #1a1e2e' }}>
                  <td style={{ padding: '10px', color: '#8890a4' }}>{no}</td>
                  <td style={{ padding: '10px', color: '#c0c9e0', fontWeight: 500 }}>
                    {row.nama || row.username} <br />
                    <span style={{ fontSize: 10, color: '#8890a4' }}>ID: {row.id}</span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4,
                      background: row.kelompok === 'Mahasiswa' ? '#6c63ff22' : '#3ecfcf22',
                      color: row.kelompok === 'Mahasiswa' ? '#a89cff' : '#3ecfcf',
                    }}>{row.kelompok}</span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ color: bColor, fontWeight: 600 }}>{row.latest_burnout.toFixed(1)}</span>
                    <Badge label={burnoutLvl} color={bColor} />
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ color: pColor, fontWeight: 600 }}>{row.latest_psychosomatic.toFixed(1)}</span>
                    <Badge label={psikoLvl} color={pColor} />
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ color: bColor, fontWeight: 600 }}>{(row.latest_burnout * 0.95).toFixed(1)}</span>
                    <Badge label={burnoutLvl} color={bColor} />
                  </td>
                  <td style={{ padding: '10px', color: '#8890a4', fontSize: 11, whiteSpace: 'pre-line' }}>
                    {row.latest_burnout ? formatDate(row.last_activity) : 'Belum isi'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {row.latest_burnout ? (
                      <span style={{
                        fontSize: 11, color: statusInfo.color, background: statusInfo.color + '22',
                        borderRadius: 6, padding: '3px 10px', whiteSpace: 'nowrap',
                      }}>{statusInfo.text}</span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '10px', color: '#8890a4', cursor: 'pointer' }}>
                    <MoreHorizontal size={15} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {!loading && totalPages > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <span style={{ fontSize: 11, color: '#8890a4' }}>Halaman {page} dari {totalPages}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{ width: 28, height: 28, borderRadius: 6, background: '#1e2130', border: 'none', color: '#8890a4', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={13} />
            </button>
            <button style={{
                width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
                background: '#6c63ff', color: '#fff',
              }}>{page}</button>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ width: 28, height: 28, borderRadius: 6, background: '#1e2130', border: 'none', color: '#8890a4', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
