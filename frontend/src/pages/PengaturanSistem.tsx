import { useState, useEffect } from 'react';
import {
  Settings, Save, RotateCcw, CheckCircle2, AlertTriangle, Loader2,
  SlidersHorizontal, Bell, Brain, Database, Info, Shield,
  ToggleLeft, ToggleRight, HardDrive, Activity, Clock
} from 'lucide-react';
import api from '../api';
import { card, sectionTitle } from './dashboard/styles';

interface SystemConfig {
  app_name: string;
  model_version: string;
  burnout_threshold_low: number;
  burnout_threshold_medium: number;
  psycho_threshold_low: number;
  psycho_threshold_medium: number;
  interference_weight: number;
  early_warning_enabled: boolean;
  early_warning_threshold: number;
  maintenance_mode: boolean;
  max_assessment_per_day: number;
  ai_response_enabled: boolean;
  notification_retention: number;
  data_retention_days: number;
}

const defaultConfig: SystemConfig = {
  app_name: 'QC Analytics',
  model_version: '1.0.0',
  burnout_threshold_low: 34,
  burnout_threshold_medium: 67,
  psycho_threshold_low: 34,
  psycho_threshold_medium: 67,
  interference_weight: 1.0,
  early_warning_enabled: true,
  early_warning_threshold: 0.7,
  maintenance_mode: false,
  max_assessment_per_day: 3,
  ai_response_enabled: true,
  notification_retention: 30,
  data_retention_days: 365,
};

const tabs = [
  { key: 'prediction', label: 'Prediksi & Threshold', icon: SlidersHorizontal },
  { key: 'earlywarning', label: 'Early Warning', icon: Bell },
  { key: 'assessment', label: 'Kuesioner & AI', icon: Brain },
  { key: 'system', label: 'Sistem & Data', icon: Database },
  { key: 'info', label: 'Info Versi', icon: Info },
];

