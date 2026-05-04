import { Outlet } from 'react-router-dom';
import UserSidebar from './UserSidebar';

const SIDEBAR_WIDTH = 220;

export default function UserDashboardLayout() {
  return (
    <div style={{ display: 'flex', background: 'var(--theme-bg)', minHeight: '100vh' }}>
      <UserSidebar />
      <main
        style={{
          marginLeft: SIDEBAR_WIDTH,
          flex: 1,
          minHeight: '100vh',
          overflowX: 'hidden',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
