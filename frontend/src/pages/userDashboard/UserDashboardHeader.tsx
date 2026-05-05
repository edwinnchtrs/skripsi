import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export default function UserDashboardHeader() {
  const [userName, setUserName] = useState('Guest');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.nama) setUserName(user.nama);
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Halo, {userName}! 👋</h1>
        <p style={{ color: '#8890a4', fontSize: 12, marginTop: 3, marginBottom: 0 }}>
          Semoga harimu menyenangkan. Berikut adalah ringkasan kesejahteraan mentalmu.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#131722', border: '1px solid #1e2130',
          borderRadius: 8, color: '#c0c9e0', fontSize: 12,
          padding: '7px 14px', position: 'relative', overflow: 'hidden'
        }}>
          <Calendar size={13} /> 
          <span style={{ pointerEvents: 'none' }}>{formatDate(selectedDate)}</span>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer'
            }}
          />
        </div>
      </div>
    </div>
  );
}
