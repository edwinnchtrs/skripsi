import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Edit3,
  Loader2,
  Mail,
  PieChart as PieIcon,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import ChartShell from '../components/ChartShell';
import api from '../api';

type AccountFilter = 'all' | 'admin' | 'mahasiswa' | 'karyawan';
type ModalMode = 'create' | 'edit';

interface ManagedUser {
  id: number;
  username: string;
  nama: string;
  role: string;
  user_type: string;
  bio: string;
  profile_pic: string;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  nama: '',
  username: '',
  role: 'user',
  user_type: 'mahasiswa',
  password: '',
  bio: '',
};

const accountMeta = {
  admin: {
    label: 'Admin',
    icon: Shield,
    chip: 'border-violet-300/25 bg-violet-500/10 text-violet-100',
    accent: '#a78bfa',
  },
  mahasiswa: {
    label: 'Mahasiswa',
    icon: UserCheck,
    chip: 'border-cyan-300/25 bg-cyan-500/10 text-cyan-100',
    accent: '#67e8f9',
  },
  karyawan: {
    label: 'Karyawan',
    icon: Users,
    chip: 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100',
    accent: '#34d399',
  },
};

const getAccountType = (user: Pick<ManagedUser, 'role' | 'user_type'>): 'admin' | 'mahasiswa' | 'karyawan' => {
  if (user.role === 'admin') return 'admin';
  return user.user_type === 'karyawan' ? 'karyawan' : 'mahasiswa';
};

