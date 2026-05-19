import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
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

      <main className={isLanding ? 'w-full flex-1' : 'mx-auto w-full max-w-[1200px] flex-1 p-8 md:p-12 lg:py-24'}>
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
