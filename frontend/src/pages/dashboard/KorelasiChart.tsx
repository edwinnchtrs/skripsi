import { Link2 } from 'lucide-react';
import { korelasi } from './data';

export default function KorelasiChart() {
  return (
    <div className="h-full rounded-lg border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/10">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Link2 className="h-4 w-4 text-violet-200" />
        Korelasi Faktor
      </div>
      <p className="mt-1 text-xs text-slate-500">Pearson terhadap burnout score</p>

      <div className="mt-5 space-y-4">
        {korelasi.map((item) => {
          const pct = Math.abs(item.value) * 100;
          const positive = item.positive;
          const barColor = positive ? 'bg-violet-300' : 'bg-rose-300';

          return (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-slate-300">{item.label}</span>
                <span className={positive ? 'font-semibold text-violet-200' : 'font-semibold text-rose-200'}>
                  {item.value}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
