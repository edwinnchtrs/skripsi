import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import heroGraphic from '../assets/hero.png';
import api from '../api';

interface PublicOverview {
  total_users: number;
  total_assessments: number;
  total_predictions: number;
  total_curhats: number;
  model_accuracy: number;
  active_model: string;
}

const features = [
  {
    icon: BrainCircuit,
    title: 'Quantum assessment',
    body: 'Kuesioner adaptif membaca pola kelelahan, sinisme, dan performa pribadi dengan pendekatan Quantum Cognition.',
  },
  {
    icon: BarChart3,
    title: 'Prediksi burnout',
    body: 'Model regresi membantu memetakan risiko burnout dan potensi gejala psikosomatis sebelum kondisinya memburuk.',
  },
  {
    icon: MessageCircle,
    title: 'Analitik curhat',
    body: 'Cerita anonim dianalisis dengan NLP untuk melihat sentimen, topik dominan, dan tekanan kolektif secara real-time.',
  },
];

const workflow = [
  'Isi asesmen singkat berdasarkan kondisi hari ini.',
  'Lihat skor risiko dan sinyal yang paling perlu diperhatikan.',
  'Ikuti rekomendasi terapi adaptif dan pantau perubahan harian.',
];

export default function Home() {
  const [overview, setOverview] = useState<PublicOverview | null>(null);

  useEffect(() => {
    api.get('/public/overview')
      .then((response) => setOverview(response.data))
      .catch(() => undefined);
  }, []);

  const metrics = useMemo(() => [
    { value: overview ? overview.total_assessments.toLocaleString('id-ID') : '-', label: 'asesmen tercatat' },
    { value: overview ? overview.total_curhats.toLocaleString('id-ID') : '-', label: 'curhat diproses' },
    { value: overview ? `${(overview.model_accuracy * 100).toFixed(1)}%` : '-', label: 'akurasi model aktif' },
  ], [overview]);

  return (
    <div className="space-y-20 md:space-y-28">
      <section className="grid min-h-[calc(100vh-13rem)] grid-cols-1 items-center gap-12 pb-6 pt-4 md:grid-cols-[1.02fr_0.98fr] md:gap-16">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Platform pemetaan burnout berbasis data
          </div>

          <h1 className="max-w-[13ch] text-5xl font-semibold leading-none tracking-normal text-ink sm:text-6xl lg:text-7xl">
            Pahami burnout sebelum terlambat.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-body">
            NexusMind membantu mahasiswa dan pengelola kampus membaca risiko burnout,
            pola emosi, dan kebutuhan intervensi melalui asesmen, prediksi, dan ruang
            curhat anonim yang saling terhubung.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary h-12 gap-2 px-6 text-base">
              Mulai asesmen
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/login" className="btn-secondary h-12 px-6 text-base">
              Masuk dashboard
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3 border-y border-hairline py-5">
            {metrics.map((item) => (
              <div key={item.label}>
                <div className="text-2xl font-semibold text-ink">{item.value}</div>
                <div className="mt-1 text-sm leading-5 text-muted">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[520px] overflow-hidden rounded-xl border border-hairline bg-surface-soft p-5 shadow-[0_28px_80px_rgba(24,23,21,0.10)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(204,120,92,0.20),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.16),transparent_28%),linear-gradient(140deg,rgba(250,249,245,0.92),rgba(239,233,222,0.78))]" />

          <div className="relative flex h-full min-h-[480px] flex-col justify-between rounded-lg border border-white/70 bg-canvas/80 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Burnout risk monitor</p>
                <p className="text-2xl font-semibold text-ink">NexusMind</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-sm flex-1 items-center justify-center py-8">
              <img
                src={heroGraphic}
                alt="Ilustrasi lapisan analitik NexusMind"
                className="w-full max-w-[310px] drop-shadow-[0_26px_32px_rgba(88,28,135,0.18)]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-hairline bg-white/70 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Status hari ini
                </div>
                <div className="mt-3 text-3xl font-semibold text-ink">
                  {overview ? overview.total_predictions.toLocaleString('id-ID') : '-'}
                </div>
                <p className="mt-1 text-sm text-muted">prediksi risiko tersimpan</p>
              </div>
              <div className="rounded-lg border border-hairline bg-white/70 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted">
                  <Users className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                  Sentimen kolektif
                </div>
                <div className="mt-3 text-3xl font-semibold text-ink">
                  {overview ? overview.total_users.toLocaleString('id-ID') : '-'}
                </div>
                <p className="mt-1 text-sm text-muted">pengguna aktif terdaftar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article key={feature.title} className="rounded-xl border border-hairline bg-surface-card p-6">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-canvas text-primary">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold tracking-normal text-ink">{feature.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{feature.body}</p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 items-center gap-10 rounded-xl bg-surface-dark p-6 text-onDark md:grid-cols-[0.86fr_1.14fr] md:p-10">
        <div>
          <p className="mb-3 text-sm font-medium text-primary">Alur penggunaan</p>
          <h2 className="text-3xl font-semibold leading-tight tracking-normal text-onDark md:text-4xl">
            Dari asesmen singkat ke tindakan yang lebih tepat.
          </h2>
          <p className="mt-5 text-sm leading-7 text-onDark-soft">
            Landing page ini menempatkan NexusMind sebagai alat kerja yang langsung
            mengarah ke asesmen, dashboard, dan rekomendasi terapi.
          </p>
        </div>

        <div className="space-y-3">
          {workflow.map((item, index) => (
            <div key={item} className="flex items-start gap-4 rounded-lg bg-surface-darkElevated p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-onPrimary">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-onDark">{item}</p>
                <p className="mt-1 text-sm text-onDark-soft">
                  {index === 0 && 'Cepat dipakai, cukup fokus pada kondisi nyata pengguna.'}
                  {index === 1 && 'Hasil diringkas agar mudah dibaca oleh user maupun admin.'}
                  {index === 2 && 'Perkembangan tersimpan sebagai jejak pemulihan yang bisa dipantau.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.25fr]">
        <div>
          <p className="mb-3 text-sm font-medium text-primary">Kenapa terasa berbeda</p>
          <h2 className="text-3xl font-semibold leading-tight tracking-normal text-ink md:text-4xl">
            Bukan sekadar formulir, tapi sistem pemantauan yang bisa dipakai berulang.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            'Visualisasi risiko mudah dibaca',
            'Rekomendasi terapi mengikuti kondisi',
            'Data sosial anonim ikut memperkaya analisis',
            'Cocok untuk user dan admin kampus',
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-lg border border-hairline bg-canvas p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              <span className="text-sm font-medium leading-6 text-body-strong">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-8 text-center md:p-12">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight tracking-normal text-ink md:text-4xl">
          Mulai baca pola burnout hari ini.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">
          Bangun kebiasaan refleksi yang lebih tenang, terukur, dan mudah ditindaklanjuti.
        </p>
        <div className="mt-7 flex justify-center">
          <Link to="/register" className="btn-primary h-12 gap-2 px-6 text-base">
            Daftar sekarang
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
