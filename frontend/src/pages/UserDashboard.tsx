import UserDashboardHeader from './userDashboard/UserDashboardHeader';
import UserStatCards from './userDashboard/UserStatCards';
import PersonalTrendChart from './userDashboard/PersonalTrendChart';
import DailyQuestionnaire from './userDashboard/DailyQuestionnaire';
import AnonymousVentingFeed from './userDashboard/AnonymousVentingFeed';

const page: React.CSSProperties = {
  padding: '22px 24px',
  background: '#0b0d14',
  minHeight: '100vh',
  color: '#e2e8f0',
  fontFamily: 'Inter, sans-serif',
};

export default function UserDashboard() {
  return (
    <div style={page}>
      <UserDashboardHeader />
      <UserStatCards />

      {/* Grid Utama */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        
        {/* Kolom Kiri: Tren & Kuisioner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PersonalTrendChart />
          <DailyQuestionnaire />
        </div>

        {/* Kolom Kanan: Ruang Curhat */}
        <div>
          <AnonymousVentingFeed />
        </div>
        
      </div>
    </div>
  );
}
