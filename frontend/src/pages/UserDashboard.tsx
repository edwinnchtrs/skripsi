import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Bell, RefreshCcw, X } from 'lucide-react';
import UserDashboardHeader from './userDashboard/UserDashboardHeader';
import UserStatCards, { type Assessment, type Prediction } from './userDashboard/UserStatCards';
import PersonalTrendChart from './userDashboard/PersonalTrendChart';
import DailyQuestionnaire from './userDashboard/DailyQuestionnaire';
import AnonymousVentingFeed from './userDashboard/AnonymousVentingFeed';
import api from '../api';

export default function UserDashboard() {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await api.get('/user/history');
      setPredictions(res.data.predictions ?? []);
      setAssessments(res.data.assessments ?? []);
    } catch (err) {
      console.error('Failed to fetch user history', err);
      setHistoryError('Data dashboard belum bisa dimuat. Periksa koneksi atau coba muat ulang.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    let lastNotifId = 0;

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications/unread');
        const notifs = res.data.notifications;
        if (notifs?.length > 0) {
          const notif = notifs[0];
          if (notif.ID > lastNotifId) {
            lastNotifId = notif.ID;
            setToast({ id: notif.ID, message: notif.Message });
            await api.post(`/notifications/${notif.ID}/read`);
          }
        }
      } catch {
        // Notification polling should stay quiet when the backend is temporarily unavailable.
      }
    };

    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 3000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <main className="min-h-screen bg-[#090b12] px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.7),rgba(9,11,18,0.98))]" />

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-teal-300/30 bg-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-teal-950/40">
          <Bell className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-5">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="-mr-1 rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
            aria-label="Tutup notifikasi"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-5">
        <UserDashboardHeader />

        {historyError && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <span>{historyError}</span>
            </div>
            <button
              type="button"
              onClick={fetchHistory}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300/30 px-3 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-300/10"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Muat ulang
            </button>
          </div>
        )}

        <UserStatCards predictions={predictions} assessments={assessments} loading={historyLoading} />

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="flex min-w-0 flex-col gap-5">
            <PersonalTrendChart
              predictions={predictions}
              assessments={assessments}
              loading={historyLoading}
            />
            <DailyQuestionnaire onSubmitSuccess={fetchHistory} />
          </div>

          <div className="min-w-0">
            <AnonymousVentingFeed />
          </div>
        </section>
      </div>
    </main>
  );
}
