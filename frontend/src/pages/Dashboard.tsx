import { useState, useEffect, useMemo } from 'react';
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

const page: React.CSSProperties = {
  padding: '22px 24px',
  background: '#0b0d14',
  minHeight: '100vh',
  color: '#e2e8f0',
  fontFamily: 'Inter, sans-serif',
};

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [respondents, setRespondents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, respondentsRes] = await Promise.all([
          api.get('/admin/analytics'),
          api.get('/responden')
        ]);
        setAnalytics(analyticsRes.data);
        setRespondents(respondentsRes.data.respondents || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter trend data by date range
  const filteredTrend = useMemo(() => {
    const data = analytics?.trendData || [];
    if (dateFilter === 'all' || !data.length) return data;
    const days: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, 'this-month': 30, 'last-month': 30 };
    const limit = days[dateFilter] || data.length;
    return data.slice(Math.max(0, data.length - limit));
  }, [analytics, dateFilter]);

  // Filter respondents by group
  const filteredRespondents = useMemo(() => {
    if (groupFilter === 'all') return respondents;
    return respondents.filter((r: any) => {
      const kelompok = r.id % 2 === 0 ? 'mahasiswa' : 'karyawan';
      return kelompok === groupFilter;
    });
  }, [respondents, groupFilter]);

  return (
    <div style={page}>
      <DashboardHeader
        dateFilter={dateFilter}
        groupFilter={groupFilter}
        onDateChange={setDateFilter}
        onGroupChange={setGroupFilter}
      />
      <StatCards data={analytics} loading={loading} />

      {/* Main Layout: Left Content (2 rows) + Right Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 12, marginBottom: 12, alignItems: 'start' }}>
        
        {/* Left Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <TrendChart data={filteredTrend} loading={loading} />
            <DonutCharts data={analytics} loading={loading} />
          </div>
          
          {/* Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <KorelasiChart />
            <ScatterPlot data={analytics?.scatterData} loading={loading} />
            <ModelPerformance />
          </div>
          
          {/* Table below Row 2 to fill the gap */}
          <RespondentTable data={filteredRespondents} loading={loading} />
        </div>

        {/* Right Panel */}
        <div>
          <RightPanel data={analytics} loading={loading} />
        </div>
      </div>
    </div>
  );
}
