import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import AIAssistant from './AIAssistant';
import Sidebar from './Sidebar';

const SIDEBAR_WIDTH = 220;

export default function DashboardLayout() {
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="dashboard-theme" style={{ display: 'flex', background: 'var(--theme-bg)', minHeight: '100vh' }}>
      <Sidebar onOpenAssistant={() => setAssistantOpen(true)} />
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
      <AIAssistant role="admin" open={assistantOpen} onOpenChange={setAssistantOpen} />
    </div>
  );
}
