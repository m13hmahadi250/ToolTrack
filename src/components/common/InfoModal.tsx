import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Mail, Send, CheckCircle2 } from 'lucide-react';

export type InfoModalType = 'privacy' | 'terms' | 'contact' | 'faq' | null;

interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && type) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [type, onClose]);

  if (!type) return null;

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    // Direct mailto link fallback
    const subject = encodeURIComponent(`ToolTrack Feedback from ${feedbackName || 'User'}`);
    const body = encodeURIComponent(
      `Name: ${feedbackName}\nEmail: ${feedbackEmail}\n\nMessage:\n${feedbackMessage}`
    );
    window.location.href = `mailto:m13hmahadi.personal@gmail.com?subject=${subject}&body=${body}`;

    setFeedbackSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {type === 'privacy' && (
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            {type === 'terms' && (
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
            )}
            {type === 'contact' && (
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Mail className="w-5 h-5" />
              </div>
            )}
            <h3 className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              {type === 'privacy' && 'Privacy Policy'}
              {type === 'terms' && 'Terms of Service'}
              {type === 'contact' && 'Contact & Feedback'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on type */}
        {type === 'privacy' && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs">
              <span className="font-bold">100% Client-Side Privacy First:</span> Your files are processed directly inside your browser memory using WebAssembly and HTML5 streams. No file data is permanently saved or transferred to external servers.
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                1. No File Retention
              </h4>
              <p>
                When you merge, split, normalize, compress, or convert documents in ToolTrack, all computation runs locally on your device. Once you close your browser tab or click "Start Again", all memory buffers are instantly purged.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                2. Zero Telemetry & Ad Tracking
              </h4>
              <p>
                ToolTrack does not use invasive surveillance trackers, third-party pixel beacons, or intrusive profiling cookies. Your document contents, passwords, and metadata remain completely confidential.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                3. Password Security
              </h4>
              <p>
                When protecting or unlocking encrypted PDFs, passwords are processed exclusively in-memory for the duration of the cryptographic operation and are never written to disk or transmitted over the network.
              </p>
            </div>
          </div>
        )}

        {type === 'terms' && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                1. Open & Free Utility
              </h4>
              <p>
                ToolTrack is provided as an open, accessible file productivity suite for school, college, university students, educators, researchers, and professional users worldwide.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                2. Intended Use & Safety
              </h4>
              <p>
                You may use ToolTrack for all personal, academic, and business file workflows. You agree not to use ToolTrack to process unlawful, malicious, or rights-infringing material.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                3. File Integrity & Disclaimer
              </h4>
              <p>
                While ToolTrack employs layout-aware reconstruction algorithms to ensure visual fidelity and structural retention, users are encouraged to maintain copies of original source documents before conversion or batch editing.
              </p>
            </div>
          </div>
        )}

        {type === 'contact' && (
          <div className="space-y-4">
            {feedbackSent ? (
              <div className="p-6 text-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Message Dispatched!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                  Thank you for your feedback. An email client link has been prepared to directly reach the developer.
                </p>
                <button
                  onClick={() => {
                    setFeedbackSent(false);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs sm:text-sm">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Have a suggestion, bug report, or feature request? We welcome input from students and educators!
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Message / Bug Report / Feature Request
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Describe your feedback, suggestion, or question..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Direct developer contact: Mohammed Mahadi Hossain
                  </span>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
