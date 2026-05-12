import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Save, RotateCcw, CheckCircle2, AlertTriangle, Loader2,
  SlidersHorizontal, Bell, Brain, Database, Info, Shield,
  HardDrive, Activity, Clock, Cpu, Globe, Server, Layers,
  Zap, EyeOff
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
  { key: 'prediction', label: 'Prediksi & Threshold', icon: SlidersHorizontal, color: '#6c63ff' },
  { key: 'earlywarning', label: 'Early Warning', icon: Bell, color: '#f59e0b' },
  { key: 'assessment', label: 'Kuesioner & AI', icon: Brain, color: '#a855f7' },
  { key: 'system', label: 'Sistem & Data', icon: Database, color: '#22c55e' },
  { key: 'info', label: 'Info Versi', icon: Info, color: '#3ecfcf' },
];

const pageStyle: React.CSSProperties = {
  padding: '22px 24px',
  background: '#0b0d14',
  minHeight: '100vh',
  color: '#e2e8f0',
  fontFamily: 'Inter, sans-serif',
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#8890a4', marginBottom: 5, fontWeight: 500 };
const helperStyle: React.CSSProperties = { fontSize: 10, color: '#4a5068', marginTop: 3 };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: '#0f1117', border: '1px solid #1e2130',
  borderRadius: 7, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

function ThresholdBar({ low, medium, color }: { low: number; medium: number; color: string }) {
  const greenPct = (low / 100) * 100;
  const amberPct = ((medium - low) / 100) * 100;
  const redPct = ((100 - medium) / 100) * 100;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 600 }}>RENDAH</span>
        <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>SEDANG</span>
        <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>TINGGI</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: '#0f1117', overflow: 'hidden', position: 'relative', border: '1px solid #1e2130' }}>
        {greenPct > 0 && (
          <motion.div
            animate={{ width: `${greenPct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'linear-gradient(90deg, #22c55e, #4ade80)', borderRadius: '4px 0 0 4px', zIndex: 1 }}
          />
        )}
        {amberPct > 0 && (
          <motion.div
            animate={{ width: `${amberPct}%`, left: `${greenPct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ position: 'absolute', top: 0, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', zIndex: 1 }}
          />
        )}
        {redPct > 0 && (
          <motion.div
            animate={{ width: `${redPct}%`, left: `${greenPct + amberPct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ position: 'absolute', top: 0, height: '100%', background: 'linear-gradient(90deg, #ef4444, #f87171)', borderRadius: '0 4px 4px 0', zIndex: 1 }}
          />
        )}
        <div style={{ position: 'absolute', left: `${greenPct}%`, top: -2, width: 2, height: 12, background: '#fff', borderRadius: 1, zIndex: 2 }} />
        <div style={{ position: 'absolute', left: `${greenPct + amberPct}%`, top: -2, width: 2, height: 12, background: '#fff', borderRadius: 1, zIndex: 2 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <motion.span
          animate={{ color: color }}
          style={{ fontSize: 10, fontWeight: 600 }}
        >0 — {low}</motion.span>
        <span style={{ fontSize: 10, color: '#4a5068' }}>{low + 1} — {medium}</span>
        <span style={{ fontSize: 10, color: '#4a5068' }}>{medium + 1} — 100</span>
      </div>
    </div>
  );
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: value ? '#22c55e' : '#2a2e42',
        position: 'relative', transition: 'background 0.25s', flexShrink: 0,
        boxShadow: value ? '0 0 8px rgba(34,197,94,0.35)' : 'none',
      }}
    >
      <motion.span
        animate={{ left: value ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute', top: 2, width: 20, height: 20,
          borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );
}

const tabVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export default function PengaturanSistem() {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [originalConfig, setOriginalConfig] = useState<SystemConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('prediction');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isDirty = JSON.stringify(config) !== JSON.stringify(originalConfig);

  useEffect(() => { loadConfig(); }, []);
  useEffect(() => {
    if (msg) { const t = setTimeout(() => setMsg(null), 3000); return () => clearTimeout(t); }
  }, [msg]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/config');
      const d = res.data;
      const loaded: SystemConfig = {
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
      };
      setConfig(loaded);
      setOriginalConfig(loaded);
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

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #1e2130', borderTopColor: '#6c63ff' }}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      style={pageStyle}
    >
      <style>{`
        input[type=range] { -webkit-appearance: none; background: transparent; height: 6px; border-radius: 3px; }
        input[type=range]::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; background: #1e2130; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #fff; margin-top: -6px; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.3); transition: transform 0.15s; }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.15); }
        input[type=number]:focus, input[type=text]:focus { border-color: #6c63ff !important; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <motion.div
              initial={{ rotate: -12, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.4, type: 'spring' }}
              style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #6c63ff, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(108,99,255,0.25)' }}
            >
              <Settings size={20} color="#fff" />
            </motion.div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Pengaturan Sistem</h1>
            <span style={{ background: 'rgba(108,99,255,0.12)', color: '#a89cff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid rgba(108,99,255,0.2)' }}>
              v{config.model_version}
            </span>
            {config.maintenance_mode && (
              <span style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <EyeOff size={12} /> Maintenance
              </span>
            )}
          </div>
          <p style={{ color: '#8890a4', fontSize: 13, margin: '2px 0 0' }}>
            Konfigurasi parameter sistem, threshold prediksi, dan pengaturan global aplikasi
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={resetDefaults}
            style={{ background: '#131722', border: '1px solid #1e2130', color: '#8890a4', padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
            <RotateCcw size={14} /> Default
          </button>
          <motion.button
            onClick={saveConfig}
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.97 }}
            style={{
              background: isDirty ? 'linear-gradient(135deg, #6c63ff, #22c55e)' : 'linear-gradient(135deg, #374151, #4b5563)',
              border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              opacity: saving ? 0.7 : 1, position: 'relative', transition: 'background 0.3s',
            }}
          >
            {isDirty && !saving && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: '#f59e0b', borderRadius: '50%', boxShadow: '0 0 6px rgba(245,158,11,0.6)' }} />
            )}
            {saving ? (
              <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Menyimpan...</>
            ) : (
              <><Save size={14} /> {isDirty ? 'Simpan Perubahan' : 'Simpan Konfigurasi'}</>
            )}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 16px',
              borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: msg.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: msg.type === 'success' ? '#4ade80' : '#f87171',
            }}
          >
            {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#131722', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid #1e2130' }}>
        {tabs.map(({ key, label, icon: Icon, color }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
              background: activeTab === key ? 'rgba(108,99,255,0.14)' : 'transparent',
              color: activeTab === key ? '#a89cff' : '#8890a4',
              display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s',
              position: 'relative',
            }}>
            <Icon size={14} /> {label}
            {activeTab === key && (
              <motion.div layoutId="tab-indicator" style={{ position: 'absolute', bottom: -2, left: '25%', right: '25%', height: 2, background: color, borderRadius: 1 }} transition={{ duration: 0.25 }} />
            )}
          </button>
        ))}
      </div>

      <div style={{ width: '100%' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'prediction' && (
            <motion.div key="prediction" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
              <div style={{ ...card, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(108,99,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <SlidersHorizontal size={18} color="#6c63ff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 4 }}>Threshold Prediksi Burnout</h3>
                    <p style={{ fontSize: 11, color: '#8890a4', margin: 0 }}>Atur batas nilai untuk klasifikasi tingkat risiko burnout dan psikosomatis. Perubahan akan langsung mempengaruhi hasil asesmen selanjutnya.</p>
                  </div>
                </div>

                <div style={{ marginTop: 20, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: '#6c63ff' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#c0c9e0' }}>Kategori Burnout</span>
                  </div>
                  <ThresholdBar low={config.burnout_threshold_low} medium={config.burnout_threshold_medium} color="#6c63ff" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <label style={{ ...labelStyle, margin: 0 }}>Ambang Rendah → Sedang</label>
                        <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 4 }}>{config.burnout_threshold_low}</span>
                      </div>
                      <input type="range" min={10} max={50} step={1} value={config.burnout_threshold_low}
                        onChange={e => update('burnout_threshold_low', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#6c63ff' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: '#4a5068' }}>10</span><span style={{ fontSize: 10, color: '#4a5068' }}>50</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <label style={{ ...labelStyle, margin: 0 }}>Ambang Sedang → Tinggi</label>
                        <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 4 }}>{config.burnout_threshold_medium}</span>
                      </div>
                      <input type="range" min={30} max={85} step={1} value={config.burnout_threshold_medium}
                        onChange={e => update('burnout_threshold_medium', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#6c63ff' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: '#4a5068' }}>30</span><span style={{ fontSize: 10, color: '#4a5068' }}>85</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: '#1e2130', margin: '22px 0' }} />

                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: '#3ecfcf' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#c0c9e0' }}>Kategori Psikosomatis</span>
                  </div>
                  <ThresholdBar low={config.psycho_threshold_low} medium={config.psycho_threshold_medium} color="#3ecfcf" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <label style={{ ...labelStyle, margin: 0 }}>Ambang Rendah → Sedang</label>
                        <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 4 }}>{config.psycho_threshold_low}</span>
                      </div>
                      <input type="range" min={10} max={50} step={1} value={config.psycho_threshold_low}
                        onChange={e => update('psycho_threshold_low', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#3ecfcf' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: '#4a5068' }}>10</span><span style={{ fontSize: 10, color: '#4a5068' }}>50</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <label style={{ ...labelStyle, margin: 0 }}>Ambang Sedang → Tinggi</label>
                        <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 4 }}>{config.psycho_threshold_medium}</span>
                      </div>
                      <input type="range" min={30} max={85} step={1} value={config.psycho_threshold_medium}
                        onChange={e => update('psycho_threshold_medium', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#3ecfcf' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: '#4a5068' }}>30</span><span style={{ fontSize: 10, color: '#4a5068' }}>85</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: '#1e2130', margin: '22px 0' }} />

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: '#f59e0b' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#c0c9e0' }}>Bobot Interferensi Kuantum (γ)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 16, alignItems: 'start' }}>
                    <div>
                      <input type="range" min={0.1} max={3.0} step={0.1} value={config.interference_weight}
                        onChange={e => update('interference_weight', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#f59e0b' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: '#4a5068' }}>0.1 (Rendah)</span>
                        <span style={{ fontSize: 10, color: '#4a5068' }}>3.0 (Tinggi)</span>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b', display: 'block' }}>{config.interference_weight.toFixed(1)}</span>
                      <span style={{ fontSize: 10, color: '#8890a4' }}>γ value</span>
                    </div>
                  </div>
                  <p style={helperStyle}>Semakin tinggi bobot, semakin besar pengaruh interferensi kuantum dalam prediksi risiko burnout</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'earlywarning' && (
            <motion.div key="earlywarning" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
              <div style={{ ...card, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bell size={18} color="#f59e0b" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 4 }}>Early Warning System</h3>
                    <p style={{ fontSize: 11, color: '#8890a4', margin: 0 }}>Sistem peringatan dini otomatis untuk mendeteksi dan merespons risiko burnout tinggi sebelum menjadi krisis.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: config.early_warning_enabled ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', padding: '5px 10px', borderRadius: 6, border: `1px solid ${config.early_warning_enabled ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.early_warning_enabled ? '#22c55e' : '#ef4444' }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: config.early_warning_enabled ? '#4ade80' : '#f87171' }}>{config.early_warning_enabled ? 'AKTIF' : 'NONAKTIF'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>Aktifkan Early Warning</div>
                    <div style={{ fontSize: 10, color: '#8890a4' }}>Notifikasi otomatis saat risiko burnout tinggi terdeteksi pada pengguna</div>
                  </div>
                  <ToggleSwitch value={config.early_warning_enabled} onChange={v => update('early_warning_enabled', v)} />
                </div>

                <AnimatePresence>
                  {config.early_warning_enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <label style={{ ...labelStyle, margin: 0 }}>Ambang Peringatan Risiko</label>
                          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 4 }}>{(config.early_warning_threshold * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12, alignItems: 'center' }}>
                          <input type="range" min={0.3} max={0.95} step={0.05} value={config.early_warning_threshold}
                            onChange={e => update('early_warning_threshold', Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#f59e0b' }} />
                          <div style={{ background: '#0f1117', border: '1px solid #1e2130', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', display: 'block' }}>{(config.early_warning_threshold * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <span style={{ fontSize: 10, color: '#4a5068' }}>30% (Sensitif)</span>
                          <span style={{ fontSize: 10, color: '#4a5068' }}>95% (Konservatif)</span>
                        </div>
                        <p style={helperStyle}>Pengguna dengan probabilitas burnout di atas threshold ini akan mendapat peringatan dini</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(245,158,11,0.05)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <AlertTriangle size={13} color="#f59e0b" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b' }}>Rekomendasi</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 10, color: '#8890a4', lineHeight: 1.6 }}>
                    Ambang terlalu rendah → banyak <span style={{ color: '#f87171' }}>false positive</span>.&nbsp;
                    Ambang terlalu tinggi → <span style={{ color: '#f87171' }}>melewatkan kasus kritis</span>.&nbsp;
                    Rentang optimal: <span style={{ color: '#4ade80', fontWeight: 600 }}>60% — 80%</span>.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'assessment' && (
            <motion.div key="assessment" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
              <div style={{ ...card, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(168,85,247,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Brain size={18} color="#a855f7" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 4 }}>Kuesioner & AI</h3>
                    <p style={{ fontSize: 11, color: '#8890a4', margin: 0 }}>Konfigurasi batas asesmen harian dan pengaturan respon AI pada fitur curhat anonim.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                  <div style={{ background: '#0f1117', border: '1px solid #1e2130', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Activity size={15} color="#a855f7" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#c0c9e0' }}>Batas Asesmen Harian</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'end', gap: 10 }}>
                      <div style={{ background: 'rgba(168,85,247,0.08)', padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(168,85,247,0.15)' }}>
                        <span style={{ fontSize: 24, fontWeight: 700, color: '#a855f7' }}>{config.max_assessment_per_day}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#8890a4', marginBottom: 6 }}>per hari</span>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <input type="range" min={1} max={20} value={config.max_assessment_per_day}
                        onChange={e => update('max_assessment_per_day', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#a855f7' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: '#4a5068' }}>1</span>
                        <span style={{ fontSize: 10, color: '#4a5068' }}>20</span>
                      </div>
                    </div>
                    <p style={helperStyle}>Batas kuisioner harian per pengguna untuk mencegah spam data</p>
                  </div>

                  <div style={{ background: '#0f1117', border: '1px solid #1e2130', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Zap size={15} color="#a855f7" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#c0c9e0' }}>AI Response</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#8890a4' }}>Respon otomatis curhat</span>
                      <ToggleSwitch value={config.ai_response_enabled} onChange={v => update('ai_response_enabled', v)} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: config.ai_response_enabled ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', borderRadius: 6, border: `1px solid ${config.ai_response_enabled ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.ai_response_enabled ? '#22c55e' : '#ef4444' }} />
                      <span style={{ fontSize: 10, color: config.ai_response_enabled ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                        {config.ai_response_enabled ? 'Aktif — AI merespon otomatis' : 'Nonaktif — tidak ada respon AI'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', background: 'rgba(168,85,247,0.04)', borderRadius: 8, border: '1px solid rgba(168,85,247,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Info size={13} color="#a855f7" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#a855f7' }}>Catatan Keamanan</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 10, color: '#8890a4', lineHeight: 1.6 }}>
                    AI response menggunakan NLP engine lokal. <span style={{ color: '#4ade80', fontWeight: 500 }}>Tidak ada data</span> yang dikirim ke layanan eksternal. Semua proses berjalan di server internal.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div key="system" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
              <div style={{ ...card, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Database size={18} color="#22c55e" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 4 }}>Sistem & Retensi Data</h3>
                    <p style={{ fontSize: 11, color: '#8890a4', margin: 0 }}>Pengaturan nama aplikasi, mode pemeliharaan, dan kebijakan retensi data.</p>
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Nama Aplikasi</label>
                  <input type="text" value={config.app_name}
                    onChange={e => update('app_name', e.target.value)}
                    style={{ ...inputStyle, maxWidth: 320 }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#0f1117', borderRadius: 8, border: '1px solid #1e2130', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>Mode Pemeliharaan</div>
                    <div style={{ fontSize: 10, color: '#8890a4' }}>Nonaktifkan akses pengguna, hanya admin yang bisa login</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.5px',
                      color: config.maintenance_mode ? '#ef4444' : '#8890a4',
                      background: config.maintenance_mode ? 'rgba(239,68,68,0.08)' : 'transparent',
                      padding: '3px 8px', borderRadius: 4,
                      border: config.maintenance_mode ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
                    }}>
                      {config.maintenance_mode ? 'AKTIF' : 'Nonaktif'}
                    </span>
                    <ToggleSwitch value={config.maintenance_mode} onChange={v => update('maintenance_mode', v)} />
                  </div>
                </div>

                {config.maintenance_mode && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.05)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <AlertTriangle size={14} color="#ef4444" />
                    <span style={{ fontSize: 11, color: '#f87171' }}>Semua pengguna non-admin akan otomatis logout dan tidak dapat login selama mode ini aktif.</span>
                  </motion.div>
                )}

                <div style={{ height: 1, background: '#1e2130', margin: '18px 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: '#0f1117', border: '1px solid #1e2130', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Clock size={15} color="#3ecfcf" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#c0c9e0' }}>Retensi Notifikasi</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'end', gap: 10, marginBottom: 10 }}>
                      <div style={{ background: 'rgba(62,207,207,0.08)', padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(62,207,207,0.15)' }}>
                        <span style={{ fontSize: 24, fontWeight: 700, color: '#3ecfcf' }}>{config.notification_retention}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#8890a4', marginBottom: 6 }}>hari</span>
                    </div>
                    <input type="range" min={1} max={365} value={config.notification_retention}
                      onChange={e => update('notification_retention', Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#3ecfcf' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: '#4a5068' }}>1 hari</span>
                      <span style={{ fontSize: 10, color: '#4a5068' }}>365 hari</span>
                    </div>
                    <p style={helperStyle}>Notifikasi lebih lama akan otomatis dihapus sistem</p>
                  </div>
                  <div style={{ background: '#0f1117', border: '1px solid #1e2130', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <HardDrive size={15} color="#22c55e" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#c0c9e0' }}>Retensi Data</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'end', gap: 10, marginBottom: 10 }}>
                      <div style={{ background: 'rgba(34,197,94,0.08)', padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.15)' }}>
                        <span style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{config.data_retention_days}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#8890a4', marginBottom: 6 }}>hari</span>
                    </div>
                    <input type="range" min={30} max={1825} step={30} value={config.data_retention_days}
                      onChange={e => update('data_retention_days', Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#22c55e' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: '#4a5068' }}>30 hari</span>
                      <span style={{ fontSize: 10, color: '#4a5068' }}>5 tahun</span>
                    </div>
                    <p style={helperStyle}>Data prediksi & asesmen lebih lama diarsipkan</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'info' && (
            <motion.div key="info" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
              <div style={{ ...card, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(62,207,207,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Info size={18} color="#3ecfcf" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ ...sectionTitle, margin: 0, fontSize: 14, marginBottom: 4 }}>Informasi Sistem</h3>
                    <p style={{ fontSize: 11, color: '#8890a4', margin: 0 }}>Detail teknis dan informasi versi sistem yang sedang berjalan.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  {[
                    { label: 'Nama Aplikasi', value: config.app_name, icon: Layers, color: '#6c63ff' },
                    { label: 'Versi Model', value: config.model_version, icon: Cpu, color: '#a855f7' },
                    { label: 'Framework Backend', value: 'Go (Gin) + GORM', icon: Server, color: '#3ecfcf' },
                    { label: 'Database', value: 'MySQL (nexusmind)', icon: Database, color: '#22c55e' },
                    { label: 'ML Engine', value: 'scikit-learn + NumPy + Transformers', icon: Brain, color: '#f59e0b' },
                    { label: 'Frontend', value: 'React 18 + TypeScript + Vite', icon: Globe, color: '#6c63ff' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} style={{ background: '#0f1117', border: '1px solid #1e2130', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={14} color={color} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 9, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 11, color: '#c0c9e0', fontWeight: 600, wordBreak: 'break-word' }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                  {[
                    { label: 'Auth Method', value: 'JWT (HS256) + Google OAuth 2.0', icon: Shield, color: '#22c55e' },
                    { label: 'Deployment', value: 'Local / Self-hosted', icon: Server, color: '#8890a4' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} style={{ background: '#0f1117', border: '1px solid #1e2130', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={14} color={color} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 9, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 11, color: '#c0c9e0', fontWeight: 600, wordBreak: 'break-word' }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#0f1117', border: '1px solid #1e2130', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(108,99,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Cpu size={14} color="#6c63ff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Versi Model</label>
                    <input type="text" value={config.model_version}
                      onChange={e => update('model_version', e.target.value)}
                      style={{ ...inputStyle, maxWidth: 180, marginTop: 4 }} />
                  </div>
                  <p style={{ ...helperStyle, maxWidth: 200, textAlign: 'right' }}>Digunakan untuk tracking versi model yang sedang aktif</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
