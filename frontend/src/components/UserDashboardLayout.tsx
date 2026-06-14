import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Brain, Menu } from 'lucide-react';
import AIAssistant from './AIAssistant';
import UserSidebar from './UserSidebar';

export default function UserDashboardLayout() {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell dashboard-theme">
      <header className="mobile-topbar">
        <button type="button" className="mobile-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Buka menu user">
          <Menu size={19} />
        </button>
        <div className="mobile-brand">
          <span className="mobile-brand-mark user">
            <Brain size={17} />
          </span>
          <span>QC Analytics</span>
        </div>
      </header>

      <UserSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAssistant={() => {
          setAssistantOpen(true);
          setSidebarOpen(false);
        }}
      />
      {sidebarOpen && <button type="button" className="mobile-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" />}

      <main className="app-main">
        <Outlet />
      </main>
      <AIAssistant role="user" open={assistantOpen} onOpenChange={setAssistantOpen} />
    </div>
  );
}
