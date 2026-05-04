import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, UserCheck, Heart, HeartHandshake, Smile } from 'lucide-react';
import api from '../../api';

type NetworkUser = {
  id: number;
  nama: string;
  username: string;
  bio: string;
  profile_pic: string;
  is_followed: boolean;
  affinity: string; // '', 'teman', 'pacar', 'saudara'
};

export default function UserNetwork() {
  const [users, setUsers] = useState<NetworkUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/network/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleFollow = async (id: number) => {
    try {
      // Optimistic update
      setUsers(users.map(u => u.id === id ? { ...u, is_followed: !u.is_followed } : u));
      const res = await api.post(`/network/follow/${id}`);
      // Sync with server if needed
      setUsers(users.map(u => u.id === id ? { ...u, is_followed: res.data.is_followed } : u));
    } catch (err) {
      console.error("Failed to follow", err);
      fetchUsers(); // revert on error
    }
  };

  const updateAffinity = async (id: number, type: string) => {
    try {
      setUsers(users.map(u => u.id === id ? { ...u, affinity: type } : u));
      const res = await api.post(`/network/affinity/${id}`, { type });
      setUsers(users.map(u => u.id === id ? { ...u, affinity: res.data.affinity } : u));
    } catch (err) {
      console.error("Failed to update affinity", err);
      fetchUsers(); // revert
    }
  };

  const getAffinityIcon = (type: string) => {
    switch (type) {
      case 'teman': return <Smile size={14} color="#3ecfcf" />;
      case 'pacar': return <Heart size={14} color="#ef4444" />;
      case 'saudara': return <HeartHandshake size={14} color="#f59e0b" />;
      default: return null;
    }
  };

  const getAffinityBg = (type: string) => {
    switch (type) {
      case 'teman': return 'rgba(62, 207, 207, 0.15)';
      case 'pacar': return 'rgba(239, 68, 68, 0.15)';
      case 'saudara': return 'rgba(245, 158, 11, 0.15)';
      default: return 'transparent';
    }
  };

  return (
    <div style={{ padding: '30px 40px', color: '#fff', minHeight: '100vh' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ margin: '0 0 10px', fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={28} color="#22c55e" />
          Jaringan Teman
        </h1>
        <p style={{ margin: 0, color: '#8890a4', fontSize: 14 }}>Temukan teman, jalin koneksi, dan bangun dukungan sosial yang positif.</p>
      </div>

      {loading ? (
        <div style={{ color: '#8890a4' }}>Memuat jaringan...</div>
      ) : users.length === 0 ? (
        <div style={{ color: '#8890a4' }}>Belum ada pengguna lain di platform ini.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          <AnimatePresence>
            {users.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                style={{
                  background: '#151821',
                  borderRadius: 16,
                  border: '1px solid #1e2130',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Affinity Indicator Badge */}
                {user.affinity && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: getAffinityBg(user.affinity),
                    padding: '4px 10px',
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#fff',
                    textTransform: 'capitalize'
                  }}>
                    {getAffinityIcon(user.affinity)} {user.affinity}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  {user.profile_pic ? (
                    <img src={user.profile_pic} alt={user.nama} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#2a2e42', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={24} color="#8890a4" />
                    </div>
                  )}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nama}</div>
                    <div style={{ color: '#8890a4', fontSize: 12 }}>@{user.username.split('@')[0]}</div>
                  </div>
                </div>

                <p style={{ 
                  margin: '0 0 20px', 
                  color: '#e2e8f0', 
                  fontSize: 13, 
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  flex: 1
                }}>
                  {user.bio || <span style={{ color: '#4b5563', fontStyle: 'italic' }}>Tidak ada bio</span>}
                </p>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => toggleFollow(user.id)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: 8,
                      border: user.is_followed ? '1px solid #1e2130' : 'none',
                      background: user.is_followed ? 'transparent' : 'linear-gradient(135deg, #22c55e, #3ecfcf)',
                      color: user.is_followed ? '#8890a4' : '#fff',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (!user.is_followed) e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      if (!user.is_followed) e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {user.is_followed ? <UserCheck size={16} /> : <UserPlus size={16} />}
                    {user.is_followed ? 'Mengikuti' : 'Ikuti'}
                  </button>

                  <select
                    value={user.affinity}
                    onChange={(e) => updateAffinity(user.id, e.target.value)}
                    style={{
                      background: '#0f1117',
                      border: '1px solid #1e2130',
                      color: '#8890a4',
                      borderRadius: 8,
                      padding: '0 10px',
                      fontSize: 12,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Set Status</option>
                    <option value="teman">Teman</option>
                    <option value="pacar">Pacar</option>
                    <option value="saudara">Saudara</option>
                  </select>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
