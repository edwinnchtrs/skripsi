import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const SIDEBAR_WIDTH = 220;

export default function DashboardLayout() {
  return (
    <div style={{ display: 'flex', background: '#0b0d14', minHeight: '100vh' }}>
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
