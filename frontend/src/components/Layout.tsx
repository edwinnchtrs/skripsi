import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthenticated = !!localStorage.getItem('token');
  const isLanding = location.pathname === '/';
  let role = '';

  try {
    role = JSON.parse(localStorage.getItem('user') || '{}')?.role || '';
  } catch {
    role = '';
  }

  const navItems =
    role === 'admin'
      ? [
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Responden', to: '/responden' },
          { label: 'Model', to: '/model' },
        ]
      : role === 'user'
        ? [
            { label: 'Dashboard', to: '/user/dashboard' },
            { label: 'Kuisioner', to: '/user/kuisioner' },
            { label: 'Curhat', to: '/user/curhat' },
          ]
        : [];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (isLanding) {
    const landingNav = [
      { label: 'Fitur', to: '#fitur' },
      { label: 'Platform', to: '#platform' },
      { label: 'Untuk Siapa', to: '#untuk-siapa' },
      { label: 'Tentang', to: '#tentang' },
      { label: 'Dokumentasi', to: '#dokumentasi' },
    ];

    return (
      <div className="min-h-screen bg-[#050816] text-slate-100">
        <header className="landing-nav fixed inset-x-0 top-0 z-50 border-b border-slate-800/70 bg-[#050816]/88">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/" className="group flex items-center gap-3" aria-label="NexusMind home">
              <span className="landing-logo-mark flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-xl font-black text-slate-50 shadow-[0_12px_34px_rgba(124,92,255,0.35)]">
                N
              </span>
              <span className="text-2xl font-black text-slate-50 transition group-hover:text-violet-200">NexusMind</span>
            </Link>

            <nav className="hidden items-center gap-10 text-sm font-semibold text-slate-200 lg:flex">
              {landingNav.map((item) => (
                <a key={item.to} href={item.to} className="landing-nav-link transition hover:text-violet-300">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-4 lg:flex">
              {isAuthenticated ? (
                <button onClick={handleLogout} className="text-sm font-semibold text-slate-200 transition hover:text-violet-300">
                  Keluar
                </button>
              ) : (
                <Link to="/login" className="text-sm font-semibold text-slate-200 transition hover:text-violet-300">
                  Masuk
                </Link>
              )}
              <Link
                to={isAuthenticated ? (role === 'admin' ? '/dashboard' : '/user/kuisioner') : '/register'}
                className="landing-primary-action inline-flex h-12 items-center justify-center rounded-xl bg-violet-500 px-6 text-sm font-bold text-slate-50 shadow-[0_18px_48px_rgba(124,92,255,0.32)] transition hover:bg-violet-400"
              >
                {isAuthenticated ? 'Buka Sistem' : 'Daftar Gratis'}
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 text-slate-100 lg:hidden"
              aria-label="Buka menu"
            >
              {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>

          {mobileOpen && (
            <div className="border-t border-slate-800 bg-[#070b19] px-4 py-4 lg:hidden">
              <nav className="mx-auto flex max-w-7xl flex-col gap-2 text-sm font-semibold text-slate-200">
                {landingNav.map((item) => (
                  <a
                    key={item.to}
                    href={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-3 transition hover:bg-slate-100/[0.06] hover:text-violet-300"
                  >
                    {item.label}
                  </a>
                ))}
                <div className="mt-3 grid gap-3 border-t border-slate-800 pt-4">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 text-slate-100"
                  >
                    Masuk
                  </Link>
                  <Link
                    to={isAuthenticated ? (role === 'admin' ? '/dashboard' : '/user/kuisioner') : '/register'}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-500 font-bold text-slate-50"
                  >
                    {isAuthenticated ? 'Buka Sistem' : 'Daftar Gratis'}
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </header>

        <main className="w-full">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans text-ink">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-hairline bg-canvas px-5 md:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center text-xl font-semibold tracking-tight">
            <span className="mr-2 text-primary">N</span> NexusMind
          </Link>

          {navItems.length > 0 && (
            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} className="transition-colors hover:text-primary">
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          {isAuthenticated ? (
            <button onClick={handleLogout} className="text-ink transition-colors hover:text-primary">
              Sign out
            </button>
          ) : (
            <>
              <Link to="/login" className="text-ink transition-colors hover:text-primary">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary h-8 px-4 text-xs">
                Daftar
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 p-8 md:p-12 lg:py-24">
        <Outlet />
      </main>

      <footer className="mt-auto shrink-0 bg-surface-dark px-8 py-16 text-onDark-soft">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-2xl font-semibold text-onDark">
              <span className="mr-2 text-primary">N</span> NexusMind
            </h3>
            <p className="text-sm leading-relaxed opacity-80">
              Platform analitik burnout dan risiko psikosomatis berbasis Quantum Cognition.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-medium text-onDark">Fitur</h4>
            <ul className="space-y-2 text-sm">
              <li>Quantum Assessment</li>
              <li>Burnout Prediction</li>
              <li>NLP Curhat Analyzer</li>
              <li>Adaptive Therapy</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-medium text-onDark">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>About</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
