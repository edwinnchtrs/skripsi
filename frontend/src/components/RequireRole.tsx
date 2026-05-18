import { Navigate, Outlet } from 'react-router-dom';

type Role = 'admin' | 'user';

function getStoredUser(): { role?: Role } | null {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export default function RequireRole({ allow }: { allow: Role[] }) {
  const token = localStorage.getItem('token');
  const user = getStoredUser();

  if (!token || !user?.role) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/user/dashboard'} replace />;
  }

  return <Outlet />;
}
