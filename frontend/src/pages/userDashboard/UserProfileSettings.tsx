import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User, Camera, FileText, Lock, AtSign, UploadCloud, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function UserProfileSettings() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({ 
    bio: '', 
    profile_pic: '',
    username: '',
    password: '' // Only send if changed
  });
  
  const [originalUsername, setOriginalUsername] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'warning' } | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get('/user/profile')
      .then(res => {
        setProfile({ 
          bio: res.data.bio || '', 
          profile_pic: res.data.profile_pic || '',
          username: res.data.username || '',
          password: ''
        });
        setOriginalUsername(res.data.username || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setMessage({ text: 'Ukuran file maksimal 2MB', type: 'error' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profile_pic: reader.result as string });
        setMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload: any = {
        bio: profile.bio,
        profile_pic: profile.profile_pic,
      };

      if (profile.username && profile.username !== originalUsername) {
        payload.username = profile.username;
      }
      if (profile.password) {
        payload.password = profile.password;
      }

      const res = await api.put('/user/profile', payload);
      
      if (res.data.auth_changed) {
        setMessage({ text: 'Kredensial diubah! Anda akan dialihkan untuk login ulang...', type: 'warning' });
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }, 3000);
      } else {
        setMessage({ text: 'Profil berhasil diperbarui!', type: 'success' });
        setProfile({ ...profile, password: '' }); // Clear password field
        // Reload to update sidebar
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Gagal memperbarui profil', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '40px 50px', color: '#fff', minHeight: '100vh' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ margin: '0 0 10px', fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>Pengaturan Akun</h1>
        <p style={{ margin: 0, color: '#a0aec0', fontSize: 15 }}>Kelola identitas, foto profil, dan keamanan akun Anda di sini.</p>
      </div>

      {loading ? (
        <div style={{ color: '#a0aec0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="spinner" style={{ width: 20, height: 20, border: '2px solid #22c55e', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Memuat profil...
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
          
          {/* Tabs Navigation */}
          <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, cursor: 'pointer', border: 'none',
                background: activeTab === 'profile' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                color: activeTab === 'profile' ? '#4ade80' : '#a0aec0',
                fontWeight: activeTab === 'profile' ? 600 : 500,
                fontSize: 15, transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <User size={18} /> Profil Umum
            </button>
            <button
              onClick={() => setActiveTab('security')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, cursor: 'pointer', border: 'none',
                background: activeTab === 'security' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                color: activeTab === 'security' ? '#4ade80' : '#a0aec0',
                fontWeight: activeTab === 'security' ? 600 : 500,
                fontSize: 15, transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <Lock size={18} /> Keamanan Akun
            </button>
          </div>

          {/* Form Content */}
          <motion.div
            layout
            style={{
              flex: 1,
              background: '#151821',
              borderRadius: 20,
              padding: 40,
              border: '1px solid #1e2130',
              maxWidth: 650,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
            <form onSubmit={handleSave}>
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 style={{ marginTop: 0, marginBottom: 30, fontSize: 20, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <User size={20} color="#22c55e" /> Informasi Publik
                    </h2>

                    {/* Profile Picture Upload */}
                    <div style={{ marginBottom: 35, display: 'flex', gap: 30, alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        {profile.profile_pic ? (
                          <img src={profile.profile_pic} alt="Preview" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #22c55e', padding: 2, background: '#0f1117' }} />
                        ) : (
                          <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#2a2e42', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={40} color="#8890a4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ marginBottom: 10, fontWeight: 600, color: '#e2e8f0', fontSize: 15 }}>Foto Profil</div>
                        <div style={{ color: '#8890a4', fontSize: 13, marginBottom: 15 }}>Format JPEG, PNG. Maksimal 2MB.</div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          style={{ display: 'none' }} 
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
                            background: '#2a2e42', color: '#fff', border: '1px solid #3f445e', cursor: 'pointer',
                            fontSize: 13, fontWeight: 500, transition: 'background 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#3f445e'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#2a2e42'}
                        >
                          <UploadCloud size={16} /> Pilih dari File
                        </button>
                      </div>
                    </div>

                    {/* Bio Input */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#e2e8f0', marginBottom: 12, fontWeight: 600 }}>
                        <FileText size={16} /> Bio Singkat
                      </label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        placeholder="Tuliskan sedikit tentang diri Anda..."
                        rows={5}
                        style={{
                          width: '100%', background: '#0b0d14', border: '1px solid #1e2130', color: '#fff',
                          padding: '16px', borderRadius: 12, fontSize: 14, outline: 'none', resize: 'vertical',
                          transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#22c55e'; e.target.style.boxShadow = '0 0 0 2px rgba(34,197,94,0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#1e2130'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 style={{ marginTop: 0, marginBottom: 30, fontSize: 20, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Lock size={20} color="#22c55e" /> Keamanan Akun
                    </h2>
                    
                    <div style={{ padding: '16px 20px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: 12, marginBottom: 30 }}>
                      <div style={{ display: 'flex', gap: 12, color: '#fbbf24', fontSize: 14, lineHeight: 1.5 }}>
                        <LogOut size={20} style={{ flexShrink: 0 }} />
                        <span>Mengubah <strong>Username</strong> atau <strong>Password</strong> akan membuat Anda otomatis keluar (logout) untuk alasan keamanan. Anda harus login kembali setelahnya.</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: 25 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#e2e8f0', marginBottom: 12, fontWeight: 600 }}>
                        <AtSign size={16} /> Username Baru
                      </label>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        placeholder="Masukkan username baru..."
                        style={{
                          width: '100%', background: '#0b0d14', border: '1px solid #1e2130', color: '#fff',
                          padding: '14px 16px', borderRadius: 12, fontSize: 14, outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#22c55e'; e.target.style.boxShadow = '0 0 0 2px rgba(34,197,94,0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#1e2130'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#e2e8f0', marginBottom: 12, fontWeight: 600 }}>
                        <Lock size={16} /> Password Baru
                      </label>
                      <input
                        type="password"
                        value={profile.password}
                        onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                        placeholder="Kosongkan jika tidak ingin ganti password"
                        style={{
                          width: '100%', background: '#0b0d14', border: '1px solid #1e2130', color: '#fff',
                          padding: '14px 16px', borderRadius: 12, fontSize: 14, outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#22c55e'; e.target.style.boxShadow = '0 0 0 2px rgba(34,197,94,0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#1e2130'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ marginTop: 40 }}>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                      padding: '14px 18px', 
                      borderRadius: 12, 
                      marginBottom: 20, 
                      fontSize: 14,
                      fontWeight: 500,
                      background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 
                                  message.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: message.type === 'success' ? '#4ade80' : 
                             message.type === 'warning' ? '#fbbf24' : '#ef4444',
                      border: `1px solid ${message.type === 'success' ? '#22c55e' : 
                                          message.type === 'warning' ? '#f59e0b' : '#ef4444'}`
                    }}
                  >
                    {message.text}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', background: 'linear-gradient(135deg, #22c55e, #3ecfcf)',
                    color: '#fff', border: 'none', padding: '16px', borderRadius: 12,
                    fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1, transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: saving ? 'none' : '0 4px 15px rgba(34, 197, 94, 0.3)'
                  }}
                  onMouseOver={(e) => !saving && (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseOut={(e) => !saving && (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <Save size={20} />
                  {saving ? 'Menyimpan Perubahan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
