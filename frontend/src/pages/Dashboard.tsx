import { useState, useEffect } from 'react';
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

  return (
    <div style={page}>
      <DashboardHeader />
      <StatCards data={analytics} loading={loading} />

      {/* Main Layout: Left Content (2 rows) + Right Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 12, marginBottom: 12, alignItems: 'start' }}>
        
        {/* Left Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <TrendChart data={analytics?.trendData} loading={loading} />
            <DonutCharts data={analytics} loading={loading} />
          </div>
          
          {/* Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <KorelasiChart />
            <ScatterPlot data={analytics?.scatterData} loading={loading} />
            <ModelPerformance />
          </div>
        </div>

        {/* Right Panel */}
        <div>
          <RightPanel data={analytics} loading={loading} />
        </div>
      </div>

      {/* Table full width */}
      <RespondentTable data={respondents} loading={loading} />
    </div>
  );
}