const formatDate = (date: string) => {
  if (!date || date.startsWith('0001')) return '-';
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const passwordValid = (value: string) => {
  if (!value) return false;
  return value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
};

export default function ManajemenUser() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AccountFilter>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Gagal memuat data user' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(timeout);
  }, [message]);

  const stats = useMemo(() => {
    const admin = users.filter((user) => getAccountType(user) === 'admin').length;
    const mahasiswa = users.filter((user) => getAccountType(user) === 'mahasiswa').length;
    const karyawan = users.filter((user) => getAccountType(user) === 'karyawan').length;
    return { total: users.length, admin, mahasiswa, karyawan };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((user) => {
      const type = getAccountType(user);
      if (filter !== 'all' && type !== filter) return false;
      if (!keyword) return true;
      return `${user.nama} ${user.username} ${type} ${user.bio || ''}`.toLowerCase().includes(keyword);
    });
  }, [filter, search, users]);

  const pieData = [
    { name: 'Admin', value: stats.admin, color: accountMeta.admin.accent },
    { name: 'Mahasiswa', value: stats.mahasiswa, color: accountMeta.mahasiswa.accent },
    { name: 'Karyawan', value: stats.karyawan, color: accountMeta.karyawan.accent },
  ];

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setModalMode('create');
  };

  const openEdit = (user: ManagedUser) => {
    const type = getAccountType(user);
    setSelected(user);
    setForm({
      nama: user.nama,
      username: user.username,
      role: user.role,
      user_type: type === 'admin' ? 'karyawan' : type,
      password: '',
      bio: user.bio || '',
    });
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanForm = {
      ...form,
      nama: form.nama.trim(),
      username: form.username.trim().toLowerCase(),
      user_type: form.role === 'admin' ? 'karyawan' : form.user_type,
    };

    if (cleanForm.nama.length < 3) {
      setMessage({ type: 'error', text: 'Nama minimal 3 karakter' });
      return;
    }
    if (!/^[a-zA-Z0-9._@-]{3,80}$/.test(cleanForm.username)) {
      setMessage({ type: 'error', text: 'Username hanya boleh huruf, angka, titik, underscore, strip, atau email' });
      return;
    }
    if (modalMode === 'create' && !passwordValid(cleanForm.password)) {
      setMessage({ type: 'error', text: 'Password minimal 8 karakter dan wajib ada huruf besar, huruf kecil, dan angka' });
      return;
    }
    if (modalMode === 'edit' && cleanForm.password && !passwordValid(cleanForm.password)) {
      setMessage({ type: 'error', text: 'Password baru belum memenuhi aturan keamanan' });
      return;
    }

    setActionLoading(true);
    try {
      if (modalMode === 'create') {
        await api.post('/admin/users', cleanForm);
        setMessage({ type: 'success', text: `Akun ${cleanForm.nama} berhasil dibuat` });
      } else if (selected) {
        await api.put(`/admin/users/${selected.id}`, cleanForm);
        setMessage({ type: 'success', text: `Akun ${cleanForm.nama} berhasil diperbarui` });
      }
      closeModal();
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Gagal menyimpan user' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      setMessage({ type: 'success', text: `Akun ${deleteTarget.nama} berhasil dihapus` });
      setDeleteTarget(null);
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Gagal menghapus user' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0d14] px-4 py-5 text-slate-100 sm:px-6 lg:px-7">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-5">
        <header className="rounded-lg border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/20">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                <Users className="h-3.5 w-3.5" />
                User access control
              </div>
              <h1 className="text-2xl font-semibold tracking-normal text-white sm:text-3xl">Manajemen User</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Kelola akun admin, mahasiswa, dan karyawan dari satu tempat. Tambah akun baru, ubah role, perbarui profil, atau hapus akun yang tidak digunakan.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.07] disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={openCreate}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                <Plus className="h-4 w-4" />
                Tambah User
              </button>
            </div>
          </div>
        </header>

        {message && (
          <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100'
              : 'border-rose-300/25 bg-rose-500/10 text-rose-100'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { key: 'all', label: 'Total Akun', value: stats.total, icon: Users, className: 'text-slate-100 bg-slate-700/30' },
            { key: 'admin', label: 'Admin', value: stats.admin, icon: Shield, className: 'text-violet-100 bg-violet-500/10' },
            { key: 'mahasiswa', label: 'Mahasiswa', value: stats.mahasiswa, icon: UserCheck, className: 'text-cyan-100 bg-cyan-500/10' },
            { key: 'karyawan', label: 'Karyawan', value: stats.karyawan, icon: Users, className: 'text-emerald-100 bg-emerald-500/10' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as AccountFilter)}
                className={`rounded-lg border p-4 text-left shadow-xl shadow-black/10 transition ${
                  filter === item.key ? 'border-cyan-300/40 bg-slate-900' : 'border-white/10 bg-slate-950 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{loading ? '-' : item.value}</p>
                  </div>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-md ${item.className}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-lg border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Users className="h-4 w-4 text-cyan-200" />
                  Daftar Akun
                </div>
                <p className="mt-1 text-xs text-slate-500">{filteredUsers.length} akun sesuai filter</p>
              </div>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama, username, atau kategori"
                  className="h-10 w-full rounded-md border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-300/50 xl:w-80"
                />
              </label>
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-white/10">
              {loading ? (
                <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memuat data user...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center">
                  <Users className="h-9 w-9 text-slate-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-300">Tidak ada user ditemukan</p>
                  <p className="mt-1 text-xs text-slate-500">Ubah filter atau kata kunci pencarian.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[980px] table-fixed border-collapse text-sm">
                    <colgroup>
                      <col className="w-16" />
                      <col className="w-72" />
                      <col className="w-40" />
                      <col className="w-52" />
                      <col className="w-36" />
                      <col className="w-36" />
                      <col className="w-40" />
                    </colgroup>
                    <thead className="bg-white/[0.03]">
                      <tr className="border-b border-white/10 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        <th className="px-4 py-3">No</th>
                        <th className="px-4 py-3">Nama / Username</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3">Bio</th>
                        <th className="px-4 py-3">Dibuat</th>
                        <th className="px-4 py-3">Update</th>
                        <th className="px-4 py-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredUsers.map((user, index) => {
                        const type = getAccountType(user);
                        const meta = accountMeta[type];
                        const Icon = meta.icon;
                        return (
                          <tr key={user.id} className="transition hover:bg-white/[0.03]">
                            <td className="px-4 py-4 text-slate-500">{index + 1}</td>
                            <td className="px-4 py-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-white">
                                  {(user.nama || user.username || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-100" title={user.nama}>{user.nama || 'Tanpa nama'}</p>
                                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500" title={user.username}>
                                    <Mail className="h-3 w-3 shrink-0" />
                                    {user.username}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold ${meta.chip}`}>
                                <Icon className="h-3.5 w-3.5" />
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <p className="truncate text-xs text-slate-400" title={user.bio || '-'}>{user.bio || '-'}</p>
                            </td>
                            <td className="px-4 py-4 text-xs text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(user.created_at)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-xs text-slate-400">{formatDate(user.updated_at)}</td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEdit(user)}
                                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-100"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(user)}
                                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-rose-300/20 bg-rose-500/10 px-3 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-5">
            <div className="rounded-lg border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <PieIcon className="h-4 w-4 text-violet-200" />
                Distribusi Akun
              </div>
              <ChartShell height={210} className="mt-4 overflow-hidden">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={4} dataKey="value">
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#020617', border: '1px solid rgba(148,163,184,.2)', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  />
                </PieChart>
              </ChartShell>
              <div className="grid grid-cols-3 gap-2">
                {pieData.map((item) => (
                  <div key={item.name} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-center">
                    <p className="text-lg font-semibold" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[10px] text-slate-500">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
              <div className="text-sm font-semibold text-white">Akses Sistem</div>
              <div className="mt-4 space-y-3">
                {[
                  ['Admin', 'Akses penuh dashboard, responden, laporan, model, konfigurasi, dan manajemen user.', accountMeta.admin],
                  ['Mahasiswa', 'Akses portal user, kuisioner, riwayat asesmen, curhat, dan jaringan teman.', accountMeta.mahasiswa],
                  ['Karyawan', 'Akses portal user dengan kategori karyawan untuk segmentasi analitik.', accountMeta.karyawan],
                ].map(([title, desc, meta]) => {
                  const typedMeta = meta as typeof accountMeta.admin;
                  const Icon = typedMeta.icon;
                  return (
                    <div key={title as string} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                        <Icon className="h-4 w-4" style={{ color: typedMeta.accent }} />
                        {title as string}
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{desc as string}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </section>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-lg rounded-lg border border-white/10 bg-slate-950 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">{modalMode === 'create' ? 'Tambah User' : 'Edit User'}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {modalMode === 'create' ? 'Buat akun admin, mahasiswa, atau karyawan.' : 'Perbarui data akun dan akses pengguna.'}
                </p>
              </div>
              <button onClick={closeModal} className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-400">Nama lengkap</span>
                  <input
                    value={form.nama}
                    onChange={(event) => setForm({ ...form, nama: event.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-cyan-300/50"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-400">Username / email</span>
                  <input
                    value={form.username}
                    onChange={(event) => setForm({ ...form, username: event.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-cyan-300/50"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-400">Kategori akun</span>
                  <select
                    value={form.role === 'admin' ? 'admin' : form.user_type}
                    onChange={(event) => {
                      const value = event.target.value as AccountFilter;
                      if (value === 'admin') {
                        setForm({ ...form, role: 'admin', user_type: 'karyawan' });
                      } else {
                        setForm({ ...form, role: 'user', user_type: value });
                      }
                    }}
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:border-cyan-300/50"
                  >
                    <option value="admin">Admin</option>
                    <option value="mahasiswa">Mahasiswa</option>
                    <option value="karyawan">Karyawan</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-400">
                    {modalMode === 'create' ? 'Password' : 'Password baru'}
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder={modalMode === 'create' ? 'Wajib diisi' : 'Kosongkan jika tidak diubah'}
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
                    required={modalMode === 'create'}
                  />
                </label>
              </div>

              <div className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-500">
                Password minimal 8 karakter dan wajib mengandung huruf besar, huruf kecil, serta angka.
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-400">Bio</span>
                <textarea
                  value={form.bio}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/50"
                />
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-950 p-5 text-center shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rose-300/25 bg-rose-500/10 text-rose-100">
              <Trash2 className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">Hapus User?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Akun <span className="font-semibold text-white">{deleteTarget.nama}</span> akan dihapus dari sistem. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07]"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-rose-500 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
