import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const SIDEBAR_WIDTH = 220;

export default function DashboardLayout() {
  return (
    <div className="dashboard-theme" style={{ display: 'flex', background: 'var(--theme-bg)', minHeight: '100vh' }}>
      <Sidebar />
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
