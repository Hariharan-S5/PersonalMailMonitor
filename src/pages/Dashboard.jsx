import React, { useState, useEffect } from 'react';
import SyncStatus from '../components/SyncStatus';
import { 
  Inbox, 
  Send, 
  AlertCircle, 
  Clock, 
  ArrowUpRight, 
  TrendingUp,
  Mail,
  ChevronRight,
  ShieldCheck,
  Zap,
  Briefcase,
  Layers,
  Linkedin,
  Globe,
  FileText,
  ShoppingBag,
  Star,
  Info,
  HardDrive,
  PieChart as PieChartIcon,
  BarChart3,
  CreditCard,
  PlayCircle,
  Tv,
  Plus,
  Apple,
  Loader2,
  RotateCw,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  Users,
  UserPlus
} from 'lucide-react';
import { useEmailStore } from '../store/useEmailStore';
import PremiumSpinner from '../components/PremiumSpinner';
import EcosystemFilterBanner from '../components/common/EcosystemFilterBanner';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, trend, delay, isLoading, isLiveFilter }) => (
  <div 
    className="glass-card p-6 rounded-[2rem] p-6 rounded-[2rem] flex flex-col gap-5 group hover:translate-y-[-4px] transition-all duration-500 cursor-pointer animate-fade-in relative overflow-hidden"
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
        {isLiveFilter ? 'Live' : 'Cached'}
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-[var(--text-secondary)] font-semibold text-sm uppercase tracking-wider mb-1">{title}</p>
      {isLoading ? (
        <div className="py-2.5"><PremiumSpinner size={32} className="text-slate-400" /></div>
      ) : (
        <h3 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">{value}</h3>
      )}
    </div>
    
    {/* Decorative background element */}
    <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 ${color}`}></div>
  </div>
);

const Dashboard = () => {
  const { emailsByPage, getStats, user, isLoading, fetchEmails, globalDateFilter, setActivePageId } = useEmailStore();

  const emails = emailsByPage['dashboard'] || [];

  useEffect(() => {
    setActivePageId('dashboard');
  }, [setActivePageId]);

  // Polling logic matching other screens
  const isLiveFilter = useEmailStore((s) => s.isLiveFilterActive());
  // No filter loading needed
  const lastFetchRef = React.useRef(null);

  const activePageId = useEmailStore(s => s.activePageId);
  const currentPageFilter = useEmailStore(s => s.pageFilters['dashboard']);

  useEffect(() => {
    if (activePageId !== 'dashboard') return;
    
    const filterKey = JSON.stringify(currentPageFilter);
    if (lastFetchRef.current === filterKey) return;
    lastFetchRef.current = filterKey;

    fetchEmails('dashboard');
  }, [currentPageFilter, fetchEmails, activePageId]);

  useEffect(() => {
    if (!isLiveFilter) return;
    
    const interval = setInterval(() => {
      if (!isLoading) fetchEmails();
    }, 120000);
    return () => clearInterval(interval);
  }, [fetchEmails, isLoading, isLiveFilter]);
  
  const stats = getStats();
  const jobStats = stats.jobSearch || {};
  const { 
    applicationsCount = 0, 
    interviewsCount = 0, 
    offersCount = 0, 
    rejectionsCount = 0, 
    followUpsCount = 0, 
    referralsCount = 0,
    tableData = [], 
    referralTableData = [],
    weeklyData = [] 
  } = jobStats;
  
  const isInitialLoading = isLoading && emails.length === 0 && (emailsByPage['dashboard'] || []).length === 0;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-10 mt-6 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in relative z-30">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-3">
            Job <span className="gradient-text">Monitor</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] font-medium tracking-tight">A full breakdown of your job search progress.</p>
          <div className="mt-4"><SyncStatus /></div>
        </div>
        <div className="flex flex-col items-stretch ml-auto">
          <EcosystemFilterBanner pageId="dashboard" />
          <div className="flex items-stretch justify-between gap-3 -mt-2">
            <button 
              onClick={() => fetchEmails()}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--card-bg)] text-[var(--text-primary)] rounded-2xl border border-[var(--border-color)] font-black text-xs uppercase tracking-widest shadow-sm hover:bg-[var(--background)] transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCw size={16} className={`${isLoading ? 'animate-spin' : ''} text-primary-500`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--card-bg)] text-[var(--text-primary)] rounded-2xl border border-[var(--border-color)] font-black text-xs uppercase tracking-widest shadow-sm">
              <ShieldCheck size={16} className="text-emerald-500" />
              System: Secure
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <StatCard title="Referral Count" value={referralsCount} icon={Users} color="bg-blue-500" isLoading={isInitialLoading} isLiveFilter={isLiveFilter} />
        <StatCard title="Interview Invites" value={interviewsCount} icon={Calendar} color="bg-indigo-500" isLoading={isInitialLoading} isLiveFilter={isLiveFilter} />
        <StatCard title="Offers Received" value={offersCount} icon={CheckCircle} color="bg-emerald-500" isLoading={isInitialLoading} isLiveFilter={isLiveFilter} />
        <StatCard title="Rejections" value={rejectionsCount} icon={XCircle} color="bg-red-500" isLoading={isInitialLoading} isLiveFilter={isLiveFilter} />
        <StatCard title="Success Rate" value={`${applicationsCount > 0 ? Math.round(((interviewsCount + offersCount) / applicationsCount) * 100) : 0}%`} icon={TrendingUp} color="bg-purple-500" isLoading={isInitialLoading} isLiveFilter={isLiveFilter} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* charts */}
        <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Application Activity</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Trends over the last 8 weeks</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '1rem', color: 'var(--text-primary)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="applications" name="Applications" stroke="#6366f1" fillOpacity={1} fill="url(#colorApps)" strokeWidth={3} />
                <Area type="monotone" dataKey="interviews" name="Interviews" stroke="#10b981" fillOpacity={1} fill="url(#colorInts)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Success Rate Donut */}
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <PieChartIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Outcomes</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Application stages</p>
            </div>
          </div>
          <div className="h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Pending', value: Math.max(0, applicationsCount - interviewsCount - rejectionsCount) },
                    { name: 'Interviews', value: interviewsCount },
                    { name: 'Offers', value: offersCount },
                    { name: 'Rejected', value: rejectionsCount }
                  ]}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#64748b" /> {/* Pending */}
                  <Cell fill="#10b981" /> {/* Interviews */}
                  <Cell fill="#0ea5e9" /> {/* Offers */}
                  <Cell fill="#ef4444" /> {/* Rejected */}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '1rem' }}
                  itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-[var(--text-primary)]">{applicationsCount}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#64748b]"></div><span className="text-xs font-bold text-slate-400">Pending</span></div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#10b981]"></div><span className="text-xs font-bold text-slate-400">Interview</span></div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#0ea5e9]"></div><span className="text-xs font-bold text-slate-400">Offer</span></div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ef4444]"></div><span className="text-xs font-bold text-slate-400">Rejected</span></div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in" style={{ animationDelay: '700ms' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
              <Layers size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Application History</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Detailed log of recent searches</p>
            </div>
          </div>
        </div>
        
        <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          <table className="w-full border-separate border-spacing-y-3">
            <thead className="sticky top-0 z-20 bg-[var(--background)]/80 backdrop-blur-md">
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4 text-left rounded-l-2xl border-y border-l border-[var(--border-color)]">Company</th>
                <th className="px-6 py-4 text-left border-y border-[var(--border-color)]">Role</th>
                <th className="px-6 py-4 text-center border-y border-[var(--border-color)]">Date</th>
                <th className="px-6 py-4 text-center border-y border-[var(--border-color)]">Stage</th>
                <th className="px-6 py-4 text-right rounded-r-2xl border-y border-r border-[var(--border-color)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="inline-flex flex-col items-center justify-center p-6 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                       <Briefcase size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-black text-slate-500">No applications found</h3>
                    <p className="text-sm text-slate-400 mt-2">Connecting your applications to the dashboard...</p>
                  </td>
                </tr>
              ) : (
                tableData.map((job, idx) => (
                  <tr key={job.id + idx} className="group hover:translate-x-1 transition-all duration-300">
                    <td className="px-6 py-4 bg-[var(--card-bg)]/50 rounded-l-2xl border-y border-l border-[var(--border-color)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center font-black text-lg">
                          {job.company[0]}
                        </div>
                        <span className="font-bold text-[var(--text-primary)] text-sm">{job.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-[var(--card-bg)]/50 border-y border-[var(--border-color)] font-medium text-[var(--text-secondary)] text-sm">
                      {job.role}
                    </td>
                    <td className="px-6 py-4 bg-[var(--card-bg)]/50 border-y border-[var(--border-color)] text-center text-sm font-bold text-slate-500">
                      {job.date}
                    </td>
                    <td className="px-6 py-4 bg-[var(--card-bg)]/50 border-y border-[var(--border-color)] text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                        job.stage === 'Applied' ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20' :
                        job.stage === 'Interview' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                        job.stage === 'Offer' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        job.stage === 'Follow-up' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {job.stage}
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-[var(--card-bg)]/50 rounded-r-2xl border-y border-r border-[var(--border-color)] text-right">
                       <span className={`text-sm font-black ${
                        job.status === 'Accepted' ? 'text-emerald-500' :
                        job.status === 'Rejected' ? 'text-red-500' :
                        'text-indigo-500'
                       }`}>
                         {job.status}
                       </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referral History Table */}
      <div className="glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in" style={{ animationDelay: '800ms' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Referral History</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Detailed log of recent referrals</p>
            </div>
          </div>
        </div>
        
        <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          <table className="w-full border-separate border-spacing-y-3">
            <thead className="sticky top-0 z-20 bg-[var(--background)]/80 backdrop-blur-md">
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4 text-left rounded-l-2xl border-y border-l border-[var(--border-color)]">Company</th>
                <th className="px-6 py-4 text-left border-y border-[var(--border-color)]">Role</th>
                <th className="px-6 py-4 text-center border-y border-[var(--border-color)]">Date</th>
                <th className="px-6 py-4 text-center border-y border-[var(--border-color)]">Referrer Name</th>
                <th className="px-6 py-4 text-right rounded-r-2xl border-y border-r border-[var(--border-color)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {referralTableData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="inline-flex flex-col items-center justify-center p-6 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                       <UserPlus size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-black text-slate-500">No referrals found</h3>
                    <p className="text-sm text-slate-400 mt-2">Connecting your referrals to the dashboard...</p>
                  </td>
                </tr>
              ) : (
                referralTableData.map((job, idx) => (
                  <tr key={job.id + idx} className="group hover:translate-x-1 transition-all duration-300">
                    <td className="px-6 py-4 bg-[var(--card-bg)]/50 rounded-l-2xl border-y border-l border-[var(--border-color)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center font-black text-lg">
                          {job.company[0]}
                        </div>
                        <span className="font-bold text-[var(--text-primary)] text-sm">{job.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-[var(--card-bg)]/50 border-y border-[var(--border-color)] font-medium text-[var(--text-secondary)] text-sm">
                      {job.role}
                    </td>
                    <td className="px-6 py-4 bg-[var(--card-bg)]/50 border-y border-[var(--border-color)] text-center text-sm font-bold text-slate-500">
                      {job.date}
                    </td>
                    <td className="px-6 py-4 bg-[var(--card-bg)]/50 border-y border-[var(--border-color)] text-center text-sm font-bold text-[var(--text-primary)]">
                      {job.referrer}
                    </td>
                    <td className="px-6 py-4 bg-[var(--card-bg)]/50 rounded-r-2xl border-y border-r border-[var(--border-color)] text-right">
                       <span className={`text-sm font-black ${
                        job.status === 'Accepted' ? 'text-emerald-500' :
                        job.status === 'Rejected' ? 'text-red-500' :
                        'text-blue-500'
                       }`}>
                         {job.stage === 'Applied' ? 'Referred' : job.stage}
                       </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
