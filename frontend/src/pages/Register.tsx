import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Brain, TrendingUp, RefreshCw, ShieldCheck,
  Users, Database, BarChart2, Percent,
  User, Lock, Eye, EyeOff, UserPlus, Mail,
} from 'lucide-react';
import api from '../api';

const features = [
  { Icon: Brain,      t: 'Quantum Cognition',  d: 'Memodelkan ketidakpastian dan pengambilan keputusan manusia secara probabilistik.' },
  { Icon: TrendingUp, t: 'Regresi Linier',     d: 'Prediksi numerik yang interpretable dan mudah diimplementasikan.' },
  { Icon: RefreshCw,  t: 'Agile Development',  d: 'Iteratif, adaptif, dan kolaboratif untuk hasil yang berkualitas.' },
  { Icon: ShieldCheck,t: 'Keamanan Data',      d: 'Data Anda aman bersama kami dengan enkripsi tingkat enterprise.' },
];
const stats = [
  { Icon: Users,    v: '1.256+',  l: 'Total Pengguna' },
  { Icon: Database, v: '12.540+', l: 'Data Responden' },
  { Icon: BarChart2,v: '3.847+',  l: 'Prediksi Dilakukan' },
  { Icon: Percent,  v: '92.7%',   l: 'Akurasi Model' },
];

