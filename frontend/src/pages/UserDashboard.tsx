import { useState, useEffect } from 'react';
import UserDashboardHeader from './userDashboard/UserDashboardHeader';
import UserStatCards, { type Prediction, type Assessment } from './userDashboard/UserStatCards';
import PersonalTrendChart from './userDashboard/PersonalTrendChart';
import DailyQuestionnaire from './userDashboard/DailyQuestionnaire';
import AnonymousVentingFeed from './userDashboard/AnonymousVentingFeed';
import { Bell } from 'lucide-react';
import api from '../api';

const page: React.CSSProperties = {
  padding: '22px 24px',
  background: '#0b0d14',
  minHeight: '100vh',
  color: '#e2e8f0',
  fontFamily: 'Inter, sans-serif',
  position: 'relative',
};

export default function UserDashboard() {
  const [toast, setToast] = useState<{ id: number, message: string } | null>(null);

  // ── Real data state ──────────────────────────────────────────
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch user history (predictions + assessments)
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/user/history');
        setPredictions(res.data.predictions ?? []);
        setAssessments(res.data.assessments ?? []);
      } catch (err) {
        console.error('Failed to fetch user history', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // ── Notification polling ─────────────────────────────────────
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications/unread');
        const notifs = res.data.notifications;
        if (notifs && notifs.length > 0) {
          const notif = notifs[0];
          setToast({ id: notif.ID, message: notif.Message });
          await api.post(`/notifications/${notif.ID}/read`);
        }
      } catch (_) { /* silently ignore */ }
    };

    const interval = setInterval(fetchNotifications, 10000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Re-fetch after questionnaire submission so stats update immediately
  const handleAssessmentDone = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/user/history');
      setPredictions(res.data.predictions ?? []);
      setAssessments(res.data.assessments ?? []);
    } catch (_) { /* ignore */ }
    finally { setHistoryLoading(false); }
  };

  return (
    <div style={page}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          background: 'linear-gradient(135deg, #3ecfcf, #2dd4bf)',
          padding: '12px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 30px rgba(62, 207, 207, 0.4)',
          color: '#fff', fontWeight: 600, fontSize: 13,
          animation: 'fadeSlideIn 0.3s ease both',
        }}>
          <Bell size={16} color="#fff" />
          {toast.message}
        </div>
      )}

      <UserDashboardHeader />

      {/* Stat cards — real data */}
      <UserStatCards
        predictions={predictions}
        assessments={assessments}
        loading={historyLoading}
      />

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

        {/* Left column: Trend chart + Questionnaire */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PersonalTrendChart
            predictions={predictions}
            assessments={assessments}
            loading={historyLoading}
          />
          {/* Pass callback so chart/cards refresh after submission */}
          <DailyQuestionnaire onSubmitSuccess={handleAssessmentDone} />
        </div>

        {/* Right column: Anonymous Venting Feed */}
        <div>
          <AnonymousVentingFeed />
        </div>

      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
