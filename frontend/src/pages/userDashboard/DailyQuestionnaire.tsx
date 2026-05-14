import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Bell, Brain, ClipboardList, Clock3 } from 'lucide-react';

interface DailyQuestionnaireProps {
  onSubmitSuccess?: () => void;
}

const benefits = [
  { Icon: Brain, text: 'Pertanyaan harian menyesuaikan pola asesmen terbaru' },
  { Icon: Clock3, text: 'Mencatat waktu respons untuk memperkaya analisis' },
  { Icon: BarChart3, text: 'Hasil prediksi langsung masuk ke grafik personal' },
  { Icon: Bell, text: 'Notifikasi muncul setelah analisis selesai diproses' },
];

export default function DailyQuestionnaire({ onSubmitSuccess }: DailyQuestionnaireProps) {
  const nav = useNavigate();

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-400/10 text-violet-200">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Kuisioner Harian</h2>
              <p className="mt-1 text-xs text-slate-400">Analisis cepat untuk memperbarui ringkasan kondisi hari ini.</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {benefits.map(({ Icon, text }) => (
              <div key={text} className="flex min-w-0 items-start gap-3 rounded-xl border border-white/10 bg-slate-950/35 p-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-200" />
                <span className="text-xs leading-5 text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:w-64">
          <button
            type="button"
            onClick={() => {
              onSubmitSuccess?.();
              nav('/user/kuisioner');
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300/60"
          >
            Mulai Kuisioner
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-xs leading-5 text-slate-500">
            Data tersimpan otomatis setelah pengisian selesai.
          </p>
        </div>
      </div>
    </section>
  );
}
