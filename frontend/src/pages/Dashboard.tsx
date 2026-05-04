
import DashboardHeader from './dashboard/DashboardHeader';
import StatCards from './dashboard/StatCards';
import TrendChart from './dashboard/TrendChart';
import DonutCharts from './dashboard/DonutCharts';
import KorelasiChart from './dashboard/KorelasiChart';
import ScatterPlot from './dashboard/ScatterPlot';
import ModelPerformance from './dashboard/ModelPerformance';
import RightPanel from './dashboard/RightPanel';
import RespondentTable from './dashboard/RespondentTable';

const page: React.CSSProperties = {
  padding: '22px 24px',
  background: '#0b0d14',
  minHeight: '100vh',
  color: '#e2e8f0',
  fontFamily: 'Inter, sans-serif',
};

export default function DashboardPage() {
  return (
    <div style={page}>
      <DashboardHeader />
      <StatCards />

      {/* Row 2 + Right panel (spans rows 2 & 3) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 290px', gap: 12, marginBottom: 12 }}>
        <TrendChart />
        <DonutCharts />
        {/* Right panel spans 2 rows */}
        <div style={{ gridColumn: '4', gridRow: '1 / 3' }}>
          <RightPanel />
        </div>
      </div>

      {/* Row 3 (under row 2, right panel continues) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 290px', gap: 12, marginBottom: 12 }}>
        <KorelasiChart />
        <ScatterPlot />
        <ModelPerformance />
        {/* col 4 is occupied by RightPanel above — leave empty */}
      </div>

      {/* Table full width */}
      <RespondentTable />
    </div>
  );
}
