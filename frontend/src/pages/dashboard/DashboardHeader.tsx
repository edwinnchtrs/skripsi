import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Calendar, ChevronDown, Check } from 'lucide-react';

const btn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: '#131722', border: '1px solid #1e2130',
  borderRadius: 8, color: '#c0c9e0', fontSize: 12,
  padding: '7px 14px', cursor: 'pointer', position: 'relative' as any,
};

const dropdown: React.CSSProperties = {
  position: 'absolute', top: '100%', left: 0, marginTop: 4,
  background: '#131722', border: '1px solid #1e2130', borderRadius: 8,
  padding: '4px', zIndex: 50, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

const dropItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
  fontSize: 12, color: '#c0c9e0', background: 'transparent', border: 'none', width: '100%',
};

const datePeriods = [
  { label: '7 Hari Terakhir', value: '7d' },
  { label: '30 Hari Terakhir', value: '30d' },
  { label: '90 Hari Terakhir', value: '90d' },
  { label: 'Bulan Ini', value: 'this-month' },
  { label: 'Bulan Lalu', value: 'last-month' },
  { label: 'Semua Waktu', value: 'all' },
];

const groupOptions = [
  { label: 'Semua Kelompok', value: 'all' },
  { label: 'Mahasiswa', value: 'mahasiswa' },
  { label: 'Karyawan', value: 'karyawan' },
];

interface Props {
  dateFilter: string;
  groupFilter: string;
  onDateChange: (v: string) => void;
  onGroupChange: (v: string) => void;
}

export default function DashboardHeader({ dateFilter, groupFilter, onDateChange, onGroupChange }: Props) {
  const nav = useNavigate();
  const [dateOpen, setDateOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  const selectedDate = datePeriods.find(d => d.value === dateFilter)?.label || 'Pilih Periode';
  const selectedGroup = groupOptions.find(g => g.value === groupFilter)?.label || 'Semua Kelompok';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false);
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) setGroupOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#8890a4', fontSize: 12, marginTop: 3, marginBottom: 0 }}>
          Overview analitik prediktif burnout dan risiko psikomatis
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* Date Filter Dropdown */}
        <div ref={dateRef} style={{ position: 'relative' as any }}>
          <button style={btn} onClick={() => { setDateOpen(!dateOpen); setGroupOpen(false); }}>
            <Calendar size={13} /> {selectedDate} <ChevronDown size={12} />
          </button>
          {dateOpen && (
            <div style={dropdown}>
              {datePeriods.map(d => (
                <button
                  key={d.value}
                  style={{ ...dropItem, color: dateFilter === d.value ? '#a89cff' : '#c0c9e0', background: dateFilter === d.value ? 'rgba(108,99,255,0.12)' : 'transparent' }}
                  onClick={() => { onDateChange(d.value); setDateOpen(false); }}
                >
                  {d.label}
                  {dateFilter === d.value && <Check size={14} color="#a89cff" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Group Filter Dropdown */}
        <div ref={groupRef} style={{ position: 'relative' as any }}>
          <button style={btn} onClick={() => { setGroupOpen(!groupOpen); setDateOpen(false); }}>
            {selectedGroup} <ChevronDown size={12} />
          </button>
          {groupOpen && (
            <div style={dropdown}>
              {groupOptions.map(g => (
                <button
                  key={g.value}
                  style={{ ...dropItem, color: groupFilter === g.value ? '#a89cff' : '#c0c9e0', background: groupFilter === g.value ? 'rgba(108,99,255,0.12)' : 'transparent' }}
                  onClick={() => { onGroupChange(g.value); setGroupOpen(false); }}
                >
                  {g.label}
                  {groupFilter === g.value && <Check size={14} color="#a89cff" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export Button */}
        <button
          style={{ ...btn, background: '#6c63ff', border: 'none', color: '#fff', fontWeight: 600 }}
          onClick={() => nav('/laporan')}
        >
          <Download size={13} /> Export Laporan
        </button>
      </div>
    </div>
  );
}
