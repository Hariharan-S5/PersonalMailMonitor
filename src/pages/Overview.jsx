import React from 'react';
import SyncStatus from '../components/SyncStatus';
import {
  TrendingUp,
  Zap,
  Layout,
  HardDrive,
  Mail,
  Clock,
  Send,
  FileText,
  AlertTriangle,
  Trash2,
  CheckCheck,
  Activity,
  MapPin,
  Timer,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import { useEmailStore } from '../store/useEmailStore';
import PremiumSpinner from '../components/PremiumSpinner';

const KPICard = ({ icon: Icon, title, today, total, color, formatNumber, delay, unit = "", isLoading }) => (
  <div
    className="glass-card p-6 rounded-[2rem] flex flex-col gap-5 group hover:translate-y-[-4px] transition-all duration-500 cursor-pointer animate-fade-in relative overflow-hidden h-full"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between relative z-10">
      <div className={`p-4 rounded-2xl ${color} text-white shadow-xl shadow-opacity-20 transform group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={24} />
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--background)] text-slate-400 rounded-full font-bold text-[10px] uppercase tracking-widest border border-[var(--border-color)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Live
      </div>
    </div>

    <div className="relative z-10">
      <p className="text-[var(--text-secondary)] font-semibold text-sm uppercase tracking-wider mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        {isLoading ? (
          <div className="py-1"><PremiumSpinner size={28} className="text-slate-400" /></div>
        ) : (
          <>
            <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
              {formatNumber(today)}{unit}
            </h3>
            {total !== undefined && (
              <span className="text-slate-400 font-bold text-lg">/ {formatNumber(total)}{unit}</span>
            )}
          </>
        )}
      </div>
    </div>

    <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 ${color}`}></div>
  </div>
);

const SecurityCard = ({ icon: Icon, title, value, label, color, delay, reverse, valueSize, isLoading }) => (
  <div
    className="glass-card p-6 rounded-[2rem] flex flex-col gap-5 group hover:translate-y-[-4px] transition-all duration-500 cursor-pointer animate-fade-in relative overflow-hidden h-full"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between relative z-10">
      <div className={`p-4 rounded-2xl ${color} text-white shadow-xl shadow-opacity-20 transform group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={24} />
      </div>
      <ShieldCheck size={20} className="text-emerald-500" />
    </div>

    <div className="relative z-10">
      <p className="text-[var(--text-secondary)] font-semibold text-sm uppercase tracking-wider mb-1">{title}</p>
      <div className={`flex items-baseline gap-2 ${reverse ? 'flex-row-reverse justify-end' : ''}`}>
        {isLoading ? (
          <div className="py-1"><PremiumSpinner size={28} className="text-slate-400" /></div>
        ) : (
          <>
            <h3 className={`${valueSize || 'text-xl'} font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2`}>
              {value}
              {value.toLowerCase().includes('active') && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">{label}</p>
          </>
        )}
      </div>
    </div>

    <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 ${color}`}></div>
  </div>
);

const OverviewPage = () => {
  const { getStats, user, fetchEmails, isLoading, emails } = useEmailStore();

  const stats = getStats();
  const isInitialLoading = isLoading && emails.length === 0;
  const { formatNumber, daily, security, storage } = stats;
  const storageUsagePercent = Math.min(100, Math.round((parseFloat(storage.total) / 15360) * 100));

  const kpis = [
    { icon: Mail, title: "Today Emails", today: daily.todayTotal, total: stats.incoming + stats.outgoing, color: "bg-blue-500", delay: 100 },
    { icon: CheckCheck, title: "Today Read", today: daily.todayRead, total: stats.incoming - stats.unread, color: "bg-emerald-500", delay: 150 },
    { icon: Clock, title: "Today Unread", today: daily.todayUnread, total: stats.unread, color: "bg-amber-500", delay: 200 },
    { icon: Send, title: "Today Sent", today: daily.todaySent, total: stats.outgoing, color: "bg-indigo-500", delay: 250 },
    { icon: Timer, title: "Today Reply time", today: security.avgReplyTime !== 'N/A' ? security.avgReplyTime : 0, unit: " hours", color: "bg-indigo-500", delay: 300 },
    { icon: FileText, title: "Today Drafts", today: daily.todayDrafts, total: stats.drafts, color: "bg-slate-500", delay: 350 },
    { icon: FileText, title: "Today Drafts", today: daily.todayDrafts, total: stats.drafts, color: "bg-slate-500", delay: 350 },
    { icon: Trash2, title: "Deleted Mails", today: daily.todayTrash, total: stats.trash, color: "bg-red-500", delay: 450 },
  ];

  const securityItems = [
    {
      icon: Activity,
      title: "Latest Activity",
      value: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label: new Date().toLocaleDateString(),
      color: "bg-blue-500",
      delay: 500,
      reverse: true
    },
    {
      icon: MapPin,
      title: "Known Location",
      value: `${security.location.city}, ${security.location.countryCode}`,
      label: "",
      color: "bg-emerald-500",
      delay: 600
    },
    {
      icon: Smartphone,
      title: "Authorized Devices",
      value: `${security.devices} Active`,
      label: "",
      color: "bg-primary-500",
      delay: 800
    },
    {
      icon: HardDrive,
      title: "Storage Usage",
      value: `${storageUsagePercent}%`,
      label: "Total: 15.0 GB Quota",
      color: "bg-yellow-400",
      delay: 900
    },
  ];


  return (
    <div id="overview-dashboard-root" className="space-y-10 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in px-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-3">
            Welcome back, <span className="gradient-text">{user?.displayName?.split(' ')[0] || 'User'}!</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] font-medium tracking-tight">Your personal mail ecosystem is looking healthy today.</p>
          <div className="mt-4"><SyncStatus /></div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchEmails()}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--card-bg)] text-[var(--text-primary)] rounded-2xl border border-[var(--border-color)] font-black text-xs uppercase tracking-widest shadow-sm hover:bg-[var(--background)] transition-all active:scale-95 disabled:opacity-50"
          >
            <RotateCw size={16} className={`${isLoading ? 'animate-spin' : ''} text-primary-500`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 px-6 py-3 bg-[var(--card-bg)] text-[var(--text-primary)] rounded-2xl border border-[var(--border-color)] font-black text-xs uppercase tracking-widest shadow-sm">
            <ShieldCheck size={16} className="text-emerald-500" />
            System: Secure
          </div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="px-4">
        <h2 className="text-2xl font-black text-[var(--text-primary)] mb-6 flex items-center gap-3">
          Daily <span className="text-primary-500">Intelligence</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.slice(0, 4).map((kpi, i) => (
            <KPICard key={i} {...kpi} formatNumber={formatNumber} isLoading={isInitialLoading} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
        {/* Secondary KPIs & Storage */}
        <div className="space-y-8">
          <h2 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-3">
            Category <span className="text-slate-400">Deep Dive</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {kpis.slice(4).map((kpi, i) => (
              <KPICard key={i} {...kpi} formatNumber={formatNumber} isLoading={isInitialLoading} />
            ))}
          </div>
        </div>

        {/* Security Section Redesigned */}
        <div className="space-y-8">
          <h2 className="text-2xl font-black text-[var(--text-primary)] flex items-center justify-between">
            <span>Security <span className="text-rose-500">& Insights</span></span>
            <button className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
              Details <ChevronRight size={14} />
            </button>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityItems.map((item, i) => (
              <SecurityCard key={i} {...item} isLoading={isInitialLoading} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
