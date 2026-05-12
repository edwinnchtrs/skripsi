import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, User } from 'lucide-react';

type PhotoViewerProps = {
  src: string;
  alt?: string;
  username?: string;
  caption?: string;
  open: boolean;
  onClose: () => void;
};

export default function PhotoViewerModal({ src, alt, username, caption, open, onClose }: PhotoViewerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
          onClick={onClose}
        >
          {/* Top bar */}
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 flex items-center justify-center">
                <User size={14} color="#94a3b8" />
              </div>
              <span className="text-sm font-semibold text-white">{username || 'User'}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative max-w-[95vw] max-h-[85vh] flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt || 'Photo'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              style={{ boxShadow: '0 0 60px rgba(0,0,0,0.5)' }}
            />
          </motion.div>

          {/* Bottom bar */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="absolute bottom-0 left-0 right-0 px-4 py-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="max-w-lg mx-auto">
              {/* Action buttons */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button className="p-1.5 text-white hover:text-[#ef4444] transition-colors">
                    <Heart size={22} />
                  </button>
                  <button className="p-1.5 text-white hover:text-[#94a3b8] transition-colors">
                    <MessageCircle size={22} />
                  </button>
                  <button className="p-1.5 text-white hover:text-[#94a3b8] transition-colors">
                    <Send size={22} />
                  </button>
                </div>
                <button className="p-1.5 text-white hover:text-[#fbbf24] transition-colors">
                  <Bookmark size={22} />
                </button>
              </div>

              {/* Caption */}
              {caption && (
                <p className="text-sm text-white/90 leading-relaxed">
                  <span className="font-semibold mr-1.5">{username}</span>
                  {caption}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
