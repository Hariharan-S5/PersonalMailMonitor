import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Menu, Command, ChevronDown, Settings, Check, X, Heart, Activity, Network, Zap, Code2, Wifi, Lock } from 'lucide-react';
import { useEmailStore } from '../store/useEmailStore';
import { useNavigate } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
  const { searchQuery, setSearchQuery, currentAccount, accounts, switchAccount, user, emails, preferences, setArchOverlayOpen, setWorkflowOverlayOpen, setCodeFlowOverlayOpen, setDataFlowOverlayOpen, setNetworkFlowOverlayOpen, subscriptionType } = useEmailStore();

  const handleRestrictedSystemClick = (requiredTier, action) => {
    const tierOrder = { 'Basic': 0, 'Pro': 1, 'Elite': 2 };
    const userTier = tierOrder[subscriptionType] ?? 0;
    const requiredTierVal = tierOrder[requiredTier] ?? 1;
    if (userTier >= requiredTierVal) {
      action();
    } else {
      alert(`This feature requires a ${requiredTier} subscription. Please upgrade to access it.`);
    }
  };
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);
  const [sessionUnread, setSessionUnread] = useState(2); // Starts at 2 for testing, resets on click
  const navigate = useNavigate();
  const prevEmailCountRef = useRef(emails?.length || 0);

  // Monitor for new incoming emails to trigger browser notifications
  useEffect(() => {
    const currentCount = emails?.length || 0;
    
    if (currentCount > prevEmailCountRef.current) {
      const newMailsCount = currentCount - prevEmailCountRef.current;
      setSessionUnread(prev => prev + newMailsCount);
      
      // If user enabled push alerts and browser supports it
      if (preferences?.notifyPush !== false && 'Notification' in window && Notification.permission === 'granted') {
        // Play notification sound
        try {
          const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Audio play blocked by browser', e));
        } catch (e) {
          console.error('Audio error', e);
        }

        // Show native browser push notification
        const notif = new Notification('New Mail Arrived', {
          body: `You got ${newMailsCount} new mail${newMailsCount > 1 ? 's' : ''}`,
          icon: '/favicon.ico'
        });
        
        // Auto close after 5 seconds
        setTimeout(() => notif.close(), 5000);
      }
    }
    
    prevEmailCountRef.current = currentCount;
  }, [emails?.length, preferences?.notifyPush]);

  return (
    <header className="h-24 bg-[var(--card-bg)]/70 backdrop-blur-xl border-b border-[var(--border-color)] px-8 flex items-center justify-between sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center gap-6 flex-1">
        {useEmailStore.getState().isSubscriptionVerified && (
          <button 
            onClick={toggleSidebar}
            className="p-3 hover:bg-[var(--background)] text-slate-500 rounded-2xl lg:hidden transition-colors"
          >
            <Menu size={24} />
          </button>
        )}
        
        <div className="relative max-w-xl w-full hidden md:block group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search emails, contacts, or actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-16 py-3.5 bg-[var(--background)]/50 border-2 border-transparent focus:bg-[var(--card-bg)] focus:outline-none focus:ring-0 rounded-[1.25rem] text-[var(--text-primary)] font-medium placeholder:text-slate-400 transition-all duration-300 shadow-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-sm">
            <Command size={12} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
          <div className="relative">
            <button 
              onClick={() => setIsSystemOpen(!isSystemOpen)}
              className={`p-3 hover:bg-[var(--background)] rounded-2xl transition-all group ${isSystemOpen ? 'text-primary-500 bg-[var(--background)]' : 'text-slate-500 hover:text-primary-500'}`}
              title="System Options"
            >
              <Activity size={24} className="group-hover:scale-110 transition-transform duration-500" />
            </button>

            {isSystemOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSystemOpen(false)}></div>
                <div className="absolute right-0 mt-4 w-80 bg-[var(--background)] rounded-[2rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border border-[var(--border-color)] p-4 z-50 animate-fade-in origin-top-right">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Insight</p>
                    <button 
                      onClick={() => setIsSystemOpen(false)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Subscription Architecture — Pro */}
                    <button 
                      onClick={() => { setArchOverlayOpen(true); setIsSystemOpen(false); }}
                      disabled={subscriptionType === 'Basic'}
                      className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all border group/item ${subscriptionType === 'Basic' ? 'opacity-50 cursor-not-allowed border-transparent bg-slate-50 dark:bg-slate-800/30' : 'text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 border-transparent hover:border-primary-500/20'}`}
                    >
                      {subscriptionType === 'Basic' ? (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700/50 rounded-full">
                          <Lock size={8} className="text-slate-500" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Pro</span>
                        </div>
                      ) : (
                        <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-primary-500/10 text-primary-500 rounded-full border border-primary-500/20">Pro</span>
                      )}
                      <div className={`w-10 h-10 ${subscriptionType === 'Basic' ? 'bg-slate-200 dark:bg-slate-700 text-slate-400' : 'bg-primary-500 text-white shadow-primary-500/20 shadow-lg group-hover/item:scale-110'} rounded-xl flex items-center justify-center transition-transform`}>
                        <Network size={20} />
                      </div>
                      <span className="font-bold text-[10px] uppercase tracking-wider text-center leading-tight">Subscription Architecture</span>
                    </button>

                    {/* Workflow — Pro */}
                    <button 
                      onClick={() => { setWorkflowOverlayOpen(true); setIsSystemOpen(false); }}
                      disabled={subscriptionType === 'Basic'}
                      className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all border group/item ${subscriptionType === 'Basic' ? 'opacity-50 cursor-not-allowed border-transparent bg-slate-50 dark:bg-slate-800/30' : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border-transparent hover:border-amber-500/20'}`}
                    >
                      {subscriptionType === 'Basic' ? (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700/50 rounded-full">
                          <Lock size={8} className="text-slate-500" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Pro</span>
                        </div>
                      ) : (
                        <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">Pro</span>
                      )}
                      <div className={`w-10 h-10 ${subscriptionType === 'Basic' ? 'bg-slate-200 dark:bg-slate-700 text-slate-400' : 'bg-amber-500 text-white shadow-amber-500/20 shadow-lg group-hover/item:scale-110'} rounded-xl flex items-center justify-center transition-transform`}>
                        <Zap size={20} />
                      </div>
                      <span className="font-bold text-[10px] uppercase tracking-wider text-center">Workflow</span>
                    </button>

                    {/* Code Flow — Elite */}
                    <button 
                      onClick={() => { setCodeFlowOverlayOpen(true); setIsSystemOpen(false); }}
                      disabled={subscriptionType !== 'Elite'}
                      className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all border group/item ${subscriptionType !== 'Elite' ? 'opacity-50 cursor-not-allowed border-transparent bg-slate-50 dark:bg-slate-800/30' : 'text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 border-transparent hover:border-violet-500/20'}`}
                    >
                      {subscriptionType !== 'Elite' ? (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700/50 rounded-full">
                          <Lock size={8} className="text-slate-500" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Elite</span>
                        </div>
                      ) : (
                        <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-violet-500/10 text-violet-500 rounded-full border border-violet-500/20">Elite</span>
                      )}
                      <div className={`w-10 h-10 ${subscriptionType !== 'Elite' ? 'bg-slate-200 dark:bg-slate-700 text-slate-400' : 'bg-violet-500 text-white shadow-violet-500/20 shadow-lg group-hover/item:scale-110'} rounded-xl flex items-center justify-center transition-transform`}>
                        <Code2 size={20} />
                      </div>
                      <span className="font-bold text-[10px] uppercase tracking-wider text-center">Code Flow</span>
                    </button>

                    {/* Data Flow — Elite */}
                    <button 
                      onClick={() => { setDataFlowOverlayOpen(true); setIsSystemOpen(false); }}
                      disabled={subscriptionType !== 'Elite'}
                      className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all border group/item ${subscriptionType !== 'Elite' ? 'opacity-50 cursor-not-allowed border-transparent bg-slate-50 dark:bg-slate-800/30' : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 border-transparent hover:border-cyan-500/20'}`}
                    >
                      {subscriptionType !== 'Elite' ? (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700/50 rounded-full">
                          <Lock size={8} className="text-slate-500" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Elite</span>
                        </div>
                      ) : (
                        <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-cyan-500/10 text-cyan-500 rounded-full border border-cyan-500/20">Elite</span>
                      )}
                      <div className={`w-10 h-10 ${subscriptionType !== 'Elite' ? 'bg-slate-200 dark:bg-slate-700 text-slate-400' : 'bg-cyan-500 text-white shadow-cyan-500/20 shadow-lg group-hover/item:scale-110'} rounded-xl flex items-center justify-center transition-transform`}>
                        <Activity size={20} />
                      </div>
                      <span className="font-bold text-[10px] uppercase tracking-wider text-center">Data Flow</span>
                    </button>

                    {/* Network Flow — Elite */}
                    <button 
                      onClick={() => { setNetworkFlowOverlayOpen(true); setIsSystemOpen(false); }}
                      disabled={subscriptionType !== 'Elite'}
                      className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all border group/item ${subscriptionType !== 'Elite' ? 'opacity-50 cursor-not-allowed border-transparent bg-slate-50 dark:bg-slate-800/30' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/20'}`}
                    >
                      {subscriptionType !== 'Elite' ? (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700/50 rounded-full">
                          <Lock size={8} className="text-slate-500" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Elite</span>
                        </div>
                      ) : (
                        <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">Elite</span>
                      )}
                      <div className={`w-10 h-10 ${subscriptionType !== 'Elite' ? 'bg-slate-200 dark:bg-slate-700 text-slate-400' : 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-lg group-hover/item:scale-110'} rounded-xl flex items-center justify-center transition-transform`}>
                        <Wifi size={20} />
                      </div>
                      <span className="font-bold text-[10px] uppercase tracking-wider text-center">Network Flow</span>
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>

          <button 
            onClick={() => navigate('/settings')}
            className="p-3 hover:bg-[var(--background)] text-slate-500 hover:text-primary-500 rounded-2xl transition-all group"
            title="Settings"
          >
            <Settings size={24} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>

          <button 
            onClick={() => {
              navigate('/inbox');
              setIsAccountOpen(false);
              setSessionUnread(0);
            }}
            className="p-3 hover:bg-[var(--background)] text-slate-500 hover:text-primary-500 rounded-2xl relative transition-all group"
            title="Notifications"
          >
            <Bell size={24} className="group-hover:shake" />
            {sessionUnread > 0 && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[var(--card-bg)] shadow-sm animate-pulse"></span>
            )}
          </button>
        
        <div className="h-8 w-[1px] bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        
        <div className="relative">
          <div 
            onClick={() => {
              setIsAccountOpen(!isAccountOpen);
            }}
            className="flex items-center gap-4 pl-2 group cursor-pointer p-1.5 hover:bg-[var(--background)] rounded-2xl transition-all duration-300"
          >
            <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <p className="text-sm font-black text-[var(--text-primary)] leading-none group-hover:text-primary-600 transition-colors">
                    {currentAccount?.name || user?.displayName || 'User'}
                  </p>
                </div>
              <p className="text-[11px] font-bold text-[var(--text-secondary)] truncate max-w-[180px]">
                {user?.email && user.email.length > 35 ? `${user.email.substring(0, 35)}...` : user?.email || 'Premium Account'}
              </p>
            </div>
            <div className="relative">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Profile'} 
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-[1.1rem] border-2 border-[var(--border-color)] shadow-xl group-hover:scale-105 transition-all duration-300 object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-primary-500/10 text-primary-500 rounded-[1.1rem] flex items-center justify-center font-black text-lg border-2 border-[var(--border-color)] shadow-xl group-hover:scale-105 transition-all duration-300">
                  {currentAccount?.avatar || '??'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[var(--card-bg)] shadow-sm"></div>
            </div>
             <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isAccountOpen ? 'rotate-180' : ''}`} />
          </div>

          {isAccountOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsAccountOpen(false)}></div>
              <div className="absolute right-0 mt-4 w-72 bg-[var(--background)] rounded-[2rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] border border-[var(--border-color)] p-3 z-50 animate-fade-in origin-top-right">
                <div className="p-4 mb-2 relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-slate-400">Ecosystem</p>
                    <button 
                      onClick={() => setIsAccountOpen(false)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary-500/10 text-primary-500 border border-primary-500/20">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-primary-500 text-white overflow-hidden">
                        {user?.photoURL ? <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : currentAccount?.avatar}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-black text-[var(--text-primary)] leading-none truncate">{user?.displayName}</p>
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] truncate mt-1">
                          {user?.email && user.email.length > 35 ? `${user.email.substring(0, 32)}...` : user?.email}
                        </p>
                      </div>
                      <Check size={16} className="text-primary-500 shrink-0" />
                    </div>
                  </div>
                </div>
                <div className="border-t border-[var(--border-color)] p-2 space-y-1">

                  <button 
                    onClick={() => {
                      useEmailStore.getState().logout();
                      setIsAccountOpen(false);
                      navigate('/connect');
                    }}
                    className="w-full flex items-center gap-3 p-3 text-rose-500 font-bold text-xs hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </div>
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const Plus = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);



export default Header;
