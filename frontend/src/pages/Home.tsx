import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col gap-24">
      {/* Hero Band */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <h1 className="text-[64px] font-serif leading-[1.05] tracking-[-1.5px] mb-6">
            Meet your thinking partner for burnout.
          </h1>
          <p className="text-xl text-body-strong mb-10">
            NexusMind menggunakan Quantum Cognition untuk menganalisis kelelahan mental, sinisme, dan risiko psikosomatis sebelum semuanya terlambat.
          </p>
          <div className="flex gap-4">
            <Link to="/register" className="btn-primary">Try NexusMind</Link>
            <Link to="/login" className="btn-secondary">Sign In</Link>
          </div>
        </div>
        
        {/* Hero Illustration Card */}
        <div className="card-cream aspect-square flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-surface-soft to-canvas opacity-50"></div>
          <div className="z-10 text-center">
            <div className="text-8xl mb-6">🧠</div>
            <div className="font-mono text-sm text-primary opacity-80">&lt;QuantumCognitionEngine /&gt;</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card-cream">
          <h3 className="text-lg font-medium mb-3">Quantum Assessment</h3>
          <p className="text-body-md">Sistem asesmen dinamis yang menghitung interference effect dan order effects berdasarkan respon kognitif Anda.</p>
        </div>
        <div className="card-cream">
          <h3 className="text-lg font-medium mb-3">Predictive Burnout</h3>
          <p className="text-body-md">Multiple linear regression memprediksi risiko burnout dan potensi gangguan psikosomatis di masa depan.</p>
        </div>
        <div className="card-cream">
          <h3 className="text-lg font-medium mb-3">NLP Sentiment</h3>
          <p className="text-body-md">Ruang gosip anonim yang secara real-time dianalisis menggunakan Natural Language Processing untuk melacak stres kolektif.</p>
        </div>
      </section>
      
      {/* Dark CTA Band */}
      <section className="bg-surface-dark text-onDark rounded-xl p-16 text-center">
        <h2 className="text-[48px] font-serif tracking-[-1px] mb-6">Siap untuk memulihkan diri?</h2>
        <p className="text-onDark-soft mb-10 max-w-xl mx-auto">
          Mulai asesmen pertama Anda dan dapatkan modul terapi adaptif sesuai dengan kondisi mental Anda hari ini.
        </p>
        <Link to="/register" className="btn-secondary-dark inline-block">Mulai Sekarang</Link>
      </section>
    </div>
  );
}
