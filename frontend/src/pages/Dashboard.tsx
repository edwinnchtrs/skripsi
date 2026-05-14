import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import DashboardHeader from './dashboard/DashboardHeader';
import StatCards from './dashboard/StatCards';
import TrendChart from './dashboard/TrendChart';
import DonutCharts from './dashboard/DonutCharts';
import KorelasiChart from './dashboard/KorelasiChart';
import ScatterPlot from './dashboard/ScatterPlot';
import ModelPerformance from './dashboard/ModelPerformance';
import RightPanel from './dashboard/RightPanel';
import RespondentTable from './dashboard/RespondentTable';
import api from '../api';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [respondents, setRespondents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [analyticsRes, respondentsRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/responden'),
      ]);

      setAnalytics(analyticsRes.data);
      setRespondents(respondentsRes.data.respondents || []);
      setLastUpdated(new Date());
    } catch {
      setError('Gagal memuat data dashboard. Pastikan server backend aktif dan akun admin sudah login.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTrend = useMemo(() => {
    const data = analytics?.trendData || [];
    if (dateFilter === 'all' || !data.length) return data;
    const days: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, 'this-month': 30, 'last-month': 30 };
    const limit = days[dateFilter] || data.length;
    return data.slice(Math.max(0, data.length - limit));
  }, [analytics, dateFilter]);

  const filteredRespondents = useMemo(() => {
    if (groupFilter === 'all') return respondents;
    return respondents.filter((respondent: any) => {
      const group = respondent.user_type || (respondent.id % 2 === 0 ? 'mahasiswa' : 'karyawan');
      return group === groupFilter;
    });
  }, [respondents, groupFilter]);

  return (
    <main className="min-h-screen bg-[#0b0d14] px-4 py-5 text-slate-100 sm:px-6 lg:px-7">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-5">
        <DashboardHeader
          dateFilter={dateFilter}
          groupFilter={groupFilter}
          onDateChange={setDateFilter}
          onGroupChange={setGroupFilter}
          onRefresh={fetchData}
          loading={loading}
          lastUpdated={lastUpdated}
        />

        {error && (
          <div className="flex flex-col gap-3 rounded-lg border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-200" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-rose-300/30 bg-rose-300/10 px-3 text-xs font-semibold text-rose-100 transition hover:bg-rose-300/20"
            >
              <RefreshCw className="h-4 w-4" />
              Coba lagi
            </button>
          </div>
        )}

        <StatCards data={analytics} loading={loading} />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="grid min-w-0 gap-5 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <TrendChart data={filteredTrend} loading={loading} />
              </div>
              <div className="lg:col-span-2">
                <DonutCharts data={analytics} loading={loading} />
              </div>
            </div>

            <div className="grid min-w-0 gap-5 lg:grid-cols-3">
              <KorelasiChart />
              <ScatterPlot data={analytics?.scatterData} loading={loading} />
              <ModelPerformance />
            </div>

            <RespondentTable data={filteredRespondents} loading={loading} />
          </div>

          <RightPanel data={analytics} loading={loading} />
        </section>
      </div>
    </main>
  );
}
