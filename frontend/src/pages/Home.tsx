import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  HeartPulse,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import api from '../api';

interface PublicOverview {
  total_users: number;
  total_assessments: number;
  total_predictions: number;
  total_curhats: number;
  model_accuracy: number;
  active_model: string;
}

const signalModes = [
  {
    key: 'overload',
    label: 'Overload',
    score: 82,
    tone: 'Kerja menumpuk, energi menipis, respons mulai lambat.',
    action: 'Buka asesmen, baca skor, susun jeda pemulihan.',
    color: '#ff5a36',
  },
  {
    key: 'silent',
    label: 'Diam',
    score: 64,
    tone: 'User tetap hadir, tetapi curhat dan pola jawaban mulai berubah.',
    action: 'Pantau riwayat, kirim saran, cek balasan terapi.',
    color: '#1ed5d0',
  },
  {
    key: 'recover',
    label: 'Pulih',
    score: 38,
    tone: 'Risiko turun, rutinitas kembali stabil, tindak lanjut tetap aktif.',
    action: 'Pertahankan ritme, simpan baseline, lanjutkan refleksi ringan.',
    color: '#b7f45a',
  },
];

const launchKit = [
  {
    icon: ClipboardCheck,
    title: 'Assessment Engine',
    body: 'Kuisioner adaptif, MBTI dinamis, waktu respons, dan peta risiko harian.',
  },
  {
    icon: BrainCircuit,
    title: 'AI Reading Layer',
    body: 'Saran, ringkasan prioritas, rekomendasi jadwal, dan narasi yang mudah dipahami.',
  },
  {
    icon: MessageCircle,
    title: 'Curhat Loop',
    body: 'Cerita user, balasan terapi admin, notifikasi, dan follow-up dalam satu alur.',
  },
  {
    icon: BarChart3,
    title: 'Admin Command',
    body: 'Dashboard responden, analitik, laporan, model, dan sinyal yang perlu dikejar dulu.',
  },
];

const timeline = [
  ['00:00', 'User klik mulai', 'Tidak dipaksa membaca brosur panjang. Langsung masuk ke asesmen.'],
  ['02:30', 'Sinyal terbentuk', 'Burnout, psikosomatis, MBTI, dan curhat mulai tersambung.'],
  ['05:00', 'Admin bergerak', 'Prioritas, terapi, notifikasi, dan jadwal tindak lanjut muncul.'],
];

const audience = [
  ['Mahasiswa', 'Tahu kapan lelah akademik sudah perlu ditangani.'],
  ['Karyawan', 'Melihat tekanan kerja sebelum performa turun terlalu jauh.'],
  ['Admin', 'Melihat siapa yang perlu dibantu tanpa membongkar semua tabel.'],
];

