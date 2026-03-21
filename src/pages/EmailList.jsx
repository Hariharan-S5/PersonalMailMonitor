import React, { useState, useEffect } from 'react';
import SyncStatus from '../components/SyncStatus';
import { 
  Mail, 
  Trash2, 
  Archive, 
  MoreVertical, 
  Star,
  Search,
  Filter,
  ArrowRight,
  Clock,
  RotateCw,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { useEmailStore } from '../store/useEmailStore';
import PremiumSpinner from '../components/PremiumSpinner';
import EmailDetailView from './EmailDetailView';

const EmailList = ({ title, type }) => {
  const { 
    getFilteredEmails, 
    setSelectedEmail, 
    selectedEmail,
    searchQuery, 
    setSearchQuery,
    isLoading,
    fetchEmails,
    toggleStar,
    toggleImportant,
    archiveEmail,
    deleteEmail,
    emails: allEmails
  } = useEmailStore();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Reset page when searching or changing lists
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, title]);

  const allFiltered = getFilteredEmails();
  const isInitialLoading = isLoading && allEmails.length === 0;

  const totalPages = Math.max(1, Math.ceil(allFiltered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, allFiltered.length);
  const emails = allFiltered.slice(startIndex, endIndex);

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto h-[calc(100vh-160px)] flex flex-col pb-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">
            {title.includes(' ') ? (
              <>
                {title.split(' ')[0]} <span className="gradient-text">{title.split(' ').slice(1).join(' ')}</span>
              </>
            ) : (
              <span className="gradient-text">{title}</span>
            )}
            <span className="text-xl font-bold text-[var(--text-secondary)] ml-2 opacity-50">Last 24 Hours</span>
          </h1>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-primary-500/10 text-primary-500 rounded-lg text-xs font-black uppercase tracking-wider">
              {emails.length} Messages
            </span>
            {(type === 'inbox' || type === 'sent') && (
              <>
                <SyncStatus />
                <div className="flex items-center gap-2 px-3 py-1 bg-primary-500/10 text-primary-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary-500/20 shadow-sm">
                  <div className="relative">
                    <span className="animate-ping absolute inset-0 rounded-full bg-primary-400 opacity-40"></span>
                    <ShieldCheck size={14} className="relative z-10 text-primary-500" />
                  </div>
                  Protected
                </div>
              </>
            )}
            
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative md:hidden w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl shadow-sm focus:ring-4 focus:ring-primary-500/5 transition-all"
            />
          </div>
          <button 
            onClick={() => fetchEmails()}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl text-[var(--text-primary)] font-black text-sm hover:bg-[var(--background)] transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            <RotateCw size={18} className={`${isLoading ? 'animate-spin' : ''} text-primary-500`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 bg-transparent gap-6">
        {isInitialLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 animate-fade-in">
            <PremiumSpinner size={64} className="text-primary-500 mb-6" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Secure Data</p>
          </div>
        ) : allFiltered.length > 0 ? (
          <>
            {/* Email List Pane */}
            <div className={`
              flex flex-col min-h-0 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm relative overflow-hidden transition-all duration-300
              ${selectedEmail ? 'w-full lg:w-[450px] xl:w-[500px]' : 'flex-1'}
              ${selectedEmail ? 'hidden lg:flex' : 'flex'}
            `}>
              {/* Pagination Controls (Top) */}
              <div className="p-3 px-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--background)]/50 h-[52px]">
                <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                  Records {allFiltered.length > 0 ? startIndex + 1 : 0}-{endIndex} of {allFiltered.length}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-primary-500 disabled:opacity-50 disabled:hover:bg-[var(--card-bg)] disabled:hover:text-[var(--text-secondary)] transition-all shadow-sm active:scale-95"
                  >
                    Prev
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-primary-500 disabled:opacity-50 disabled:hover:bg-[var(--card-bg)] disabled:hover:text-[var(--text-secondary)] transition-all shadow-sm active:scale-95"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {emails.map((email, idx) => (
                    <div 
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`
                        flex items-center gap-4 py-3 px-4 border-b cursor-pointer transition-colors group
                        bg-[var(--background)]/30 border-[var(--border-color)] hover:bg-[var(--background)]/80
                        ${selectedEmail?.id === email.id ? 'bg-primary-500/10 border-primary-500/30 shadow-[inset_3px_0_0_var(--primary-500)]' : ''}
                        ${idx === 0 ? 'border-t-0' : ''}
                      `}
                    >
                      {/* Actions (Star & Tag) - Only show for Spam (or others), hide for Inbox/Sent */}
                      {type !== 'inbox' && type !== 'sent' && (
                        <div className="flex items-center gap-3 text-[var(--text-secondary)]/50 min-w-max pl-2">
                          <button onClick={(e) => { e.stopPropagation(); toggleStar(email.id); }} className={`hover:text-amber-400 transition-colors ${email.starred ? 'text-amber-400' : ''}`}>
                            <Star size={18} fill={email.starred ? "currentColor" : "none"} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); toggleImportant(email.id); }} className={`hover:text-primary-400 transition-colors ${email.important ? 'text-primary-400' : ''}`}>
                            <Tag size={18} fill={email.important ? "currentColor" : "none"} className="rotate-90" />
                          </button>
                        </div>
                      )}

                      {/* Sender */}
                      <div className={`truncate ${selectedEmail ? 'w-32' : 'w-40 sm:w-48 xl:w-56'} font-black text-[var(--text-primary)] transition-colors group-hover:text-primary-500`}>
                        {email.sender}
                      </div>

                      {/* Subject & Preview */}
                      <div className="flex-1 truncate hidden sm:block">
                        <span className="font-medium text-[var(--text-primary)]">
                          {email.subject}
                        </span>
                        {!selectedEmail && (
                          <>
                            <span className="opacity-30 mx-2">-</span>
                            <span className="text-[var(--text-secondary)] text-sm">
                              {email.preview}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Mobile Subject block */}
                      <div className="flex-1 min-w-0 sm:hidden">
                        <div className="truncate font-medium text-[var(--text-primary)]">{email.subject}</div>
                      </div>

                      {/* Date/Time */}
                      <div className={`w-20 text-right pr-2 text-[10px] flex justify-end items-center font-medium text-[var(--text-secondary)] whitespace-nowrap uppercase tracking-tighter opacity-70`}>
                        {(() => {
                        const date = new Date(email.date);
                        const today = new Date();
                        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                        return isToday 
                          ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                          : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail Pane */}
            {selectedEmail && (
              <div className="flex-1 lg:flex bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden z-20 lg:z-0 fixed inset-0 lg:relative lg:inset-auto">
                <EmailDetailView />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-fade-in bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm">
            <div className="w-40 h-40 bg-[var(--background)] rounded-[3rem] flex items-center justify-center mb-10 transform -rotate-6 border border-[var(--border-color)]">
              <Archive size={80} className="text-[var(--text-secondary)] opacity-10" />
            </div>
            <h3 className="text-3xl font-black text-[var(--text-primary)] mb-4 tracking-tight">Ecosystem Clear</h3>
            <p className="text-lg text-[var(--text-secondary)] max-w-sm font-medium leading-relaxed">
              We couldn't find any messages in this area.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailList;
