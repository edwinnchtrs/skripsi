import { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText, Download, Printer, FileSpreadsheet, FileType, Loader2,
  TrendingUp, Users, AlertTriangle, Calendar, Filter, RefreshCw,
  BarChart3, PieChart, Activity, Eye, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import api from '../api';
import { card, sectionTitle } from './dashboard/styles';

interface Analytics {
  totalRespondents: number;
  avgBurnout: number;
  highRiskCount: number;
  totalPredictions: number;
  burnoutDist: Record<string, number>;
  psychoDist: Record<string, number>;
  scatterData: { x: number; y: number }[];
  trendData: { date: string; semua: number }[];
}

interface Respondent {
  id: number;
  nama: string;
  username: string;
  latest_burnout: number;
  latest_risk: string;
  latest_psychosomatic: number;
  last_activity: string;
}

interface UserType {
  id: number;
  username: string;
  nama: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const reportTypes = [
  { key: 'burnout', label: 'Ringkasan Burnout', icon: TrendingUp },
  { key: 'psycho', label: 'Risiko Psikosomatis', icon: AlertTriangle },
  { key: 'respondent', label: 'Data Responden', icon: Users },
  { key: 'trend', label: 'Tren & Analitik', icon: Activity },
];

export default function Laporan() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [respondents, setRespondents] = useState<Respondent[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('burnout');
  const [dateRange, setDateRange] = useState('all');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, rRes, uRes] = await Promise.all([
          api.get('/admin/analytics'),
          api.get('/responden'),
          api.get('/admin/users'),
        ]);
        setAnalytics(aRes.data);
        setRespondents(rRes.data.respondents || []);
        setUsers(uRes.data.users || []);
      } catch (e) { console.error('Failed to fetch report data', e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // ---- EXPORT HELPERS (pure JS, no libraries) ----

  const downloadBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const escapeCSV = (v: any) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const generateReportHTML = (title: string, subtitle: string, tableHTML: string, summaries: string) => `
    <html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body{font-family:Inter,sans-serif;color:#1e293b;padding:24px 32px;max-width:900px;margin:auto}
      h1{font-size:20px;color:#0f172a;margin:0 0 4px}
      h2{font-size:13px;color:#64748b;font-weight:400;margin:0 0 20px}
      .meta{font-size:10px;color:#94a3b8;margin-bottom:16px}
      .summaries{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
      .sum-box{flex:1;min-width:120px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;text-align:center}
      .sum-box .v{font-size:20px;font-weight:700;color:#0f172a}
      .sum-box .l{font-size:10px;color:#94a3b8;margin-top:2px}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th{background:#f1f5f9;padding:8px 10px;text-align:left;font-weight:600;color:#475569;border-bottom:2px solid #e2e8f0}
      td{padding:7px 10px;border-bottom:1px solid #f1f5f9}
      tr:nth-child(even){background:#fafbfc}
      .badge{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600}
      .badge-high{background:#fef2f2;color:#dc2626}
      .badge-med{background:#fffbeb;color:#d97706}
      .badge-low{background:#f0fdf4;color:#16a34a}
      @media print{body{padding:0}@page{margin:1.5cm}}
    </style></head><body>
    <h1>${title}</h1><h2>${subtitle}</h2>
    <div class="meta">Tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} | QC Analytics</div>
    ${summaries}
    ${tableHTML}
    </body></html>`;

  // ---- CSV EXPORT ----
  const exportCSV = () => {
    let csv = '';
    const t = new Date().toISOString().slice(0, 10);

    if (activeReport === 'burnout') {
      csv = 'Kategori,Jumlah\n';
      if (analytics) {
        csv += `Rendah,${analytics.burnoutDist?.Rendah || 0}\n`;
        csv += `Sedang,${analytics.burnoutDist?.Sedang || 0}\n`;
        csv += `Tinggi,${analytics.burnoutDist?.Tinggi || 0}\n`;
      }
      csv += `\nTotal Responden,${analytics?.totalRespondents || 0}\n`;
      csv += `Rata-rata Burnout,${analytics?.avgBurnout?.toFixed(1) || 0}\n`;
      csv += `Risiko Tinggi,${analytics?.highRiskCount || 0}\n`;
      downloadBlob(csv, `laporan-burnout-${t}.csv`, 'text/csv');
    } else if (activeReport === 'psycho') {
      csv = 'Kategori,Jumlah\n';
      if (analytics) {
        csv += `Rendah,${analytics.psychoDist?.Rendah || 0}\n`;
        csv += `Sedang,${analytics.psychoDist?.Sedang || 0}\n`;
        csv += `Tinggi,${analytics.psychoDist?.Tinggi || 0}\n`;
      }
      downloadBlob(csv, `laporan-psikosomatis-${t}.csv`, 'text/csv');
    } else if (activeReport === 'respondent') {
      csv = 'No,Nama,Username,Skor Burnout,Risiko,Skor Psikosomatis,Aktivitas Terakhir\n';
      respondents.forEach((r, i) => {
        csv += `${i + 1},${escapeCSV(r.nama)},${escapeCSV(r.username)},${r.latest_burnout?.toFixed(1) || '-'},${r.latest_risk || '-'},${r.latest_psychosomatic?.toFixed(1) || '-'},${escapeCSV(formatDateTime(r.last_activity))}\n`;
      });
      downloadBlob(csv, `laporan-responden-${t}.csv`, 'text/csv');
    } else if (activeReport === 'trend') {
      csv = 'Tanggal,Rata-rata Burnout\n';
      analytics?.trendData?.forEach(d => {
        csv += `${d.date},${d.semua.toFixed(1)}\n`;
      });
      downloadBlob(csv, `laporan-tren-${t}.csv`, 'text/csv');
    }
  };

  // ---- EXCEL EXPORT (HTML-based) ----
  const exportExcel = () => {
    const t = new Date().toISOString().slice(0, 10);
    let tableHTML = '';
    let summaries = '';
    let title = '';
    let subtitle = '';

    if (activeReport === 'burnout') {
      title = 'Laporan Ringkasan Burnout';
      subtitle = `Total Responden: ${analytics?.totalRespondents || 0} | Rata-rata: ${analytics?.avgBurnout?.toFixed(1) || 0}%`;
      summaries = `<div class="summaries">
        <div class="sum-box"><div class="v">${analytics?.totalRespondents || 0}</div><div class="l">Total Responden</div></div>
        <div class="sum-box"><div class="v">${analytics?.avgBurnout?.toFixed(1) || 0}%</div><div class="l">Rata-rata Burnout</div></div>
        <div class="sum-box"><div class="v">${analytics?.highRiskCount || 0}</div><div class="l">Risiko Tinggi</div></div>
        <div class="sum-box"><div class="v">${analytics?.totalPredictions || 0}</div><div class="l">Total Prediksi</div></div>
      </div>`;
      const dist = analytics?.burnoutDist || {};
      tableHTML = `<table><tr><th>Kategori</th><th>Jumlah</th><th>Persentase</th></tr>
        <tr><td>Rendah</td><td>${dist.Rendah || 0}</td><td>${analytics ? ((dist.Rendah || 0) / (analytics.totalRespondents || 1) * 100).toFixed(1) : 0}%</td></tr>
        <tr><td>Sedang</td><td>${dist.Sedang || 0}</td><td>${analytics ? ((dist.Sedang || 0) / (analytics.totalRespondents || 1) * 100).toFixed(1) : 0}%</td></tr>
        <tr><td>Tinggi</td><td>${dist.Tinggi || 0}</td><td>${analytics ? ((dist.Tinggi || 0) / (analytics.totalRespondents || 1) * 100).toFixed(1) : 0}%</td></tr>
      </table>`;
    } else if (activeReport === 'psycho') {
      title = 'Laporan Risiko Psikosomatis';
      subtitle = `Distribusi risiko psikosomatis responden`;
      const dist = analytics?.psychoDist || {};
      summaries = `<div class="summaries">
        <div class="sum-box"><div class="v">${dist.Rendah || 0}</div><div class="l">Risiko Rendah</div></div>
        <div class="sum-box"><div class="v">${dist.Sedang || 0}</div><div class="l">Risiko Sedang</div></div>
        <div class="sum-box"><div class="v">${dist.Tinggi || 0}</div><div class="l">Risiko Tinggi</div></div>
      </div>`;
      tableHTML = `<table><tr><th>Kategori</th><th>Jumlah</th></tr>
        <tr><td>Rendah</td><td>${dist.Rendah || 0}</td></tr>
        <tr><td>Sedang</td><td>${dist.Sedang || 0}</td></tr>
        <tr><td>Tinggi</td><td>${dist.Tinggi || 0}</td></tr>
      </table>`;
    } else if (activeReport === 'respondent') {
      title = 'Laporan Data Responden';
      subtitle = `${respondents.length} responden terdaftar`;
      summaries = `<div class="summaries">
        <div class="sum-box"><div class="v">${respondents.length}</div><div class="l">Total Responden</div></div>
        <div class="sum-box"><div class="v">${respondents.filter(r => r.latest_risk === 'High').length}</div><div class="l">Risiko Tinggi</div></div>
      </div>`;
      tableHTML = '<table><tr><th>No</th><th>Nama</th><th>Username</th><th>Skor Burnout</th><th>Risiko</th><th>Skor Psikosomatis</th><th>Aktivitas Terakhir</th></tr>';
      respondents.forEach((r, i) => {
        const riskBadge = r.latest_risk === 'High' ? 'badge-high' : r.latest_risk === 'Medium' ? 'badge-med' : 'badge-low';
        tableHTML += `<tr><td>${i + 1}</td><td>${r.nama}</td><td>${r.username}</td><td>${r.latest_burnout?.toFixed(1) || '-'}</td><td><span class="badge ${riskBadge}">${r.latest_risk || '-'}</span></td><td>${r.latest_psychosomatic?.toFixed(1) || '-'}</td><td>${formatDateTime(r.last_activity)}</td></tr>`;
      });
      tableHTML += '</table>';
    } else if (activeReport === 'trend') {
      title = 'Laporan Tren Burnout';
      subtitle = 'Tren rata-rata skor burnout per tanggal';
      tableHTML = '<table><tr><th>Tanggal</th><th>Rata-rata Burnout</th></tr>';
      analytics?.trendData?.forEach(d => {
        tableHTML += `<tr><td>${d.date}</td><td>${d.semua.toFixed(1)}%</td></tr>`;
      });
      tableHTML += '</table>';
    }

    const html = generateReportHTML(title, subtitle, tableHTML, summaries);
    downloadBlob(html, `laporan-${activeReport}-${t}.xls`, 'application/vnd.ms-excel');
  };

  // ---- PDF EXPORT (browser print) ----
  const exportPDF = () => {
    const t = new Date().toISOString().slice(0, 10);
    let title = '';
    let bodyHTML = '';
    let subtitle = '';

    if (activeReport === 'burnout') {
      title = 'Laporan Ringkasan Burnout';
      subtitle = `Total: ${analytics?.totalRespondents || 0} responden | Rata-rata: ${analytics?.avgBurnout?.toFixed(1) || 0}%`;
      const dist = analytics?.burnoutDist || {};
      bodyHTML = `<table><tr><th>Kategori</th><th>Jumlah</th><th>%</th></tr>
        <tr><td>Rendah</td><td>${dist.Rendah || 0}</td><td>${analytics ? ((dist.Rendah || 0) / (analytics.totalRespondents || 1) * 100).toFixed(1) : 0}%</td></tr>
        <tr><td>Sedang</td><td>${dist.Sedang || 0}</td><td>${analytics ? ((dist.Sedang || 0) / (analytics.totalRespondents || 1) * 100).toFixed(1) : 0}%</td></tr>
        <tr><td>Tinggi</td><td>${dist.Tinggi || 0}</td><td>${analytics ? ((dist.Tinggi || 0) / (analytics.totalRespondents || 1) * 100).toFixed(1) : 0}%</td></tr>
      </table>`;
    } else if (activeReport === 'respondent') {
      title = 'Laporan Data Responden';
      subtitle = `${respondents.length} responden`;
      bodyHTML = '<table><tr><th>No</th><th>Nama</th><th>Username</th><th>Skor Burnout</th><th>Risiko</th><th>Skor Psikosomatis</th></tr>';
      respondents.forEach((r, i) => {
        bodyHTML += `<tr><td>${i + 1}</td><td>${r.nama}</td><td>${r.username}</td><td>${r.latest_burnout?.toFixed(1) || '-'}</td><td>${r.latest_risk || '-'}</td><td>${r.latest_psychosomatic?.toFixed(1) || '-'}</td></tr>`;
      });
      bodyHTML += '</table>';
    } else if (activeReport === 'trend') {
      title = 'Laporan Tren Burnout';
      bodyHTML = '<table><tr><th>Tanggal</th><th>Rata-rata Burnout</th></tr>';
      analytics?.trendData?.forEach(d => {
        bodyHTML += `<tr><td>${d.date}</td><td>${d.semua.toFixed(1)}%</td></tr>`;
      });
      bodyHTML += '</table>';
    } else {
      title = 'Laporan Risiko Psikosomatis';
      const dist = analytics?.psychoDist || {};
      bodyHTML = `<table><tr><th>Kategori</th><th>Jumlah</th></tr>
        <tr><td>Rendah</td><td>${dist.Rendah || 0}</td></tr>
        <tr><td>Sedang</td><td>${dist.Sedang || 0}</td></tr>
        <tr><td>Tinggi</td><td>${dist.Tinggi || 0}</td></tr>
      </table>`;
    }

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (printWin) {
      printWin.document.write(`
        <html><head><meta charset="utf-8"><title>${title}</title>
        <style>
          body{font-family:Inter,sans-serif;color:#1e293b;padding:24px 32px}
          h1{font-size:18px;color:#0f172a;margin:0 0 4px}
          h2{font-size:12px;color:#64748b;font-weight:400;margin:0 0 16px}
          .meta{font-size:10px;color:#94a3b8;margin-bottom:16px}
          table{width:100%;border-collapse:collapse;font-size:11px}
          th{background:#f1f5f9;padding:8px 10px;text-align:left;font-weight:600;border-bottom:2px solid #e2e8f0}
          td{padding:7px 10px;border-bottom:1px solid #f1f5f9}
          @media print{body{padding:0}@page{margin:1.2cm}}
        </style></head><body>
        <h1>${title}</h1><h2>${subtitle}</h2>
        <div class="meta">Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} | QC Analytics</div>
        ${bodyHTML}
        </body></html>
      `);
      printWin.document.close();
      setTimeout(() => printWin.print(), 500);
    }
  };

  // ---- PRINT (full page) ----
  const handlePrint = () => { window.print(); };

  const riskBadge = (risk: string) => {
    const map: Record<string, { bg: string; c: string }> = {
      High: { bg: 'rgba(239,68,68,0.12)', c: '#ef4444' },
      Medium: { bg: 'rgba(245,158,11,0.12)', c: '#f59e0b' },
      Low: { bg: 'rgba(34,197,94,0.12)', c: '#22c55e' },
    };
    const s = map[risk] || { bg: 'rgba(136,144,164,0.12)', c: '#8890a4' };
    return { ...s, label: risk === 'High' ? 'Tinggi' : risk === 'Medium' ? 'Sedang' : risk === 'Low' ? 'Rendah' : risk || '-' };
  };

  const donutColors = ['#22c55e', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <Loader2 size={24} color="#8890a4" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #22c55e, #3ecfcf)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Laporan</h1>
            <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
              Export Ready
            </span>
          </div>
          <p style={{ color: '#8890a4', fontSize: 13, margin: '2px 0 0' }}>
            Generate dan ekspor laporan analitik dalam format PDF, Excel, CSV, atau cetak langsung
          </p>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#131722', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid #1e2130' }}>
        {reportTypes.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveReport(key)}
            style={{
              padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
              background: activeReport === key ? 'rgba(34,197,94,0.15)' : 'transparent',
              color: activeReport === key ? '#4ade80' : '#8890a4',
              display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s',
            }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Export Buttons + Date Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCSV}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#131722', border: '1px solid #1e2130', color: '#8890a4', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
            <FileType size={14} /> Export CSV
          </button>
          <button onClick={exportExcel}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#131722', border: '1px solid #22c55e40', color: '#4ade80', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button onClick={exportPDF}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#131722', border: '1px solid #ef444440', color: '#f87171', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
            <FileText size={14} /> Export PDF
          </button>
          <button onClick={handlePrint}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#131722', border: '1px solid #f59e0b40', color: '#fbbf24', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
            <Printer size={14} /> Cetak
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#131722', border: '1px solid #1e2130', borderRadius: 8, padding: '6px 12px' }}>
          <Calendar size={13} color="#8890a4" />
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            style={{ background: 'none', border: 'none', color: '#e2e8f0', fontSize: 11, outline: 'none', cursor: 'pointer' }}>
            <option value="all">Semua Waktu</option>
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
            <option value="90d">90 Hari Terakhir</option>
          </select>
        </div>
      </div>

      <div ref={printRef}>
        {/* Report Content */}
        {activeReport === 'burnout' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Total Responden', value: analytics?.totalRespondents || 0, color: '#6c63ff' },
                { label: 'Rata-rata Burnout', value: (analytics?.avgBurnout || 0).toFixed(1) + '%', color: '#f59e0b' },
                { label: 'Risiko Tinggi', value: analytics?.highRiskCount || 0, color: '#ef4444' },
                { label: 'Total Prediksi', value: analytics?.totalPredictions || 0, color: '#3ecfcf' },
              ].map(s => (
                <div key={s.label} style={{ ...card, textAlign: 'center', padding: '18px 16px' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#8890a4', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Distribution Table + Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={card}>
                <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12 }}>Distribusi Burnout</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e2130' }}>
                      {['Kategori', 'Jumlah', 'Persentase', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Rendah', key: 'Rendah' as const, color: '#22c55e' },
                      { label: 'Sedang', key: 'Sedang' as const, color: '#f59e0b' },
                      { label: 'Tinggi', key: 'Tinggi' as const, color: '#ef4444' },
                    ].map(row => {
                      const val = analytics?.burnoutDist?.[row.key] || 0;
                      const pct = analytics ? (val / (analytics.totalRespondents || 1) * 100).toFixed(1) : '0';
                      return (
                        <tr key={row.key} style={{ borderBottom: '1px solid #1a1d2a' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: 2, background: row.color }} />
                              <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{row.label}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#c0c9e0', fontWeight: 600 }}>{val}</td>
                          <td style={{ padding: '10px 12px', color: '#8890a4' }}>{pct}%</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ width: '100%', maxWidth: 100, height: 6, background: '#1e2130', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: row.color, borderRadius: 3 }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={card}>
                <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12 }}>Visualisasi Distribusi</h3>
                <ResponsiveContainer width="100%" height={200} minWidth={1} minHeight={1}>
                  <RePieChart>
                    <Pie data={[
                      { name: 'Rendah', value: analytics?.burnoutDist?.Rendah || 0 },
                      { name: 'Sedang', value: analytics?.burnoutDist?.Sedang || 0 },
                      { name: 'Tinggi', value: analytics?.burnoutDist?.Tinggi || 0 },
                    ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {donutColors.map((c, i) => <Cell key={i} fill={c} stroke="transparent" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'psycho' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Risiko Rendah', value: analytics?.psychoDist?.Rendah || 0, color: '#22c55e' },
                { label: 'Risiko Sedang', value: analytics?.psychoDist?.Sedang || 0, color: '#f59e0b' },
                { label: 'Risiko Tinggi', value: analytics?.psychoDist?.Tinggi || 0, color: '#ef4444' },
              ].map(s => (
                <div key={s.label} style={{ ...card, textAlign: 'center', padding: '18px 16px' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#8890a4', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ ...card, padding: '16px 20px' }}>
              <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12 }}>Distribusi Risiko Psikosomatis</h3>
              <ResponsiveContainer width="100%" height={300} minWidth={1} minHeight={1}>
                <BarChart data={[
                  { name: 'Rendah', value: analytics?.psychoDist?.Rendah || 0, fill: '#22c55e' },
                  { name: 'Sedang', value: analytics?.psychoDist?.Sedang || 0, fill: '#f59e0b' },
                  { name: 'Tinggi', value: analytics?.psychoDist?.Tinggi || 0, fill: '#ef4444' },
                ]} margin={{ top: 10, right: 10, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                  <XAxis dataKey="name" tick={{ fill: '#8890a4', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8890a4', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                    {[0, 1, 2].map(i => <Cell key={i} fill={['#22c55e', '#f59e0b', '#ef4444'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeReport === 'respondent' && (
          <div style={{ ...card, overflow: 'hidden' }}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12 }}>
              Data Responden ({respondents.length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e2130' }}>
                    {['No', 'Nama', 'Username', 'Skor Burnout', 'Risiko', 'Skor Psikosomatis', 'Aktivitas Terakhir'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {respondents.map((r, i) => {
                    const risk = riskBadge(r.latest_risk);
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #1a1d2a' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#181b28')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 12px', color: '#4a5068', fontSize: 11 }}>{i + 1}</td>
                        <td style={{ padding: '10px 12px', color: '#e2e8f0', fontWeight: 500 }}>{r.nama}</td>
                        <td style={{ padding: '10px 12px', color: '#8890a4', fontSize: 11 }}>{r.username}</td>
                        <td style={{ padding: '10px 12px', color: '#c0c9e0', fontWeight: 600 }}>{r.latest_burnout?.toFixed(1) || '-'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, background: risk.bg, color: risk.c }}>
                            {risk.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#c0c9e0' }}>{r.latest_psychosomatic?.toFixed(1) || '-'}</td>
                        <td style={{ padding: '10px 12px', color: '#8890a4', fontSize: 11 }}>{formatDateTime(r.last_activity)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReport === 'trend' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...card, padding: '16px 20px' }}>
              <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12 }}>Tren Rata-rata Burnout</h3>
              <ResponsiveContainer width="100%" height={320} minWidth={1} minHeight={1}>
                <LineChart data={analytics?.trendData || []} margin={{ top: 10, right: 10, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                  <XAxis dataKey="date" tick={{ fill: '#8890a4', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8890a4', fontSize: 10 }} domain={[40, 90]} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1a1e2e', border: '1px solid #2a2e42', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="semua" stroke="#6c63ff" strokeWidth={2.5} dot={{ r: 5, fill: '#6c63ff' }} name="Rata-rata Burnout" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 12 }}>Data Tren (Tabel)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e2130' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>Tanggal</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>Rata-rata Burnout</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#8890a4', fontWeight: 500, fontSize: 11 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.trendData?.map((d, i) => {
                    const status = d.semua >= 67 ? 'Tinggi' : d.semua >= 34 ? 'Sedang' : 'Rendah';
                    const sc = status === 'Tinggi' ? '#ef4444' : status === 'Sedang' ? '#f59e0b' : '#22c55e';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #1a1d2a' }}>
                        <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{d.date}</td>
                        <td style={{ padding: '10px 12px', color: '#c0c9e0', fontWeight: 600 }}>{d.semua.toFixed(1)}%</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, background: sc + '18', color: sc }}>{status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
