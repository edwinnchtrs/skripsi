import { Link, useNavigate, Outlet } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink font-sans">
      {/* Top Nav */}
      <header className="h-16 border-b border-hairline flex items-center justify-between px-8 bg-canvas shrink-0">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-serif font-medium tracking-tight flex items-center">
            <span className="mr-2 text-primary">✱</span> NexusMind
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <Link to="/assessment" className="hover:text-primary transition-colors">Asesmen</Link>
            <Link to="/gosip" className="hover:text-primary transition-colors">Ruang Gosip</Link>
            <Link to="/terapi" className="hover:text-primary transition-colors">Warung Terapi</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          {isAuthenticated ? (
            <button onClick={handleLogout} className="text-ink hover:text-primary transition-colors">
              Sign out
            </button>
          ) : (
            <>
              <Link to="/login" className="text-ink hover:text-primary transition-colors">Sign in</Link>
              <Link to="/register" className="btn-primary h-8 px-4 text-xs">Daftar</Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-8 md:p-12 lg:py-24">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-surface-dark text-onDark-soft py-16 px-8 mt-auto shrink-0">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="text-onDark font-serif text-2xl mb-4"><span className="text-primary mr-2">✱</span> NexusMind</h3>
            <p className="text-sm opacity-80 leading-relaxed">
              Platform analitik burnout dan risiko psikosomatis berbasis Quantum Cognition.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-onDark mb-4">Fitur</h4>
            <ul className="space-y-2 text-sm">
              <li>Quantum Assessment</li>
              <li>Burnout Prediction</li>
              <li>NLP Gosip Analyzer</li>
              <li>Adaptive Therapy</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-onDark mb-4">Company</h4>
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
