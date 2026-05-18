import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import AIAssistant from './AIAssistant';
import UserSidebar from './UserSidebar';

const SIDEBAR_WIDTH = 220;

export default function UserDashboardLayout() {
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="dashboard-theme" style={{ display: 'flex', background: 'var(--theme-bg)', minHeight: '100vh' }}>
      <UserSidebar onOpenAssistant={() => setAssistantOpen(true)} />
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
      <AIAssistant role="user" open={assistantOpen} onOpenChange={setAssistantOpen} />
    </div>
  );
}
