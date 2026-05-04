
import { AlertTriangle, User, FileUp, FileText, Bell, Brain } from 'lucide-react';
import { earlyWarnings, quickActions } from './data';
import { card } from './styles';

const actionIcons = [User, FileUp, FileText, Bell];

export default function RightPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Early Warning */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>Early Warning System</span>
          <span style={{ fontSize: 11, color: '#6c63ff', cursor: 'pointer' }}>Lihat Semua</span>
        </div>
        {earlyWarnings.map((w, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '9px 10px', borderRadius: 8, marginBottom: 6,
            background: w.color + '12', border: `1px solid ${w.color}30`,
          }}>
            <AlertTriangle size={15} color={w.color} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{w.label}</div>
              <div style={{ fontSize: 13, color: w.color, fontWeight: 700 }}>{w.count}</div>
              <div style={{ fontSize: 10, color: '#8890a4' }}>{w.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={card}>
        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Quick Actions</div>
        {quickActions.map((a, i) => {
          const Icon = actionIcons[i];
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: i < quickActions.length - 1 ? '1px solid #1e2130' : 'none', cursor: 'pointer',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: a.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={14} color={a.color} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#c0c9e0', fontWeight: 500 }}>{a.title}</div>
                <div style={{ fontSize: 10, color: '#8890a4' }}>{a.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ringkasan Kuisioner Harian (User) */}
      <div style={card}>
        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Ringkasan Kuisioner Harian</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#8890a4' }}>Total Partisipasi Hari Ini</span>
          <span style={{ fontSize: 12, color: '#3ecfcf', fontWeight: 600 }}>845 User</span>
        </div>
        <div style={{ background: '#1e2130', borderRadius: 4, height: 6, width: '100%', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', borderRadius: 4, background: '#3ecfcf', width: '67%' }} />
        </div>
        <div style={{ fontSize: 10, color: '#8890a4', display: 'flex', justifyContent: 'space-between' }}>
          <span>Rata-rata Stres: <span style={{ color: '#f59e0b' }}>Sedang</span></span>
          <span>Target: 1.256</span>
        </div>
      </div>

      {/* Informasi Model */}
      <div style={card}>
        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Informasi Model</div>
        {[
          ['Algoritma Utama', 'Regresi Linier'],
          ['Pendekatan', 'Quantum Cognition + Regresi Linier'],
          ['Terakhir Dilatih', '28 Mei 2024 14:32'],
          ['Dataset', '1.256 sampel'],
          ['Fitur Digunakan', '12 variabel'],
        ].map(([label, val]) => (
          <div key={label} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#8890a4' }}>{label}</div>
            <div style={{ fontSize: 11, color: '#c0c9e0', fontWeight: 500 }}>{val}</div>
          </div>
        ))}
        <button style={{
          marginTop: 6, width: '100%', padding: '8px 0', borderRadius: 8,
          background: 'linear-gradient(135deg,#6c63ff,#3ecfcf)', border: 'none',
          color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Brain size={14} /> Lihat Detail Model
        </button>
      </div>

    </div>
  );
}
