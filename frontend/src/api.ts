import axios from 'axios';

const defaultBaseURL = '/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultBaseURL,
});

// Request: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: handle 401 — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const status = error.response?.status;
    const shouldBroadcast =
      !url.includes('/notifications/unread') &&
      !url.includes('/health') &&
      (status >= 500 || status === 404 || status === 403 || !error.response);

    if (shouldBroadcast && typeof window !== 'undefined') {
      const message = !error.response
        ? 'Backend tidak bisa diakses. Pastikan server aktif, tunnel/proxy benar, dan device berada di jaringan yang sesuai.'
        : status === 403
          ? 'Akses ditolak untuk role akun ini. Cek sesi login atau izin pengguna.'
          : status === 404
            ? 'Endpoint API tidak ditemukan. Kemungkinan frontend dan backend belum sama versinya.'
            : 'Server sedang bermasalah. Coba refresh atau cek terminal backend.';

      window.dispatchEvent(new CustomEvent('nexusmind:api-issue', {
        detail: {
          status,
          message,
          url,
          time: new Date().toISOString(),
        },
      }));
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
