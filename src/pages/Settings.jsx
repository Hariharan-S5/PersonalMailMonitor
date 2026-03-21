import React from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  CreditCard,
  Plus,
  Trash2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  Sparkles
} from 'lucide-react';
import { useEmailStore } from '../store/useEmailStore';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { accounts, currentAccount, switchAccount, removeAccount, personalInfo, user, preferences, setPreferences, deviceCount, login, subscriptionType } = useEmailStore();
  const [activeSection, setActiveSection] = React.useState('accounts');
  const [isProvisioning, setIsProvisioning] = React.useState(false);
  const navigate = useNavigate();

  const handleProvisionNew = async () => {
    setIsProvisioning(true);
    await login();
    setIsProvisioning(false);
  };

  const sections = [
    { id: 'profile', icon: User, label: 'Profile', description: 'Manage your personal information' },
    { id: 'accounts', icon: Mail, label: 'Email Accounts', description: 'Manage connected email ecosystems' },
    { id: 'security', icon: Shield, label: 'Privacy & Security', description: 'Encryption and access controls' },
    { id: 'notifications', icon: Bell, label: 'Notifications', description: 'System alerts and sound settings' },
    { id: 'appearance', icon: Palette, label: 'Appearance', description: 'Custom themes and layout options' },
    { id: 'billing', icon: CreditCard, label: 'Subscription', description: 'Manage your premium plan' },
  ];

  // Helper to format DOB
  const getFormattedDOB = () => {
    if (personalInfo === null) return 'Privacy Restricted';
    if (!personalInfo?.birthdays?.length) return 'Not Provided';
    const bday = personalInfo.birthdays[0].date;
    if (!bday) return 'Not Provided';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${bday.day} ${months[bday.month - 1]} ${bday.year || ''}`;
  };

  const getGender = () => {
    if (personalInfo === null) return 'Privacy Restricted';
    if (!personalInfo?.genders?.length) return 'Not Provided';
    const gender = personalInfo.genders[0].value;
    return gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'Not Provided';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--border-color)] pb-8">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Ecosystem Preferences</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">Identity & Interface Control</p>
          </div>
        <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-100">
           <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          All Systems Nominal
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-4 space-y-2 sticky top-4 max-h-[85vh] overflow-y-auto no-scrollbar pb-6 pr-2">
          <div className="text-sm font-bold text-slate-400 mb-4 pl-4">Configuration Menu</div>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`relative w-full flex items-center gap-3 p-4 rounded-3xl transition-all duration-300 group overflow-hidden ${
                activeSection === section.id 
                  ? 'bg-[var(--card-bg)] shadow-[0_20px_50px_rgba(var(--primary-rgb),0.08)] border border-primary-500/20 scale-[1.02] z-10' 
                  : 'hover:bg-[var(--card-bg)]/60 text-slate-500 hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              {activeSection === section.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-500 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"></div>
              )}
              <div className={`p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 ml-1 ${
                activeSection === section.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-[var(--background)] text-slate-400 group-hover:bg-primary-500/10 group-hover:text-primary-500'
              }`}>
                <section.icon size={20} className={activeSection === section.id ? 'animate-pulse' : ''} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className={`text-sm font-black tracking-tight transition-colors truncate ${activeSection === section.id ? 'text-[var(--text-primary)]' : ''}`}>{section.label}</p>
                <p className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 truncate ${activeSection === section.id ? 'text-primary-500' : 'text-slate-400'}`}>{activeSection === section.id ? 'Active Node' : 'Standard'}</p>
              </div>
              <ChevronRight size={18} className={`transition-all duration-300 shrink-0 ${activeSection === section.id ? 'text-primary-500 opacity-100 transform translate-x-1' : 'text-slate-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 space-y-10">
            {activeSection === 'profile' ? (
              <div className="space-y-8 animate-slide-in-bottom">
                <div className="bg-[var(--card-bg)] rounded-[3rem] p-10 md:p-14 border border-[var(--border-color)] shadow-[0_30px_70px_rgba(15,23,42,0.05)] relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-10 mb-12">
                      <div className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 border-4 border-white shadow-2xl overflow-hidden relative z-10 transition-transform duration-500 group-hover:scale-105">
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white">
                              {user?.displayName?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg text-white z-20">
                          <ShieldCheck size={20} />
                        </div>
                      </div>
                      <div className="text-center md:text-left space-y-2">
                        <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">{user?.displayName}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                          <span className="text-sm font-bold text-primary-500 bg-primary-500/10 px-4 py-1.5 rounded-full border border-primary-500/20">{user?.email}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 border border-[var(--border-color)] px-3 py-1.5 rounded-full">Ecosystem ID: {user?.uid?.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-6 bg-[var(--background)] rounded-3xl border border-[var(--border-color)] space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biological Gender</p>
                        <p className="text-lg font-black text-[var(--text-primary)]">{getGender()}</p>
                      </div>
                      <div className="p-6 bg-[var(--background)] rounded-3xl border border-[var(--border-color)] space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cycle of Birth</p>
                        <p className="text-lg font-black text-[var(--text-primary)]">{getFormattedDOB()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative background blur */}
                  <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-500/5 rounded-full blur-[100px]"></div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                   <div className="p-8 bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--border-color)] flex flex-col items-center text-center space-y-4">
                      <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-[var(--text-primary)] text-sm">Auth Sync</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: Optimized</p>
                      </div>
                   </div>
                   <div className="p-8 bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--border-color)] flex flex-col items-center text-center space-y-4">
                      <div className="w-14 h-14 bg-sky-500/10 text-sky-500 rounded-2xl flex items-center justify-center shadow-inner">
                        <Globe size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-[var(--text-primary)] text-sm">Global Node</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Loc: System Default</p>
                      </div>
                   </div>
                   <div className="p-8 bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--border-color)] flex flex-col items-center text-center space-y-4">
                      <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shadow-inner">
                        <Zap size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-[var(--text-primary)] text-sm">Direct Flow</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Active</p>
                      </div>
                   </div>
                </div>
              </div>
            ) : activeSection === 'accounts' ? (
              <div className="bg-[var(--card-bg)] rounded-[3rem] p-10 md:p-14 border border-[var(--border-color)] shadow-[0_30px_70px_rgba(15,23,42,0.05)] transition-all duration-500 animate-slide-in-bottom">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Email Environments</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Manage and synchronize your connected account nodes</p>
                </div>
                <button 
                  onClick={handleProvisionNew}
                  disabled={isProvisioning}
                  className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/30 active:scale-95 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isProvisioning ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus size={18} />
                  )}
                  {isProvisioning ? 'Connecting...' : 'Provision New'}
                </button>
              </div>

              <div className="grid gap-6">
                {accounts.map((account) => (
                  <div 
                    key={account.id}
                    className={`group flex items-center gap-6 p-1 bg-[var(--card-bg)] rounded-3xl transition-all duration-500 border-2 ${
                      currentAccount?.id === account.id 
                        ? 'border-primary-100 shadow-[0_15px_35px_rgba(14,165,233,0.08)]' 
                        : 'border-[var(--border-color)] hover:border-primary-100 hover:shadow-xl hover:shadow-slate-200/40'
                    }`}
                  >
                    <div className="p-1 flex-1 flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center font-black text-2xl shadow-inner transition-all duration-500 overflow-hidden group-hover:scale-105 ${
                        currentAccount?.id === account.id ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-primary-500/20' : 'bg-[var(--background)] text-slate-300'
                      }`}>
                        {account.photoURL ? (
                          <img src={account.photoURL} alt={account.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : account.avatar?.startsWith('http') ? (
                          <img src={account.avatar} alt={account.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          account.avatar
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                           <h4 className="font-black text-[var(--text-primary)] text-xl tracking-tight leading-none">{account.name}</h4>
                           {currentAccount?.id === account.id && (
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full border border-emerald-500/20">
                               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> ACTIVE NODE
                             </div>
                           )}
                        </div>
                        <p className="text-sm font-bold text-slate-400 mt-2 tracking-tight">{account.email}</p>
                      </div>
                    </div>
                    
                    <div className="px-6 flex items-center gap-4">
                      {currentAccount?.id !== account.id ? (
                        <button 
                          onClick={() => switchAccount(account.id)}
                          className="px-6 py-2.5 bg-[var(--background)] text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary-500 hover:text-white transition-all border border-[var(--border-color)]"
                        >
                          Switch Node
                        </button>
                      ) : (
                        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Main Ecosystem</div>
                      )}
                      <button 
                        onClick={() => removeAccount(account.id)}
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-90"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          ) : activeSection === 'security' ? (
            <div className="bg-[var(--card-bg)] rounded-[3rem] p-10 md:p-14 border border-[var(--border-color)] shadow-[0_30px_70px_rgba(15,23,42,0.05)] animate-slide-in-bottom">
              <div className="mb-12">
                <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Privacy & Security</h2>
                <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">Our multi-layered approach to protecting your identity and data</p>
              </div>

              <div className="grid gap-8">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)] space-y-4">
                    <div className="w-12 h-12 bg-primary-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[rgba(var(--primary-rgb),0.2)]">
                      <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Privacy-First Ecosystem</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                      Your personal emails and identity data are never stored on external servers. Processing occurs entirely within your active browser session and Google account environment.
                    </p>
                  </div>
                  <div className="flex-1 p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)] space-y-4">
                    <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Globe size={24} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">End-to-End Encryption</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                      All data transit between MailMonitor and Google services is encrypted using industry-standard TLS protocols, ensuring your information is never exposed to third parties.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)] space-y-4">
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Shield size={24} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Data Ownership</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                      You retain full ownership of your data. MailMonitor only acts as a lens into your Google ecosystem, never claiming any rights or access beyond current session visibility.
                    </p>
                  </div>
                  <div className="flex-1 p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)] space-y-4">
                    <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                      <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Zero Monetization</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                      We do not sell, share, or monetize your personal information or email data. Your privacy belongs to you, and our architecture is designed to keep it that way.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)] space-y-4">
                    <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Verified App Security</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                      MailMonitor utilizes Google-verified OAuth scopes to ensure the highest level of security. We undergo regular internal security audits to maintain absolute system integrity.
                    </p>
                  </div>
                  <div className="flex-1 p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)] space-y-4">
                    <div className="w-12 h-12 bg-sky-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                      <Bell size={24} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Ecosystem Monitoring</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                      Your connected ecosystems are monitored for security alerts and suspicious device logins in real-time. Any anomalies are immediately flagged directly to your dashboard.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)] space-y-4">
                    <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Shield size={24} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Local Storage Security</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                      Sensitive session tokens are stored exclusively in your browser's private local storage. They are never transmitted to our servers and remain under your device's hardware encryption.
                    </p>
                  </div>
                  <div className="flex-1 p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)] space-y-4">
                    <div className="w-12 h-12 bg-primary-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[rgba(var(--primary-rgb),0.2)]">
                      <CheckCircle2 size={24} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Session Termination</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                      Logging out of MailMonitor immediately and permanently destroys all local session data and access tokens. Your browser environment is left completely clean and secure.
                    </p>
                  </div>
                </div>

                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group">
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
                      <Shield size={32} className="text-primary-400" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-black tracking-tight">Google OAuth 2.0 Integration</h3>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed">
                        We use Google's secure OAuth architecture. We never see your password, and you can revoke access at any time through your Google Account's security settings.
                      </p>
                    </div>
                  </div>
                  <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary-500/10 rounded-full blur-[80px]"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                   <div className="p-6 border border-[var(--border-color)] rounded-3xl flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[var(--text-primary)] tracking-tight">Verified Scopes</p>
                        <p className="text-[11px] font-bold text-[var(--text-secondary)]">Only essential permissions requested</p>
                      </div>
                   </div>
                   <div className="p-6 border border-[var(--border-color)] rounded-3xl flex items-center gap-4">
                      <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center">
                        <Trash2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[var(--text-primary)] tracking-tight">Data Integrity</p>
                        <p className="text-[11px] font-bold text-[var(--text-secondary)]">Automatic local cache purging on logout</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ) : activeSection === 'notifications' ? (
            <div className="bg-[var(--card-bg)] rounded-[3rem] p-10 md:p-14 border border-[var(--border-color)] shadow-[0_30px_70px_rgba(15,23,42,0.05)] animate-slide-in-bottom">
              <div className="mb-12">
                <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Notification Center</h2>
                <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">Configure how and when you receive alerts from your ecosystems</p>
              </div>

              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Push Notifications */}
                  <div className="p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)] relative group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1.5">
                        <div className="w-10 h-10 bg-primary-500/10 text-primary-500 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                          <Bell size={20} />
                        </div>
                        <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Push Alerts</h3>
                        <p className="text-xs font-medium text-[var(--text-secondary)] leading-relaxed">Receive instant browser notifications for new emails arriving in your priority folders.</p>
                      </div>
                      <button 
                        onClick={() => {
                          const newValue = preferences.notifyPush === false ? true : false;
                          
                          if (newValue && 'Notification' in window) {
                            if (Notification.permission === 'granted') {
                              new Notification('Push Alerts Enabled', {
                                body: 'You will now receive instant ecosystem alerts directly to your desktop.',
                              });
                            } else if (Notification.permission !== 'denied') {
                              Notification.requestPermission().then(permission => {
                                if (permission === 'granted') {
                                  new Notification('Push Alerts Enabled', {
                                    body: 'You will now receive instant ecosystem alerts directly to your desktop.',
                                  });
                                }
                              });
                            }
                          }
                          
                          setPreferences({ notifyPush: newValue });
                        }}
                        className={`w-14 h-8 rounded-full p-1 transition-colors relative shrink-0 mt-1 ${preferences.notifyPush !== false ? 'bg-primary-500' : 'bg-slate-200'}`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-sm absolute transition-all duration-300 ${preferences.notifyPush !== false ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                  </div>

                  {/* Security Alerts */}
                  <div className="p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)] relative overflow-hidden group">
                    <div className="flex items-start justify-between gap-4 relative z-10">
                      <div className="flex-1 space-y-1.5">
                        <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                          <Shield size={20} />
                        </div>
                        <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Security Alerts</h3>
                        <p className="text-xs font-medium text-[var(--text-secondary)] leading-relaxed">Mandatory security notifications for unusual sign-in attempts or account changes.</p>
                      </div>
                      <button 
                        disabled
                        className="w-14 h-8 rounded-full p-1 bg-rose-500 opacity-80 cursor-not-allowed relative shrink-0 mt-1"
                      >
                        <div className="w-6 h-6 bg-white rounded-full shadow-sm absolute translate-x-6 flex items-center justify-center">
                           <Lock size={12} className="text-rose-500" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Daily Digest Feature */}
                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shrink-0 shadow-lg">
                      <Mail size={32} className="text-primary-400" />
                    </div>
                    <div className="flex-1 space-y-2 text-center md:text-left">
                      <h3 className="text-xl font-black tracking-tight">Daily Digest Summary</h3>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-2xl">
                        Rather than being pinged constantly, get a single beautifully formatted summary of your email ecosystem sent to you once a day at 8:00 AM.
                      </p>
                    </div>
                    <button 
                        onClick={() => setPreferences({ notifyDigest: !preferences.notifyDigest })}
                        className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 ${preferences.notifyDigest ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
                      >
                        {preferences.notifyDigest ? 'Active' : 'Enable Digest'}
                    </button>
                  </div>
                  <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-500/20 rounded-full blur-[100px] group-hover:bg-primary-500/30 transition-all duration-700"></div>
                  <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                </div>
              </div>
            </div>
          ) : activeSection === 'appearance' ? (
            <div className="bg-[var(--card-bg)] rounded-[3rem] p-10 md:p-14 border border-[var(--border-color)] shadow-[0_30px_70px_rgba(15,23,42,0.05)] animate-slide-in-bottom">
              <div className="mb-12">
                <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Appearance & Theme</h2>
                <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">Customize your visual interface and ecosystem aesthetics</p>
              </div>

              <div className="space-y-12">
                {/* Theme Selection */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Visual Mode</h3>
                  <div className="grid grid-cols-3 gap-6">
                    {['light', 'dark', 'system'].map((mode) => {
                      const isSystemRestricted = subscriptionType === 'Basic' && mode === 'system';
                      
                      return (
                        <button 
                          key={mode} 
                          onClick={() => {
                            if (isSystemRestricted) {
                              alert("System appearance sync is a Pro feature! Upgrade to enable it.");
                              navigate('/plans');
                            } else {
                              setPreferences({ theme: mode });
                            }
                          }}
                          className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col items-center gap-4 group ${
                            preferences.theme === mode 
                              ? 'bg-primary-500/10 border-primary-500/40 shadow-lg shadow-primary-500/10' 
                              : 'bg-[var(--background)] border-[var(--border-color)] hover:border-primary-500/40'} ${isSystemRestricted ? 'opacity-60 grayscale-[0.5]' : ''}`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${
                            preferences.theme === mode ? 'bg-primary-500 text-white shadow-lg' : 'bg-[var(--card-bg)] text-slate-400 group-hover:bg-primary-500/20 group-hover:text-primary-500'}`}>
                            {mode === 'light' ? <Palette size={24} /> : mode === 'dark' ? <Shield size={24} /> : <Globe size={24} />}
                            {isSystemRestricted && (
                              <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-primary-500 text-white text-[7px] font-black rounded backdrop-blur-md shadow-lg uppercase tracking-tighter">Pro</div>
                            )}
                          </div>
                          <span className={`text-sm font-black tracking-tight capitalize ${preferences.theme === mode ? 'text-primary-500' : 'text-[var(--text-secondary)]'}`}>{mode}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between pl-1">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Signature Accent</h3>
                    {subscriptionType === 'Basic' && (
                      <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">More in Elite</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { name: 'Sky Blue', color: 'bg-sky-500', hex: '#0ea5e9' },
                      { name: 'Indigo', color: 'bg-indigo-500', hex: '#6366f1' },
                      { name: 'Emerald', color: 'bg-emerald-500', hex: '#10b981' },
                      { name: 'Violet', color: 'bg-violet-500', hex: '#8b5cf6', restricted: 'Elite' },
                      { name: 'Teal', color: 'bg-teal-500', hex: '#14b8a6', restricted: 'Elite' },
                      { name: 'Rose', color: 'bg-rose-500', hex: '#f43f5e', restricted: 'Elite' },
                      { name: 'Amber', color: 'bg-amber-500', hex: '#f59e0b', restricted: 'Elite' },
                      { name: 'Orange', color: 'bg-orange-500', hex: '#f97316', restricted: 'Elite' }
                    ].map((accent) => {
                      const isColorRestricted = (subscriptionType === 'Basic' && accent.restricted) || (subscriptionType === 'Pro' && accent.restricted === 'Elite');
                      
                      return (
                        <button 
                          key={accent.name} 
                          onClick={() => {
                            if (isColorRestricted) {
                              alert(`${accent.name} is an ${accent.restricted} accent color! Upgrade to unlock all colors.`);
                              navigate('/plans');
                            } else {
                              setPreferences({ accentName: accent.name, accentColor: accent.hex });
                            }
                          }}
                          className={`group flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all duration-300 relative ${
                            preferences.accentName === accent.name ? 'bg-primary-500/10 border-primary-500 shadow-md' : 'bg-[var(--background)] border-[var(--border-color)] hover:border-primary-500/40'} ${isColorRestricted ? 'opacity-60' : ''}`}
                        >
                          <div className={`w-4 h-4 rounded-full ${accent.color} shadow-sm group-hover:scale-125 transition-transform`}></div>
                          <span className="text-sm font-bold text-[var(--text-primary)]">{accent.name}</span>
                          {preferences.accentName === accent.name && <CheckCircle2 size={14} className="text-primary-500 ml-1" />}
                          {isColorRestricted && (
                            <div className={`absolute -top-2 -right-1 px-1 py-0.5 border text-[6px] font-black rounded uppercase ${accent.restricted === 'Elite' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' : 'bg-primary-500/10 border-primary-500/20 text-primary-500'}`}>{accent.restricted}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Interface Density */}
                  <div className={`p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)] relative transition-all ${subscriptionType === 'Basic' ? 'grayscale-[0.8] opacity-70' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1.5 text-center md:text-left">
                        <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Compact Mode</h3>
                        <p className="text-xs font-medium text-[var(--text-secondary)] leading-relaxed">Makes everything a bit smaller and closer together so you can see more on screen at once.</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${preferences.isCompact ? 'text-primary-500' : 'text-slate-400'}`}>
                          {preferences.isCompact ? '● Dense Layout Active' : '○ Spacious Layout'}
                        </p>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={() => {
                            if (subscriptionType === 'Basic') {
                              alert("Compact Mode is an Elite feature! Upgrade for dense ecosystem layouts.");
                              navigate('/plans');
                            } else {
                              setPreferences({ isCompact: !preferences.isCompact });
                            }
                          }}
                          className={`w-14 h-8 rounded-full p-1 transition-colors relative shrink-0 mt-1 ${preferences.isCompact ? 'bg-primary-500' : 'bg-slate-200'}`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full shadow-sm absolute transition-all duration-300 ${preferences.isCompact ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                        {subscriptionType === 'Basic' && (
                          <div className="absolute -top-4 -right-2 px-2 py-0.5 bg-purple-500 text-white text-[7px] font-black rounded shadow-lg uppercase tracking-widest">Elite</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Glassmorphism */}
                  <div className={`p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)] relative transition-all ${subscriptionType === 'Basic' ? 'grayscale-[0.8] opacity-70' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1.5 text-center md:text-left">
                        <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Glass Layers</h3>
                        <p className="text-xs font-medium text-[var(--text-secondary)] leading-relaxed">Makes cards look see-through and glassy. Turn it off if you prefer a clean, solid background.</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${preferences.glassDepth === 40 ? 'text-primary-500' : 'text-slate-400'}`}>
                          {preferences.glassDepth === 40 ? '● Frosted Glass Active' : '○ Solid Surface'}
                        </p>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={() => {
                            if (subscriptionType === 'Basic') {
                              alert("Glass Layers is an Elite feature! Upgrade for a premium frosted interface.");
                              navigate('/plans');
                            } else {
                              setPreferences({ glassDepth: preferences.glassDepth === 85 ? 40 : 85 });
                            }
                          }}
                          className={`w-14 h-8 rounded-full p-1 transition-colors relative shrink-0 mt-1 ${preferences.glassDepth === 40 ? 'bg-primary-500' : 'bg-slate-200'}`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full shadow-sm absolute transition-all duration-300 ${preferences.glassDepth === 40 ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                        {subscriptionType === 'Basic' && (
                          <div className="absolute -top-4 -right-2 px-2 py-0.5 bg-purple-500 text-white text-[7px] font-black rounded shadow-lg uppercase tracking-widest">Elite</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeSection === 'billing' ? (
            <div className="bg-[var(--card-bg)] rounded-[3rem] p-10 md:p-14 border border-[var(--border-color)] shadow-[0_30px_70px_rgba(15,23,42,0.05)] animate-slide-in-bottom">
              <div className="mb-12 flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Subscription & Billing</h2>
                  <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">Manage your Premium Ecosystem plan and payment details</p>
                </div>
                <div className={`px-4 py-2 border rounded-xl font-black tracking-widest text-[10px] uppercase shadow-sm ${
                  subscriptionType === 'Elite' ? 'bg-purple-900 border-purple-700 text-purple-200' :
                  subscriptionType === 'Pro' ? 'bg-primary-900 border-primary-700 text-primary-200' :
                  'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                  {subscriptionType} Active
                </div>
              </div>

              <div className="space-y-8">
                {/* Plan Overview Card */}
                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                       <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                         MailMonitor {subscriptionType}
                         {subscriptionType !== 'Basic' ? <ShieldCheck size={18} className={subscriptionType === 'Elite' ? 'text-purple-400' : 'text-primary-400'} /> : <ShieldCheck size={18} className="text-slate-500" />}
                       </h3>
                       <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm">
                         {subscriptionType === 'Elite' 
                           ? "You are currently on the Elite plan. All ultimate integrations and HR monitoring systems are fully unlocked." 
                           : subscriptionType === 'Pro'
                           ? "You are currently on the Pro plan. Upgrade to unlock limitless AI capabilities and Elite features like HR parsing."
                           : "You are currently on the Basic plan. Upgrade to unlock limitless AI capabilities, impenetrable encryption, and elite features."}
                       </p>
                    </div>
                     <div className="flex gap-3">
                        <button 
                          onClick={() => navigate('/plans')}
                          className={`relative group px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95 overflow-hidden flex items-center gap-2 ${
                            subscriptionType === 'Elite' ? 'bg-slate-800 hover:bg-slate-700 shadow-xl' : 'bg-gradient-to-r from-primary-500 to-indigo-600 shadow-xl shadow-primary-500/25'
                          }`}
                        >
                          {subscriptionType !== 'Elite' && <div className="absolute inset-0 w-1/2 h-full bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>}
                          {subscriptionType !== 'Elite' && <Sparkles size={16} className="text-white animate-pulse" />}
                          <span className="relative z-10">{subscriptionType === 'Elite' ? 'View Plans' : 'Upgrade Plan'}</span>
                        </button>
                     </div>

                    <style>{`
                      @keyframes shimmer {
                        0% { transform: translateX(-200%) skewX(-12deg); }
                        100% { transform: translateX(200%) skewX(-12deg); }
                      }
                      .group-hover\\:animate-shimmer {
                        animation: shimmer 1s ease-in-out infinite;
                      }
                    `}</style>
                  </div>
                  <div className={`absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] transition-all duration-700 ${
                    subscriptionType === 'Elite' ? 'bg-purple-500/20 group-hover:bg-purple-500/30' :
                    subscriptionType === 'Pro' ? 'bg-primary-500/20 group-hover:bg-primary-500/30' :
                    'bg-slate-500/10 group-hover:bg-slate-500/20'
                  }`}></div>
                </div>

                {/* Show usage and payment only for Pro/Elite tiers */}
                {false && (
                  <>
                    {/* Usage Stats */}
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                              <CheckCircle2 size={20} />
                            </div>
                            <span className="text-xs font-bold text-[var(--text-secondary)]">45% used</span>
                        </div>
                        <h4 className="text-sm font-black text-[var(--text-primary)]">Encrypted Storage</h4>
                        <p className="text-xs font-bold text-slate-400 mt-1 mb-4">45 GB of 100 GB</p>
                        <div className="w-full bg-[var(--border-color)] h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                      <div className="p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
                              <Zap size={20} />
                            </div>
                            <span className="text-xs font-bold text-[var(--text-secondary)]">240 left</span>
                        </div>
                        <h4 className="text-sm font-black text-[var(--text-primary)]">AI Processing Queries</h4>
                        <p className="text-xs font-bold text-slate-400 mt-1 mb-4">760 / 1000 monthly limit</p>
                        <div className="w-full bg-[var(--border-color)] h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '76%' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="p-8 bg-[var(--background)] rounded-[2.5rem] border border-[var(--border-color)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="flex flex-row items-center gap-4">
                        <div className="w-14 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 shadow-inner">
                            <span className="text-white font-black text-xs italic tracking-tighter">VISA</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[var(--text-primary)]">•••• •••• •••• 4242</h4>
                          <p className="text-xs font-medium text-slate-400">Expires 12/28</p>
                        </div>
                      </div>
                      <button className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--card-bg)] transition-colors active:scale-95">
                        Update Method
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[var(--card-bg)] rounded-[3rem] p-10 md:p-14 border border-[var(--border-color)] shadow-[0_30px_70px_rgba(15,23,42,0.05)] flex flex-col items-center justify-center text-center space-y-4">
               <div className="w-20 h-20 bg-[var(--background)] rounded-[2rem] flex items-center justify-center text-[var(--text-secondary)]">
                 <Shield size={40} />
               </div>
               <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Module Under Construction</h3>
               <p className="text-[var(--text-secondary)] font-medium max-w-sm">The <strong>{sections.find(s => s.id === activeSection)?.label}</strong> configuration layer is currently being optimized for the premium ecosystem.</p>
            </div>
          )}

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-[0_30px_70px_rgba(15,23,42,0.15)] animate-slide-in-bottom" style={{ animationDelay: '150ms' }}>
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
              <div className="relative">
                <div className="animate-ping absolute inset-0 rounded-3xl bg-primary-400 opacity-20 scale-150"></div>
                <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 shrink-0 relative z-10 shadow-2xl">
                  <ShieldCheck size={48} className="text-primary-400" />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left space-y-3">
                <h3 className="text-3xl font-black tracking-tight">Security Ecosystem</h3>
                <p className="text-slate-400 font-bold text-lg leading-relaxed max-w-md opacity-90">
                  Your configuration is synchronized across {deviceCount || 1} device{(deviceCount || 1) !== 1 ? 's' : ''} with military-grade encryption active.
                </p>
              </div>
              <button 
                onClick={() => setActiveSection('security')}
                className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-400 hover:text-white hover:shadow-[0_15px_30px_rgba(14,165,233,0.3)] transition-all active:scale-95 whitespace-nowrap">
                Review Status
              </button>
            </div>
            {/* Background decorative elements */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-500/10 rounded-full blur-[100px] group-hover:bg-primary-500/20 transition-all duration-700"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