export default function PengaturanSistem() {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('prediction');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (msg) { const t = setTimeout(() => setMsg(null), 3000); return () => clearTimeout(t); }
  }, [msg]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/config');
      const d = res.data;
      setConfig({
        app_name: d.AppName || defaultConfig.app_name,
        model_version: d.ModelVersion || defaultConfig.model_version,
        burnout_threshold_low: d.BurnoutThresholdLow ?? defaultConfig.burnout_threshold_low,
        burnout_threshold_medium: d.BurnoutThresholdMedium ?? defaultConfig.burnout_threshold_medium,
        psycho_threshold_low: d.PsychoThresholdLow ?? defaultConfig.psycho_threshold_low,
        psycho_threshold_medium: d.PsychoThresholdMedium ?? defaultConfig.psycho_threshold_medium,
        interference_weight: d.InterferenceWeight ?? defaultConfig.interference_weight,
        early_warning_enabled: d.EarlyWarningEnabled ?? defaultConfig.early_warning_enabled,
        early_warning_threshold: d.EarlyWarningThreshold ?? defaultConfig.early_warning_threshold,
        maintenance_mode: d.MaintenanceMode ?? defaultConfig.maintenance_mode,
        max_assessment_per_day: d.MaxAssessmentPerDay ?? defaultConfig.max_assessment_per_day,
        ai_response_enabled: d.AIResponseEnabled ?? defaultConfig.ai_response_enabled,
        notification_retention: d.NotificationRetention ?? defaultConfig.notification_retention,
        data_retention_days: d.DataRetentionDays ?? defaultConfig.data_retention_days,
      });
    } catch { setMsg({ type: 'error', text: 'Gagal memuat konfigurasi' }); }
    finally { setLoading(false); }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await api.put('/admin/config', {
        BurnoutThresholdLow: config.burnout_threshold_low,
        BurnoutThresholdMedium: config.burnout_threshold_medium,
        PsychoThresholdLow: config.psycho_threshold_low,
        PsychoThresholdMedium: config.psycho_threshold_medium,
        InterferenceWeight: config.interference_weight,
        EarlyWarningEnabled: config.early_warning_enabled,
        EarlyWarningThreshold: config.early_warning_threshold,
        MaintenanceMode: config.maintenance_mode,
        MaxAssessmentPerDay: config.max_assessment_per_day,
        AIResponseEnabled: config.ai_response_enabled,
        NotificationRetention: config.notification_retention,
        DataRetentionDays: config.data_retention_days,
        AppName: config.app_name,
        ModelVersion: config.model_version,
      });
      setMsg({ type: 'success', text: 'Konfigurasi sistem berhasil disimpan' });
      loadConfig();
    } catch (x: any) {
      setMsg({ type: 'error', text: x.response?.data?.error || 'Gagal menyimpan konfigurasi' });
    }
    finally { setSaving(false); }
  };

  const resetDefaults = () => {
    setConfig(defaultConfig);
    setMsg({ type: 'success', text: 'Dikembalikan ke default. Klik Simpan untuk menerapkan.' });
  };

  const update = (key: keyof SystemConfig, value: any) => setConfig({ ...config, [key]: value });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', background: '#0f1117', border: '1px solid #1e2130',
    borderRadius: 7, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#8890a4', marginBottom: 5, fontWeight: 500 };
  const helperStyle: React.CSSProperties = { fontSize: 10, color: '#4a5068', marginTop: 3 };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: value ? '#22c55e' : '#2a2e42',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: value ? 22 : 2, width: 20, height: 20,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );

  if (loading) {
    return (
      <div style={{ padding: '22px 24px', background: '#0b0d14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #64748b, #6c63ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Pengaturan Sistem</h1>
            <span style={{ background: 'rgba(108,99,255,0.15)', color: '#a89cff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
              v{config.model_version}
            </span>
          </div>
          <p style={{ color: '#8890a4', fontSize: 13, margin: '2px 0 0' }}>
            Konfigurasi parameter sistem, threshold prediksi, dan pengaturan global aplikasi
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={resetDefaults} style={{ background: '#131722', border: '1px solid #1e2130', color: '#8890a4', padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={14} /> Default
          </button>
          <button onClick={saveConfig} disabled={saving}
            style={{ background: 'linear-gradient(135deg, #6c63ff, #22c55e)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
          </button>
        </div>
      </div>

      {/* Message Toast */}
      {msg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 16px',
          borderRadius: 8, fontSize: 12, fontWeight: 500,
          background: msg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: msg.type === 'success' ? '#4ade80' : '#f87171',
        }}>
          {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {msg.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#131722', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid #1e2130' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
              background: activeTab === key ? 'rgba(108,99,255,0.18)' : 'transparent',
              color: activeTab === key ? '#a89cff' : '#8890a4',
              display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s',
            }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div style={{ maxWidth: 800 }}>
        {activeTab === 'prediction' && (
          <div style={card}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <SlidersHorizontal size={16} color="#6c63ff" /> Threshold Prediksi Burnout
            </h3>
            <p style={{ fontSize: 11, color: '#8890a4', margin: '0 0 18px' }}>Atur batas nilai untuk klasifikasi tingkat risiko burnout dan psikosomatis.</p>

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ ...labelStyle, margin: 0 }}>Ambang Rendah → Sedang (Burnout)</label>
                <span style={{ fontSize: 11, color: '#a89cff', fontWeight: 600 }}>{config.burnout_threshold_low}</span>
              </div>
              <input type="range" min={10} max={50} step={1} value={config.burnout_threshold_low}
                onChange={e => update('burnout_threshold_low', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#6c63ff' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: '#4a5068' }}>10</span>
                <span style={{ fontSize: 10, color: '#4a5068' }}>50</span>
              </div>
              <p style={helperStyle}>Skor di bawah nilai ini diklasifikasikan sebagai "Rendah"</p>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ ...labelStyle, margin: 0 }}>Ambang Sedang → Tinggi (Burnout)</label>
                <span style={{ fontSize: 11, color: '#a89cff', fontWeight: 600 }}>{config.burnout_threshold_medium}</span>
              </div>
              <input type="range" min={30} max={85} step={1} value={config.burnout_threshold_medium}
                onChange={e => update('burnout_threshold_medium', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#6c63ff' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: '#4a5068' }}>30</span>
                <span style={{ fontSize: 10, color: '#4a5068' }}>85</span>
              </div>
              <p style={helperStyle}>Skor di atas nilai ini diklasifikasikan sebagai "Tinggi"</p>
            </div>

            <div style={{ height: 1, background: '#1e2130', margin: '18px 0' }} />

            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Shield size={16} color="#3ecfcf" /> Threshold Psikosomatis
            </h3>

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ ...labelStyle, margin: 0 }}>Ambang Rendah → Sedang (Psikosomatis)</label>
                <span style={{ fontSize: 11, color: '#3ecfcf', fontWeight: 600 }}>{config.psycho_threshold_low}</span>
              </div>
              <input type="range" min={10} max={50} step={1} value={config.psycho_threshold_low}
                onChange={e => update('psycho_threshold_low', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#3ecfcf' }} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ ...labelStyle, margin: 0 }}>Ambang Sedang → Tinggi (Psikosomatis)</label>
                <span style={{ fontSize: 11, color: '#3ecfcf', fontWeight: 600 }}>{config.psycho_threshold_medium}</span>
              </div>
              <input type="range" min={30} max={85} step={1} value={config.psycho_threshold_medium}
                onChange={e => update('psycho_threshold_medium', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#3ecfcf' }} />
            </div>

            <div style={{ height: 1, background: '#1e2130', margin: '18px 0' }} />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ ...labelStyle, margin: 0 }}>Bobot Interferensi Kuantum (γ)</label>
                <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{config.interference_weight.toFixed(1)}</span>
              </div>
              <input type="range" min={0.1} max={3.0} step={0.1} value={config.interference_weight}
                onChange={e => update('interference_weight', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: '#4a5068' }}>0.1</span>
                <span style={{ fontSize: 10, color: '#4a5068' }}>3.0</span>
              </div>
              <p style={helperStyle}>Semakin tinggi bobot, semakin besar pengaruh interferensi kuantum dalam prediksi</p>
            </div>
          </div>
        )}

        {activeTab === 'earlywarning' && (
          <div style={card}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Bell size={16} color="#f59e0b" /> Early Warning System
            </h3>
            <p style={{ fontSize: 11, color: '#8890a4', margin: '0 0 18px' }}>Konfigurasi sistem peringatan dini untuk deteksi risiko burnout tinggi.</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>Aktifkan Early Warning</div>
                <div style={{ fontSize: 10, color: '#8890a4' }}>Notifikasi otomatis saat risiko burnout tinggi terdeteksi</div>
              </div>
              <Toggle value={config.early_warning_enabled} onChange={v => update('early_warning_enabled', v)} />
            </div>

            {config.early_warning_enabled && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Ambang Peringatan Risiko</label>
                  <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{(config.early_warning_threshold * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min={0.3} max={0.95} step={0.05} value={config.early_warning_threshold}
                  onChange={e => update('early_warning_threshold', Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: '#4a5068' }}>30%</span>
                  <span style={{ fontSize: 10, color: '#4a5068' }}>95%</span>
                </div>
                <p style={helperStyle}>Pengguna dengan probabilitas burnout di atas threshold ini akan mendapat peringatan</p>
              </div>
            )}

            <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <AlertTriangle size={13} color="#f59e0b" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b' }}>Penting!</span>
              </div>
              <p style={{ margin: 0, fontSize: 10, color: '#8890a4', lineHeight: 1.5 }}>
                Ambang yang terlalu rendah akan menghasilkan banyak false positive. Ambang yang terlalu tinggi dapat melewatkan kasus kritis. Rentang optimal: 60% - 80%.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'assessment' && (
          <div style={card}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Brain size={16} color="#a855f7" /> Kuesioner & AI
            </h3>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Maksimal Asesmen Per Hari</label>
              <input type="number" min={1} max={20} value={config.max_assessment_per_day}
                onChange={e => update('max_assessment_per_day', Number(e.target.value))}
                style={{ ...inputStyle, width: 120 }} />
              <p style={helperStyle}>Batas kuisioner harian per pengguna untuk mencegah spam data</p>
            </div>

            <div style={{ height: 1, background: '#1e2130', margin: '18px 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>AI Response (Curhat)</div>
                <div style={{ fontSize: 10, color: '#8890a4' }}>Aktifkan respon AI otomatis pada fitur curhat anonim</div>
              </div>
              <Toggle value={config.ai_response_enabled} onChange={v => update('ai_response_enabled', v)} />
            </div>

            <div style={{ padding: '12px 14px', background: 'rgba(168,85,247,0.06)', borderRadius: 8, border: '1px solid rgba(168,85,247,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Info size={13} color="#a855f7" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#a855f7' }}>Catatan</span>
              </div>
              <p style={{ margin: 0, fontSize: 10, color: '#8890a4', lineHeight: 1.5 }}>
                AI response menggunakan NLP engine lokal untuk menganalisis sentimen dan menghasilkan respons yang empatik. Tidak ada data yang dikirim ke layanan eksternal.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div style={card}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Database size={16} color="#22c55e" /> Sistem & Retensi Data
            </h3>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Nama Aplikasi</label>
              <input type="text" value={config.app_name}
                onChange={e => update('app_name', e.target.value)}
                style={{ ...inputStyle, maxWidth: 300 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>Mode Pemeliharaan</div>
                <div style={{ fontSize: 10, color: '#8890a4' }}>Nonaktifkan akses pengguna, hanya admin yang bisa login</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: config.maintenance_mode ? '#ef4444' : '#8890a4' }}>
                  {config.maintenance_mode ? 'AKTIF' : 'Nonaktif'}
                </span>
                <Toggle value={config.maintenance_mode} onChange={v => update('maintenance_mode', v)} />
              </div>
            </div>

            <div style={{ height: 1, background: '#1e2130', margin: '18px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>
                  <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Retensi Notifikasi (hari)
                </label>
                <input type="number" min={1} max={365} value={config.notification_retention}
                  onChange={e => update('notification_retention', Number(e.target.value))}
                  style={{ ...inputStyle, width: 120 }} />
                <p style={helperStyle}>Notifikasi lebih lama dari ini akan otomatis dihapus</p>
              </div>
              <div>
                <label style={labelStyle}>
                  <HardDrive size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Retensi Data (hari)
                </label>
                <input type="number" min={30} max={1825} value={config.data_retention_days}
                  onChange={e => update('data_retention_days', Number(e.target.value))}
                  style={{ ...inputStyle, width: 120 }} />
                <p style={helperStyle}>Data prediksi & asesmen lebih lama akan diarsipkan</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div style={card}>
            <h3 style={{ ...sectionTitle, margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Info size={16} color="#6c63ff" /> Informasi Sistem
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Nama Aplikasi', value: config.app_name },
                { label: 'Versi Model', value: config.model_version },
                { label: 'Framework Backend', value: 'Go (Gin) + GORM' },
                { label: 'Database', value: 'MySQL (nexusmind)' },
                { label: 'ML Engine', value: 'scikit-learn + NumPy + Transformers' },
                { label: 'Frontend', value: 'React 18 + TypeScript + Vite' },
                { label: 'Auth Method', value: 'JWT (HS256) + Google OAuth 2.0' },
                { label: 'Deployment', value: 'Local / Self-hosted' },
              ].map(({ label, value }, i) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: i % 2 === 0 ? '#0f1117' : 'transparent',
                  borderRadius: 6,
                }}>
                  <span style={{ fontSize: 12, color: '#8890a4' }}>{label}</span>
                  <span style={{ fontSize: 12, color: '#c0c9e0', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: '#1e2130', margin: '18px 0' }} />

            <div>
              <label style={labelStyle}>Versi Model</label>
              <input type="text" value={config.model_version}
                onChange={e => update('model_version', e.target.value)}
                style={{ ...inputStyle, maxWidth: 200 }} />
              <p style={helperStyle}>Digunakan untuk tracking versi model yang sedang aktif</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