export default function Register() {
  const nav = useNavigate();
  const [nama,        setNama]       = useState('');
  const [username,    setUsername]   = useState('');
  const [password,    setPassword]   = useState('');
  const [confirm,     setConfirm]    = useState('');
  const [showPw,      setShowPw]     = useState(false);
  const [showCf,      setShowCf]     = useState(false);
  const [err,         setErr]        = useState('');
  const [success,     setSuccess]    = useState('');
  const [busy,        setBusy]       = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setSuccess('');

    if (password !== confirm) {
      setErr('Kata sandi tidak cocok. Periksa kembali.');
      return;
    }
    if (password.length < 6) {
      setErr('Kata sandi minimal 6 karakter.');
      return;
    }

    setBusy(true);
    try {
      await api.post('/register', { username, password, nama });
      setSuccess('Akun berhasil dibuat! Mengarahkan ke halaman masuk...');
      setTimeout(() => nav('/login'), 1500);
    } catch (x: any) {
      setErr(x.response?.data?.error || 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .reg-root{display:flex;min-height:100vh;font-family:'Inter',sans-serif;margin:0}
        .reg-root *{box-sizing:border-box}
        .reg-root h1,.reg-root h2,.reg-root h3,.reg-root h4,.reg-root p,.reg-root label{font-family:'Inter',sans-serif !important;letter-spacing:normal}

        /* LEFT */
        .lp{width:50%;background:#080c24;color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:44px 48px;position:relative;overflow:hidden}
        .lp::before{content:'';position:absolute;top:-100px;right:-80px;width:420px;height:420px;border-radius:50%;background:rgba(99,102,241,.15);filter:blur(100px);pointer-events:none}
        .lp::after{content:'';position:absolute;bottom:-60px;left:-40px;width:320px;height:320px;border-radius:50%;background:rgba(139,92,246,.12);filter:blur(80px);pointer-events:none}
        .lp-content{position:relative;z-index:1;flex:1;display:flex;flex-direction:column}

        .lp-logo{display:flex;align-items:center;gap:12px;margin-bottom:40px}
        .lp-logo-icon{width:44px;height:44px;border-radius:12px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.3);display:flex;align-items:center;justify-content:center}
        .lp-logo-text{font-size:18px;font-weight:700;color:#fff}
        .lp-logo-sub{font-size:11px;color:#818cf8;margin-top:1px}

        .lp-hero{margin-bottom:32px}
        .lp-hero h2{font-size:32px;font-weight:800;line-height:1.2;margin:0;color:#fff}
        .lp-hero .grad{background:linear-gradient(90deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .lp-hero p{margin:16px 0 0;font-size:13px;color:#94a3b8;line-height:1.7;max-width:420px}

        .feat{display:flex;gap:14px;align-items:flex-start;margin-bottom:16px}
        .feat-icon{flex-shrink:0;width:36px;height:36px;border-radius:10px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.22);display:flex;align-items:center;justify-content:center;margin-top:2px}
        .feat h4{margin:0 0 2px;font-size:13px;font-weight:600;color:#fff !important}
        .feat p{margin:0;font-size:11.5px;color:#94a3b8;line-height:1.5}

        .stats-bar{position:relative;z-index:1;display:flex;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);overflow:hidden;margin-top:auto}
        .stat{flex:1;padding:14px 8px;text-align:center;border-right:1px solid rgba(255,255,255,.07)}
        .stat:last-child{border-right:none}
        .stat .v{font-weight:700;font-size:15px;margin-top:4px;color:#fff}
        .stat .lb{font-size:10px;color:#64748b;margin-top:2px}

        /* RIGHT */
        .rp{flex:1;background:#f1f5f9;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;position:relative}
        .rp-card{width:100%;max-width:420px;background:#fff;border-radius:24px;box-shadow:0 4px 24px rgba(0,0,0,.06);padding:36px 32px;position:relative;z-index:1}
        .rp-header{text-align:center;margin-bottom:22px}
        .rp-brain{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.08));border:1.5px solid rgba(99,102,241,.2);margin-bottom:14px}
        .rp-header h3{margin:0 0 4px;font-size:20px;font-weight:700;color:#0f172a}
        .rp-header p{margin:0;font-size:12px;color:#94a3b8}

        .field{margin-bottom:13px}
        .field label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px}
        .field .wrap{position:relative}
        .field input[type=text],.field input[type=password]{width:100%;padding:10px 14px 10px 38px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:12px;color:#111827;background:#f9fafb;outline:none;transition:border-color .2s;font-family:'Inter',sans-serif}
        .field input:focus{border-color:#6366f1}
        .field .icon-l{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#9ca3af}
        .field .icon-r{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;padding:0;display:flex}

        .btn-submit{width:100%;padding:11px;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 14px rgba(99,102,241,.3);transition:opacity .2s;font-family:'Inter',sans-serif}
        .btn-submit:hover{opacity:.9}
        .btn-submit:disabled{opacity:.6;cursor:not-allowed}

        .err-box{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:8px 12px;border-radius:8px;font-size:12px;margin-bottom:13px}
        .ok-box{background:#f0fdf4;border:1px solid #bbf7d0;color:#16a34a;padding:8px 12px;border-radius:8px;font-size:12px;margin-bottom:13px}

        .signin{text-align:center;font-size:12px;color:#6b7280;margin-top:18px}
        .signin a{color:#6366f1;font-weight:700;text-decoration:none}
        .rp-footer{margin-top:28px;font-size:11px;color:#94a3b8;position:relative;z-index:1}

        @media(max-width:1024px){.lp{display:none}.rp{width:100%}}
      `}</style>

      <div className="reg-root">
        {/* ── LEFT PANEL ── */}
        <div className="lp">
          <div className="lp-content">
            <div className="lp-logo">
              <div className="lp-logo-icon"><Brain size={22} color="#a5b4fc" /></div>
              <div>
                <div className="lp-logo-text">QC Analytics</div>
                <div className="lp-logo-sub">Quantum Cognition</div>
              </div>
            </div>

            <div className="lp-hero">
              <h2>Bergabung dengan</h2>
              <h2 className="grad">Sistem Analitik Prediktif</h2>
              <h2>Terdepan</h2>
              <p>Daftar sekarang dan mulai pantau kesehatan mental Anda dengan teknologi Quantum Cognition dan Regresi Linier yang akurat.</p>
            </div>

            {features.map(({ Icon, t, d }) => (
              <div className="feat" key={t}>
                <div className="feat-icon"><Icon size={16} color="#a5b4fc" /></div>
                <div><h4>{t}</h4><p>{d}</p></div>
              </div>
            ))}
          </div>

          <div className="stats-bar">
            {stats.map(({ Icon, v, l }) => (
              <div className="stat" key={l}>
                <Icon size={16} color="#818cf8" />
                <div className="v">{v}</div>
                <div className="lb">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="rp">
          <div className="rp-card">
            <div className="rp-header">
              <div className="rp-brain"><UserPlus size={26} color="#6366f1" /></div>
              <h3>Buat Akun Baru</h3>
              <p>Daftar untuk mengakses QC Analytics</p>
            </div>

            {err     && <div className="err-box">{err}</div>}
            {success && <div className="ok-box">{success}</div>}

            <form onSubmit={submit}>
              {/* Nama Lengkap */}
              <div className="field">
                <label>Nama Lengkap</label>
                <div className="wrap">
                  <User size={14} className="icon-l" />
                  <input
                    type="text"
                    value={nama}
                    onChange={e => setNama(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="field">
                <label>Username</label>
                <div className="wrap">
                  <Mail size={14} className="icon-l" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Pilih username unik Anda"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field">
                <label>Kata Sandi</label>
                <div className="wrap">
                  <Lock size={14} className="icon-l" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                  <button type="button" className="icon-r" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div className="field">
                <label>Konfirmasi Kata Sandi</label>
                <div className="wrap">
                  <Lock size={14} className="icon-l" />
                  <input
                    type={showCf ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Ulangi kata sandi Anda"
                    required
                  />
                  <button type="button" className="icon-r" onClick={() => setShowCf(!showCf)}>
                    {showCf ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={busy}>
                <UserPlus size={14} />
                {busy ? 'Mendaftarkan...' : 'Daftar Sekarang'}
              </button>
            </form>

            <div className="signin">
              Sudah punya akun?{' '}
              <Link to="/login">Masuk di sini</Link>
            </div>
          </div>
          <div className="rp-footer">© 2024 QC Analytics. All rights reserved.</div>
        </div>
      </div>
    </>
  );
}
