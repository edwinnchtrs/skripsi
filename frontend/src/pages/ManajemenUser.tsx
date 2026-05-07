import { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, UserPlus, Edit3, Trash2, Shield, ShieldAlert, UserCheck,
  Mail, Calendar, X, Save, AlertTriangle, CheckCircle2, Loader2,
  Filter, ChevronDown, RefreshCw, Info, MoreHorizontal
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import { card, sectionTitle } from './dashboard/styles';

interface UserType {
  id: number;
  username: string;
  nama: string;
  role: string;
  bio: string;
  profile_pic: string;
  created_at: string;
  updated_at: string;
}

const roleColor: Record<string, string> = {
  admin: '#a855f7',
  user: '#3ecfcf',
};

const roleBg: Record<string, string> = {
  admin: 'rgba(168,85,247,0.12)',
  user: 'rgba(62,207,207,0.12)',
};

export default function ManajemenUser() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editModal, setEditModal] = useState<UserType | null>(null);
  const [editForm, setEditForm] = useState({ nama: '', username: '', role: '', password: '', bio: '' });
  const [deleteModal, setDeleteModal] = useState<UserType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch { setMsg({ type: 'error', text: 'Gagal memuat data user' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 3000); return () => clearTimeout(t); } }, [msg]);

  const filtered = useMemo(() => {
    let arr = [...users];
    if (roleFilter !== 'all') arr = arr.filter(u => u.role === roleFilter);
    if (search) {
      const s = search.toLowerCase();
      arr = arr.filter(u => u.nama.toLowerCase().includes(s) || u.username.toLowerCase().includes(s));
    }
    return arr;
  }, [users, search, roleFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    user: users.filter(u => u.role === 'user').length,
  }), [users]);

  const rolePie = [
    { name: 'Admin', value: stats.admin, color: '#a855f7' },
    { name: 'User', value: stats.user, color: '#3ecfcf' },
  ];

  const openEdit = (u: UserType) => {
    setEditModal(u);
    setEditForm({ nama: u.nama, username: u.username, role: u.role, password: '', bio: u.bio || '' });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${editModal!.id}`, editForm);
      setMsg({ type: 'success', text: `User ${editModal!.nama} berhasil diperbarui` });
      setEditModal(null);
      fetchUsers();
    } catch (x: any) { setMsg({ type: 'error', text: x.response?.data?.error || 'Gagal update user' }); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/users/${deleteModal!.id}`);
      setMsg({ type: 'success', text: `User ${deleteModal!.nama} berhasil dihapus` });
      setDeleteModal(null);
      fetchUsers();
    } catch (x: any) { setMsg({ type: 'error', text: x.response?.data?.error || 'Gagal hapus user' }); }
    finally { setActionLoading(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #3ecfcf, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Manajemen User</h1>
            <span style={{ background: 'rgba(62,207,207,0.15)', color: '#3ecfcf', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
              {stats.total} Akun
            </span>
          </div>
          <p style={{ color: '#8890a4', fontSize: 13, margin: '2px 0 0' }}>
            Kelola akun pengguna, ubah role, dan monitoring aktivitas sistem
          </p>
        </div>
        <button onClick={fetchUsers} style={{ background: '#131722', border: '1px solid #1e2130', color: '#8890a4', padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { icon: Users, label: 'Total User', value: stats.total, color: '#6c63ff' },
          { icon: Shield, label: 'Admin', value: stats.admin, color: '#a855f7' },
          { icon: UserCheck, label: 'User', value: stats.user, color: '#3ecfcf' },
          { icon: AlertTriangle, label: 'Perlu Perhatian', value: 0, color: '#f59e0b' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#8890a4' }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{loading ? '...' : value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Toast */}
      {msg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 16px',
          borderRadius: 8, fontSize: 12, fontWeight: 500,
          background: msg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: msg.type === 'success' ? '#4ade80' : '#f87171',
        }}>
          {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {msg.text}
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12 }}>
        {/* Left: Table */}
        <div style={card}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f1117', borderRadius: 8, padding: '7px 12px', flex: 1, border: '1px solid #1e2130' }}>
              <Search size={14} color="#8890a4" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama atau username..."
                style={{ background: 'none', border: 'none', color: '#e2e8f0', fontSize: 12, outline: 'none', flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 3, background: '#0f1117', borderRadius: 8, padding: 3, border: '1px solid #1e2130' }}>
              {[
                { key: 'all', label: 'Semua' },
                { key: 'admin', label: 'Admin' },
                { key: 'user', label: 'User' },
              ].map(f => (
                <button key={f.key} onClick={() => setRoleFilter(f.key)} style={{
                  padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500,
                  background: roleFilter === f.key ? 'rgba(108,99,255,0.15)' : 'transparent',
                  color: roleFilter === f.key ? '#a89cff' : '#8890a4',
                }}>
                  {f.label}
                </button>
              ))}
            </div>
            <span style={{ color: '#4a5068', fontSize: 11, whiteSpace: 'nowrap' }}>{filtered.length} user</span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2130' }}>
                  {['#', 'Nama / Username', 'Role', 'Dibuat', 'Terakhir Aktif', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center' }}>
                      <Loader2 size={20} color="#8890a4" style={{ animation: 'spin 1s linear infinite' }} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#8890a4', fontSize: 13 }}>Tidak ada user ditemukan</td>
                  </tr>
                ) : (
                  filtered.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #1a1d2a', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#181b28')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px', color: '#4a5068', fontSize: 11 }}>{i + 1}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${roleColor[u.role] || '#6c63ff'}40, ${roleColor[u.role] || '#6c63ff'}15)`,
                            border: `1.5px solid ${roleColor[u.role] || '#6c63ff'}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: roleColor[u.role] || '#6c63ff',
                            flexShrink: 0,
                          }}>
                            {u.nama.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{u.nama}</div>
                            <div style={{ color: '#8890a4', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Mail size={10} /> {u.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: 14, fontSize: 10, fontWeight: 600,
                          background: roleBg[u.role] || '#1e2130',
                          color: roleColor[u.role] || '#8890a4',
                        }}>
                          {u.role === 'admin' ? <Shield size={11} /> : <UserCheck size={11} />}
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#8890a4', fontSize: 11 }}>
                        {formatDate(u.created_at)}
                      </td>
                      <td style={{ padding: '12px', color: '#8890a4', fontSize: 11 }}>
                        {formatDate(u.updated_at)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => openEdit(u)} title="Edit" style={{
                            padding: '6px 10px', borderRadius: 6, border: '1px solid #1e2130', background: 'transparent',
                            color: '#8890a4', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                          }}>
                            <Edit3 size={13} /> Edit
                          </button>
                          <button onClick={() => setDeleteModal(u)} title="Hapus" style={{
                            padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.15)', background: 'transparent',
                            color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                          }}>
                            <Trash2 size={13} /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Role Distribution */}
          <div style={card}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Distribusi Role</h3>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={rolePie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {rolePie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              {rolePie.map(r => (
                <div key={r.name} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: r.color }}>{r.value}</div>
                  <div style={{ fontSize: 10, color: '#8890a4' }}>{r.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Card */}
          <div style={card}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14 }}>Informasi</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {[
                { icon: Shield, label: 'Admin', desc: 'Akses penuh ke dashboard, analitik, manajemen user, dan konfigurasi sistem', color: '#a855f7' },
                { icon: UserCheck, label: 'User', desc: 'Akses dashboard personal, kuisioner, curhat AI, dan jaringan teman', color: '#3ecfcf' },
              ].map(({ icon: Icon, label, desc, color }) => (
                <div key={label} style={{ padding: '10px 12px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Icon size={13} color={color} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{label}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 10, color: '#8890a4', lineHeight: 1.5 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }} onClick={() => setEditModal(null)}>
          <div style={{ ...card, width: 420, maxWidth: '90vw', padding: 24, zIndex: 1001 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Edit User</h3>
              <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', color: '#8890a4', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#8890a4', marginBottom: 4, fontWeight: 500 }}>Nama</label>
                  <input value={editForm.nama} onChange={e => setEditForm({ ...editForm, nama: e.target.value })} required
                    style={{ width: '100%', padding: '9px 12px', background: '#0f1117', border: '1px solid #1e2130', borderRadius: 7, color: '#e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#8890a4', marginBottom: 4, fontWeight: 500 }}>Username</label>
                  <input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} required
                    style={{ width: '100%', padding: '9px 12px', background: '#0f1117', border: '1px solid #1e2130', borderRadius: 7, color: '#e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#8890a4', marginBottom: 4, fontWeight: 500 }}>Role</label>
                  <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f1117', border: '1px solid #1e2130', borderRadius: 7, color: '#e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#8890a4', marginBottom: 4, fontWeight: 500 }}>Password Baru (kosongkan jika tidak diubah)</label>
                  <input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '9px 12px', background: '#0f1117', border: '1px solid #1e2130', borderRadius: 7, color: '#e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#8890a4', marginBottom: 4, fontWeight: 500 }}>Bio</label>
                  <input value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#0f1117', border: '1px solid #1e2130', borderRadius: 7, color: '#e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="button" onClick={() => setEditModal(null)}
                  style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid #1e2130', borderRadius: 7, color: '#8890a4', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                  Batal
                </button>
                <button type="submit" disabled={actionLoading}
                  style={{ flex: 1, padding: '9px', background: 'linear-gradient(135deg, #6c63ff, #a855f7)', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {actionLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                  {actionLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }} onClick={() => setDeleteModal(null)}>
          <div style={{ ...card, width: 380, maxWidth: '90vw', padding: 24, zIndex: 1001, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Trash2 size={24} color="#ef4444" />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Hapus User?</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#8890a4', lineHeight: 1.5 }}>
              Anda akan menghapus <strong style={{ color: '#e2e8f0' }}>{deleteModal.nama}</strong> ({deleteModal.username}) beserta seluruh data terkait. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDeleteModal(null)}
                style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid #1e2130', borderRadius: 7, color: '#8890a4', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                Batal
              </button>
              <button onClick={handleDelete} disabled={actionLoading}
                style={{ flex: 1, padding: '9px', background: '#ef4444', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {actionLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                {actionLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
