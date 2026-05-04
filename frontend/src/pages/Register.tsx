import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, UserPlus } from 'lucide-react';
import api from '../api';

const S = {
  page: {
    minHeight: '100vh',
    background: '#0b0d14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, sans-serif',
    color: '#e2e8f0',
    padding: 20,
  } as React.CSSProperties,
  card: {
    background: '#131722',
    border: '1px solid #1e2130',
    borderRadius: 16,
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  } as React.CSSProperties,
  input: {
    width: '100%',
    background: '#1a1e2e',
    border: '1px solid #2a2e42',
    borderRadius: 8,
    padding: '12px 16px',
    color: '#e2e8f0',
    fontSize: 14,
    marginBottom: 16,
    outline: 'none',
    transition: 'border 0.2s',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#8890a4',
    marginBottom: 6,
  } as React.CSSProperties,
  button: {
    width: '100%',
    background: 'linear-gradient(135deg, #6c63ff, #3ecfcf)',
    border: 'none',
    borderRadius: 8,
    padding: '12px',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    transition: 'opacity 0.2s',
  } as React.CSSProperties,
};

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.post('/register', formData);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16,
            background: 'linear-gradient(135deg, #6c63ff, #3ecfcf)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Brain size={30} color="#fff" />
          </div>
        </div>
        
        <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 8, margin: 0 }}>Create Account</h2>
        <p style={{ color: '#8890a4', fontSize: 13, textAlign: 'center', marginBottom: 32, marginTop: 0 }}>
          Daftar untuk mengakses QC Analytics
        </p>

        {error && (
          <div style={{ background: '#ef444422', border: '1px solid #ef444440', color: '#ef4444', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label style={S.label}>Full Name</label>
            <input 
              type="text" 
              style={S.input} 
              value={formData.nama} 
              onChange={(e) => setFormData({...formData, nama: e.target.value})}
              placeholder="John Doe"
              required 
            />
          </div>
          <div>
            <label style={S.label}>Username</label>
            <input 
              type="text" 
              style={S.input} 
              value={formData.username} 
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="Choose a username"
              required 
            />
          </div>
          <div>
            <label style={S.label}>Password</label>
            <input 
              type="password" 
              style={S.input} 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
              required 
            />
          </div>
          <button 
            type="submit" 
            style={{ ...S.button, opacity: loading ? 0.7 : 1 }} 
            disabled={loading}
            onMouseOver={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.opacity = '1')}
          >
            {loading ? 'Creating account...' : <><UserPlus size={18} /> Sign Up</>}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#8890a4' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#6c63ff', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
