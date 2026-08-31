import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Loader2, Sparkles, TriangleAlert } from 'lucide-react';
import api from '../../api';
import { interpretationMeta } from './happinessShared';

interface WellBeingResponse {
  status: string;
  message?: string;
  matrix?: { burnout: string; happiness: string; label: string; priority: number };
  insight?: string;
  recommendation?: string;
  warnings: { type: string; label: string; detail: string }[];
}

export default function Rekomendasi() {
  const [data, setData] = useState<WellBeingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/well-being')
      .then((res) => setData(res.data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Menyiapkan rekomendasi...
      </div>
    );
  }

  const labelMeta = interpretationMeta(data?.matrix?.label);

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">
          <Sparkles className="h-3.5 w-3.5" /> Rekomendasi
        </div>
        <h1 className="text-2xl font-semibold text-white">Rekomendasi Akademik</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Rekomendasi disusun dari gabungan indikator burnout dan Happiness Index. Semua rekomendasi bersifat akademik — bukan diagnosis kesehatan mental.
        </p>
      </section>

      {!data || data.status === 'empty' ? (
        <section className="rounded-2xl border border-white/10 bg-slate-950 p-8 text-center shadow-xl shadow-black/10">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">{data?.message || 'Isi assessment burnout dan happiness untuk mendapatkan rekomendasi.'}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Link to="/user/kuisioner" className="inline-flex h-10 items-center rounded-lg bg-indigo-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300">
              Assessment Burnout
            </Link>
            <Link to="/user/happiness/assessment" className="inline-flex h-10 items-center rounded-lg bg-amber-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-200">
              Assessment Happiness
            </Link>
          </div>
        </section>
      ) : (
        <>
          {data.matrix && (
            <section className="rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
              <h2 className="text-sm font-semibold text-white">Status Kondisi Anda</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${labelMeta.chip}`}>{data.matrix.label}</span>
                <span className="text-xs text-slate-500">
                  Burnout: {data.matrix.burnout} · Happiness: {data.matrix.happiness}
                </span>
              </div>
              {data.insight && <p className="mt-3 text-sm leading-6 text-slate-300">{data.insight}</p>}
            </section>
          )}

          {data.recommendation && (
            <section className="rounded-2xl border border-teal-300/25 bg-teal-300/10 p-5 shadow-xl shadow-black/10">
              <h2 className="text-sm font-semibold text-teal-100">Rekomendasi Utama</h2>
              <p className="mt-2 text-sm leading-7 text-teal-50">{data.recommendation}</p>
            </section>
          )}

          {data.warnings?.length > 0 && (
            <section className="rounded-2xl border border-amber-300/25 bg-amber-500/10 p-5 shadow-xl shadow-black/10">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                <TriangleAlert className="h-4 w-4" /> Perlu Perhatian
              </div>
              <div className="mt-3 space-y-2">
                {data.warnings.map((warning) => (
                  <p key={warning.type} className="text-sm leading-6 text-amber-50">
                    <span className="font-semibold">{warning.label}:</span> {warning.detail}
                  </p>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
            <h2 className="text-sm font-semibold text-white">Langkah Praktis Mahasiswa</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              <li>• Isi assessment burnout & happiness secara rutin agar trend kondisi akurat.</li>
              <li>• Manfaatkan Ruang Curhat untuk mencatat beban akademik yang terasa menumpuk.</li>
              <li>• Bila status menunjukkan "Perlu monitoring" atau "Prioritas Monitoring Akademik", diskusikan dengan DPA pembimbing Anda.</li>
              <li>• Perhatikan dimensi kebahagiaan dengan skor terendah pada halaman Faktor Kondisi.</li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
