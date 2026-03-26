import React, { useEffect, useRef } from 'react';
import { 
  X, 
  Trash2, 
  Star, 
  Reply, 
  Forward, 
  MoreHorizontal,
  Mail,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useEmailStore } from '../store/useEmailStore';

const EmailDetailView = ({ type }) => {
  const { selectedEmailByView, setSelectedEmail } = useEmailStore();
  const selectedEmail = selectedEmailByView[type];
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current) {
      const handleResize = () => {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          try {
            iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
          } catch (e) {
            // Standard cross-origin error prevention
          }
        }
      };
      
      const timeout = setTimeout(handleResize, 500);
      return () => clearTimeout(timeout);
    }
  }, [selectedEmail]);

  if (!selectedEmail) return null;

  return (
    <div className="flex-1 flex flex-col bg-[var(--card-bg)] overflow-hidden border-l border-[var(--border-color)] animate-fade-in relative">
      {/* Header/Controls */}
      <div className="p-4 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--card-bg)] sticky top-0 z-20">
        <div className="flex items-center gap-2 px-3 py-1 bg-primary-500/10 text-primary-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary-500/20 shadow-sm">
          <div className="relative">
            <span className="animate-ping absolute inset-0 rounded-full bg-primary-400 opacity-40"></span>
            <ShieldCheck size={14} className="relative z-10 text-primary-500" />
          </div>
          Protected
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSelectedEmail(null, type)}
            className="p-2 hover:bg-[var(--background)] rounded-lg text-slate-400 transition-all hover:text-red-500"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 z-10">
        {/* Subject Area */}
        <div className="mb-10 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h1 className="text-2xl font-black text-[var(--text-primary)] mb-8 leading-tight tracking-tight">
            {selectedEmail.subject}
          </h1>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-primary-500/20">
                {selectedEmail.sender[0]}
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-[var(--text-primary)] text-lg tracking-tight truncate">
                  {selectedEmail.sender}
                </h4>
                <div className="text-xs font-bold text-[var(--text-secondary)] truncate mt-0.5">
                  to {selectedEmail.recipient || 'me'}
                </div>
              </div>
            </div>
            
            <div className="text-right shrink-0">
              <div className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                {new Date(selectedEmail.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] opacity-80">
                {new Date(selectedEmail.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* Content Divider */}
        <div className="h-[1px] bg-[var(--border-color)] w-full mb-10"></div>

        {/* Email Body */}
        <div className="min-h-[600px] pb-10">
          {selectedEmail.content.includes('<') ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <iframe
                ref={iframeRef}
                title="Email Content"
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <style>
                        html, body { 
                          height: 100%; 
                          margin: 0; 
                          padding: 20px;
                          background: #ffffff;
                          color-scheme: light;
                        }
                        body { 
                          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                          line-height: 1.6;
                          color: #1e293b;
                          overflow-x: hidden;
                        }
                        img, video { max-width: 100%; height: auto !important; border-radius: 8px; }
                        a { color: #0ea5e9; }
                      </style>
                    </head>
                    <body>
                      ${selectedEmail.content}
                    </body>
                  </html>
                `}
                className="w-full border-none focus:outline-none"
                style={{ 
                  backgroundColor: '#ffffff'
                }}
                onLoad={(e) => {
                  const iframe = e.target;
                  const tryResize = () => {
                    try {
                      const doc = iframe.contentWindow.document;
                      iframe.style.height = doc.body.scrollHeight + 50 + 'px';
                    } catch (err) {}
                  };
                  tryResize();
                  setTimeout(tryResize, 1000);
                }}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap text-lg font-medium">
              {selectedEmail.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailDetailView;
