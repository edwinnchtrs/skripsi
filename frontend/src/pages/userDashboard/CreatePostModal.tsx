import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Loader2, Smile, MapPin, User, Send } from 'lucide-react';
import api from '../../api';

type CreatePostModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  currentUser: { nama: string; profile_pic: string };
};

export default function CreatePostModal({ open, onClose, onCreated, currentUser }: CreatePostModalProps) {
  const [step, setStep] = useState<'select' | 'preview' | 'posting'>('select');
  const [image, setImage] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStep('select');
      setImage('');
      setCaption('');
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setStep('preview');
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!caption.trim() && !image) return;
    setPosting(true);
    try {
      await api.post('/post/create', {
        text: caption.trim(),
        image: image || '',
      });
      onCreated();
      onClose();
    } catch { /* silent */ }
    finally { setPosting(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={() => !posting && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 0 60px rgba(6,182,212,0.08), 0 20px 60px rgba(0,0,0,0.5)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b]">
              <button
                onClick={() => {
                  if (step === 'preview') { setStep('select'); setImage(''); return; }
                  onClose();
                }}
                className="p-1 text-[#94a3b8] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-sm font-semibold text-white">Buat Postingan Baru</h2>
              {step === 'preview' && !posting ? (
                <button
                  onClick={handlePost}
                  disabled={!caption.trim() && !image}
                  className="text-[13px] font-semibold text-[#06b6d4] hover:text-[#22d3ee] disabled:text-[#475569] disabled:cursor-default transition-colors"
                >
                  Bagikan
                </button>
              ) : (
                <div className="w-14" />
              )}
            </div>

            {/* Step: Select */}
            {step === 'select' && (
              <div className="p-8 flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#059669]/10 to-[#06b6d4]/10 border-2 border-dashed border-[#1e293b] flex items-center justify-center">
                  <Image size={36} color="#475569" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-[#e2e8f0] font-medium mb-1">Pilih foto untuk diunggah</p>
                  <p className="text-[12px] text-[#64748b]">Format JPG, PNG. Maksimal 5MB</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #059669, #06b6d4)',
                    boxShadow: '0 4px 15px rgba(6,182,212,0.25)',
                  }}
                >
                  Pilih dari Perangkat
                </button>
                <button
                  onClick={() => setStep('preview')}
                  className="px-6 py-2.5 rounded-xl text-[13px] font-medium border border-[#1e293b] text-[#94a3b8] hover:border-[#334155] hover:text-[#e2e8f0] transition-all"
                >
                  Hanya Teks
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Step: Preview */}
            {step === 'preview' && (
              <div>
                {/* Image preview */}
                {image && (
                  <div className="bg-black/40 flex items-center justify-center max-h-64 overflow-hidden">
                    <img src={image} alt="Preview" className="max-w-full max-h-64 object-contain" />
                  </div>
                )}

                {/* User info + caption */}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {currentUser.profile_pic ? (
                      <img src={currentUser.profile_pic} alt="" className="w-8 h-8 rounded-full object-cover border border-[#1e293b]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center">
                        <User size={14} color="#475569" />
                      </div>
                    )}
                    <span className="text-[13px] font-semibold text-[#e2e8f0]">{currentUser.nama}</span>
                  </div>
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Tulis caption..."
                    rows={3}
                    className="w-full resize-none bg-transparent text-[13px] text-[#e2e8f0] placeholder:text-[#475569] outline-none leading-relaxed scrollbar-thin"
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1e293b]">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-[#475569] hover:text-[#94a3b8] transition-colors">
                        <Smile size={18} />
                      </button>
                      <button className="p-1.5 text-[#475569] hover:text-[#94a3b8] transition-colors">
                        <MapPin size={18} />
                      </button>
                    </div>
                    <span className="text-[11px] text-[#475569]">{caption.length}/500</span>
                  </div>
                </div>
              </div>
            )}

            {/* Posting state */}
            {step === 'posting' && (
              <div className="p-12 flex flex-col items-center gap-4">
                <Loader2 size={32} className="animate-spin text-[#06b6d4]" />
                <span className="text-[13px] text-[#94a3b8]">Mengunggah postingan...</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
