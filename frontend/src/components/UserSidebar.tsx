import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquareHeart,
  ClipboardList,
  Activity,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Brain
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/user/dashboard' },
  { label: 'Kuisioner Harian', icon: ClipboardList, path: '/user/kuisioner' },
  { label: 'Ruang Curhat Anonim', icon: MessageSquareHeart, path: '/user/curhat' },
  { label: 'Riwayat Asesmen', icon: Activity, path: '/user/asesmen' },
  { label: 'Pengaturan Akun', icon: Settings, path: '/user/settings' },
];

export default function UserSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: '#0f1117',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        borderRight: '1px solid #1e2130',
      }}
    >
      {/* Brand */}
      <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #1e2130' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #22c55e, #3ecfcf)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Brain size={20} color="#fff" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
              QC Analytics
            </div>
            <div style={{ color: '#8890a4', fontSize: 10 }}>User Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                marginBottom: 2,
                background: active ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                color: active ? '#4ade80' : '#8890a4',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User & theme */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e2130' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #3ecfcf)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={16} color="#fff" />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Guest User
            </div>
            <div style={{ color: '#8890a4', fontSize: 11 }}>Mahasiswa</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#8890a4', fontSize: 11 }}>Tema</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sun size={13} color="#8890a4" />
            <button
              onClick={() => setDark(!dark)}
              style={{
                width: 32,
                height: 18,
                borderRadius: 9,
                background: dark ? '#22c55e' : '#2a2e42',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: dark ? 16 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </button>
            <Moon size={13} color="#8890a4" />
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            marginTop: 12,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 10px',
            borderRadius: 7,
            background: 'transparent',
            border: '1px solid #2a2e42',
            color: '#8890a4',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