export default function Home() {
  const [overview, setOverview] = useState<PublicOverview | null>(null);
  const [activeSignal, setActiveSignal] = useState(signalModes[0]);

  useEffect(() => {
    api
      .get('/public/overview')
      .then((response) => setOverview(response.data))
      .catch(() => undefined);
  }, []);

  const metrics = useMemo(
    () => [
      { label: 'asesmen', value: overview ? overview.total_assessments.toLocaleString('id-ID') : '-' },
      { label: 'prediksi', value: overview ? overview.total_predictions.toLocaleString('id-ID') : '-' },
      { label: 'akurasi', value: overview ? `${(overview.model_accuracy * 100).toFixed(1)}%` : '-' },
      { label: 'curhat', value: overview ? overview.total_curhats.toLocaleString('id-ID') : '-' },
    ],
    [overview],
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[#080b10] text-[#f7f1df]">
      <section className="relative min-h-[calc(100vh-4rem)] px-4 py-5 md:px-8 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,90,54,0.24),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(30,213,208,0.18),transparent_28%),linear-gradient(180deg,#080b10_0%,#101118_54%,#080b10_100%)]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(247,241,223,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(247,241,223,0.18)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-h-[680px] flex-col justify-between rounded-[30px] border border-[#f7f1df]/12 bg-[#0d1118]/82 p-6 shadow-[0_32px_120px_rgba(0,0,0,0.48)] md:p-8">
            <div>
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ff5a36]/30 bg-[#ff5a36]/12 px-4 py-2 text-sm font-bold text-[#ffd0c4]">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  Immediate burnout radar
                </span>
                <span className="rounded-full border border-[#f7f1df]/12 px-4 py-2 text-sm text-[#bdb6a5]">
                  Built for admin and user
                </span>
              </div>

              <h1 className="max-w-[11ch] text-[clamp(4.1rem,11vw,9.6rem)] font-black uppercase leading-[0.78] tracking-normal text-[#f7f1df]">
                Stop guessing burnout.
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-[#c9c1ad] md:text-xl md:leading-9">
                NexusMind mengubah asesmen, curhat, MBTI, terapi, dan analitik admin
                menjadi satu radar keputusan yang bisa langsung dipakai.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#ff5a36] px-6 py-4 text-sm font-black text-[#170b08] shadow-[0_20px_52px_rgba(255,90,54,0.28)] transition hover:translate-y-[-2px] hover:bg-[#ff775c]"
                >
                  Mulai sekarang
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-[#f7f1df]/16 px-6 py-4 text-sm font-black text-[#f7f1df] transition hover:translate-y-[-2px] hover:bg-[#f7f1df]/8"
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  Masuk dashboard
                </Link>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
              {metrics.map((item) => (
                <div key={item.label} className="border-t border-[#f7f1df]/14 pt-4">
                  <p className="text-3xl font-black text-[#f7f1df]">{item.value}</p>
                  <p className="mt-1 text-sm text-[#8d8678]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[680px] rounded-[30px] border border-[#f7f1df]/12 bg-[#f7f1df] p-4 text-[#080b10] shadow-[0_32px_120px_rgba(0,0,0,0.42)]">
            <div className="flex h-full flex-col justify-between overflow-hidden rounded-[24px] bg-[#101118] p-5 text-[#f7f1df]">
              <div className="flex items-center justify-between border-b border-[#f7f1df]/12 pb-4">
                <div>
                  <p className="text-sm text-[#a49d8f]">Live playable preview</p>
                  <h2 className="mt-1 text-2xl font-black tracking-normal text-[#f7f1df]">Risk Console</h2>
                </div>
                <Gauge className="h-7 w-7" style={{ color: activeSignal.color }} aria-hidden="true" />
              </div>

              <div className="py-8">
                <div className="relative mx-auto aspect-square max-w-[430px] rounded-full border border-[#f7f1df]/12 bg-[#080b10]">
                  <div className="absolute inset-[9%] rounded-full border border-[#f7f1df]/12" />
                  <div className="absolute inset-[22%] rounded-full border border-[#f7f1df]/12" />
                  <div
                    className="absolute left-1/2 top-1/2 h-[38%] w-1 origin-bottom rounded-full"
                    style={{
                      backgroundColor: activeSignal.color,
                      transform: `translateX(-50%) translateY(-100%) rotate(${activeSignal.score * 1.8 - 110}deg)`,
                      boxShadow: `0 0 42px ${activeSignal.color}`,
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8d8678]">{activeSignal.label}</p>
                    <p className="mt-2 text-8xl font-black leading-none" style={{ color: activeSignal.color }}>
                      {activeSignal.score}
                    </p>
                    <p className="mt-3 text-sm text-[#c9c1ad]">risk pulse</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {signalModes.map((mode) => (
                    <button
                      key={mode.key}
                      onClick={() => setActiveSignal(mode)}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        activeSignal.key === mode.key
                          ? 'border-[#f7f1df]/35 bg-[#f7f1df]/12'
                          : 'border-[#f7f1df]/12 bg-[#f7f1df]/5 hover:bg-[#f7f1df]/9'
                      }`}
                    >
                      <span className="block text-sm font-black" style={{ color: mode.color }}>
                        {mode.label}
                      </span>
                      <span className="mt-1 block text-xs text-[#8d8678]">{mode.score} pulse</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-[#f7f1df]/12 bg-[#f7f1df]/6 p-4">
                  <p className="text-sm leading-6 text-[#ded6c4]">{activeSignal.tone}</p>
                  <p className="mt-3 text-sm font-bold" style={{ color: activeSignal.color }}>
                    {activeSignal.action}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1ed5d0]">Sales intro</p>
            <h2 className="mt-4 max-w-xl text-5xl font-black leading-[0.95] tracking-normal text-[#f7f1df] md:text-7xl">
              Bukan landing page kalem. Ini trailer produk.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-[#a49d8f]">
              Pengunjung langsung melihat masalah, memainkan sinyal, lalu paham
              kenapa sistem ini layak dipakai sebelum burnout jadi krisis.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {launchKit.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[24px] border border-[#f7f1df]/12 bg-[#121823] p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-2xl font-black tracking-normal text-[#f7f1df]">{item.title}</h3>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff5a36] text-[#170b08]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-[#a49d8f]">{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f1df] px-4 py-16 text-[#080b10] md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[30px] bg-[#080b10] p-6 text-[#f7f1df] md:p-8">
              <div className="flex items-center justify-between border-b border-[#f7f1df]/12 pb-5">
                <div>
                  <p className="text-sm text-[#a49d8f]">Mission path</p>
                  <h2 className="mt-1 text-3xl font-black tracking-normal text-[#f7f1df]">Dari klik ke tindakan</h2>
                </div>
                <ShieldCheck className="h-7 w-7 text-[#b7f45a]" aria-hidden="true" />
              </div>

              <div className="mt-8 space-y-4">
                {timeline.map(([time, title, body]) => (
                  <div key={time} className="grid gap-4 rounded-2xl border border-[#f7f1df]/12 bg-[#f7f1df]/6 p-5 md:grid-cols-[90px_1fr]">
                    <p className="text-2xl font-black text-[#ff5a36]">{time}</p>
                    <div>
                      <h3 className="text-xl font-black tracking-normal text-[#f7f1df]">{title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#a49d8f]">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[30px] border border-[#080b10]/12 bg-[#ff5a36] p-6 md:p-8">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#371208]">Offer stack</p>
                <h2 className="mt-4 text-5xl font-black leading-[0.95] tracking-normal text-[#160804]">
                  Satu sistem untuk tiga peran.
                </h2>
              </div>

              <div className="mt-10 space-y-3">
                {audience.map(([title, body]) => (
                  <div key={title} className="rounded-2xl bg-[#160804]/12 p-4">
                    <p className="text-lg font-black text-[#160804]">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#371208]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b7f45a]">Proof and trust</p>
            <h2 className="mt-4 max-w-xl text-5xl font-black leading-[0.95] tracking-normal text-[#f7f1df] md:text-7xl">
              Data keras, bahasa manusia.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Tidak mengganti konselor', 'Sistem membantu membaca prioritas, keputusan tetap di tangan manusia.'],
              ['Bukan diagnosis klinis', 'Hasil diposisikan sebagai refleksi risiko dan peta tindak lanjut.'],
              ['Siap demo skripsi', 'Landing page menjual fungsi nyata yang sudah ada di user dan admin.'],
              ['Lebih interaktif', 'Hero punya mode sinyal yang bisa dicoba langsung oleh pengunjung.'],
            ].map(([title, body]) => (
              <article key={title} className="rounded-[24px] border border-[#f7f1df]/12 bg-[#121823] p-6">
                <CheckCircle2 className="h-6 w-6 text-[#1ed5d0]" aria-hidden="true" />
                <h3 className="mt-5 text-xl font-black tracking-normal text-[#f7f1df]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#a49d8f]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 md:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[34px] bg-[#b7f45a] p-8 text-[#080b10] md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#2b3b10]">Final call</p>
              <h2 className="mt-4 max-w-4xl text-5xl font-black leading-[0.92] tracking-normal text-[#080b10] md:text-8xl">
                Jangan tunggu sinyalnya jadi terlambat.
              </h2>
            </div>

            <div className="flex flex-col justify-end">
              <p className="text-base leading-8 text-[#2b3b10]">
                Masuk, isi asesmen, lihat risiko, lalu biarkan dashboard membantu
                menentukan langkah berikutnya.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  to="/register"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#080b10] px-6 py-4 text-sm font-black text-[#f7f1df] transition hover:translate-y-[-2px]"
                >
                  Mulai asesmen
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-[#080b10]/20 px-6 py-4 text-sm font-black text-[#080b10] transition hover:translate-y-[-2px] hover:bg-[#080b10]/8"
                >
                  Buka dashboard
                  <Activity className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
