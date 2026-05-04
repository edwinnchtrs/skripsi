import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquareHeart,
  ClipboardList,
  Activity,
  User,
  Users,
  Settings,
  LogOut,
  Sun,
  Moon,
  Brain
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/user/dashboard' },
  { label: 'Kuisioner Harian', icon: ClipboardList, path: '/user/kuisioner' },
  { label: 'Ruang Curhat Anonim', icon: MessageSquareHeart, path: '/user/curhat' },
  { label: 'Riwayat Asesmen', icon: Activity, path: '/user/asesmen' },
  { label: 'Jaringan Teman', icon: Users, path: '/user/network' },
  { label: 'Pengaturan Akun', icon: Settings, path: '/user/settings' },
];

export default function UserSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    // Default is dark mode; light-mode is the opt-in
    return saved !== 'light';
  });
  const [profile, setProfile] = useState<any>(null);

  // Apply theme class on mount & whenever dark changes
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    api.get('/user/profile')
      .then(res => setProfile(res.data))
      .catch(console.error);
  }, []);

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
        background: 'var(--theme-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        borderRight: '1px solid var(--theme-sidebar-border)',
      }}
    >
      {/* Brand */}
      <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--theme-sidebar-border)' }}>
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
            <div style={{ color: 'var(--theme-text-primary)', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
              QC Analytics
            </div>
            <div style={{ color: 'var(--theme-text-muted)', fontSize: 10 }}>User Portal</div>
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
                background: active ? 'var(--theme-nav-active-bg)' : 'transparent',
                color: active ? '#4ade80' : 'var(--theme-text-muted)',
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
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--theme-sidebar-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          {profile?.profile_pic ? (
            <img 
              src={profile.profile_pic} 
              alt="Profile" 
              style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
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
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ color: 'var(--theme-text-primary)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile ? profile.nama : 'Loading...'}
            </div>
            <div style={{ color: 'var(--theme-text-muted)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.bio || 'No bio yet'}
            </div>
          </div>
        </div>
        
        {/* Followers Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 11, color: 'var(--theme-text-muted)' }}>
          <div><strong style={{ color: 'var(--theme-text-primary)' }}>{profile?.follower_count || 0}</strong> Followers</div>
          <div><strong style={{ color: 'var(--theme-text-primary)' }}>{profile?.following_count || 0}</strong> Following</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--theme-text-muted)', fontSize: 11 }}>Tema</span>
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
            border: '1px solid var(--theme-btn-secondary-border)',
            color: 'var(--theme-text-muted)',
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
