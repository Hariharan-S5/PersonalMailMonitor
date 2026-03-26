import React, { useEffect } from 'react';
import SyncStatus from '../components/SyncStatus';
import { 
  Users, 
  Briefcase, 
  ClipboardCheck, 
  Calendar, 
  Award, 
  XCircle,
  TrendingUp,
  PieChart as PieChartIcon,
  Layers,
  Activity,
  RotateCw,
  Search,
  CheckCircle,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { useEmailStore } from '../store/useEmailStore';
import PremiumSpinner from '../components/PremiumSpinner';
import EcosystemFilterBanner from '../components/common/EcosystemFilterBanner';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, delay, isLoading, isLiveFilter }) => (
  <div 
    className="glass-card p-6 rounded-[2rem] flex flex-col gap-5 group hover:translate-y-[-4px] transition-all duration-500 cursor-pointer animate-fade-in relative overflow-hidden"
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
    <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 ${color}`}></div>
  </div>
);

const HRTracker = () => {
  const { user, fetchEmails, isLoading, getStats, emailsByPage, activePageId, setActivePageId, globalDateFilter } = useEmailStore();
  // No filter loading needed
  const lastFetchRef = React.useRef(null);

  const emails = emailsByPage['hr-tracker'] || [];

  useEffect(() => {
    setActivePageId('hr-tracker');
  }, [setActivePageId]);

  const isLiveFilter = useEmailStore((s) => s.isLiveFilterActive());

  const currentPageFilter = useEmailStore(s => s.pageFilters['hr-tracker']);

  useEffect(() => {
    if (activePageId !== 'hr-tracker') return;
    
    const filterKey = JSON.stringify(currentPageFilter);
    if (lastFetchRef.current === filterKey) return;
    lastFetchRef.current = filterKey;

    fetchEmails('hr-tracker');
  }, [currentPageFilter, fetchEmails, activePageId]);

  useEffect(() => {
    if (!isLiveFilter) return;
    
    const interval = setInterval(() => {
      if (!isLoading) fetchEmails('hr-tracker');
    }, 120000);
    return () => clearInterval(interval);
  }, [fetchEmails, isLoading, isLiveFilter]);
  
  const stats = getStats();
  const hrStats = stats.hr || {};
  const { 
    postingsCount = 0,
    appliedCount = 0,
    shortlistedCount = 0,
    interviewsCount = 0,
    offersCount = 0,
    offersAcceptedCount = 0,
    rejectedCount = 0,
    tableData = [],
    weeklyData = [],
    rolesData = [],
    activityFeed = []
  } = hrStats;

  // Colors for charts
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Pipeline Data
  const pipelineData = [
    { name: 'Applied', value: appliedCount },
    { name: 'Shortlisted', value: shortlistedCount },
    { name: 'Interviews', value: interviewsCount },
    { name: 'Offers Sent', value: offersCount },
    { name: 'Accepted', value: offersAcceptedCount }
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-10 mt-6 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in relative z-30">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-3">
            HR <span className="gradient-text">Monitor</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] font-medium tracking-tight">Real-time recruitment and candidate pipeline.</p>
          <div className="mt-4"><SyncStatus /></div>
        </div>
        <div className="flex flex-col items-stretch ml-auto">
          <EcosystemFilterBanner pageId="hr-tracker" />
          <div className="flex items-stretch justify-between gap-3 -mt-2">
            <button 
              onClick={() => fetchEmails('hr-tracker')}
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

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <StatCard title="Open Postings" value={postingsCount} icon={Briefcase} color="bg-indigo-500" delay={200} isLoading={isLoading && emails.length === 0 && (emailsByPage['hr-tracker'] || []).length === 0} isLiveFilter={isLiveFilter} />
        <StatCard title="Total Applied" value={appliedCount} icon={Users} color="bg-blue-500" delay={300} isLoading={isLoading && emails.length === 0 && (emailsByPage['hr-tracker'] || []).length === 0} isLiveFilter={isLiveFilter} />
        <StatCard title="Shortlisted" value={shortlistedCount} icon={ClipboardCheck} color="bg-amber-500" delay={400} isLoading={isLoading && emails.length === 0 && (emailsByPage['hr-tracker'] || []).length === 0} isLiveFilter={isLiveFilter} />
        <StatCard title="Interviews" value={interviewsCount} icon={Calendar} color="bg-purple-500" delay={500} isLoading={isLoading && emails.length === 0 && (emailsByPage['hr-tracker'] || []).length === 0} isLiveFilter={isLiveFilter} />
        <StatCard title="Offers Sent" value={offersCount} icon={FileText} color="bg-pink-500" delay={600} isLoading={isLoading && emails.length === 0 && (emailsByPage['hr-tracker'] || []).length === 0} isLiveFilter={isLiveFilter} />
        <StatCard title="Offers Accepted" value={offersAcceptedCount} icon={Award} color="bg-emerald-500" delay={700} isLoading={isLoading && emails.length === 0 && (emailsByPage['hr-tracker'] || []).length === 0} isLiveFilter={isLiveFilter} />
        <StatCard title="Rejected" value={rejectedCount} icon={XCircle} color="bg-red-500" delay={800} isLoading={isLoading && emails.length === 0 && (emailsByPage['hr-tracker'] || []).length === 0} isLiveFilter={isLiveFilter} />
        <StatCard title="Success Rate" value={`${appliedCount > 0 ? Math.round((offersAcceptedCount / appliedCount) * 100) : 0}%`} icon={TrendingUp} color="bg-sky-500" delay={900} isLoading={isLoading && emails.length === 0 && (emailsByPage['hr-tracker'] || []).length === 0} isLiveFilter={isLiveFilter} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Pipeline Chart */}
        <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Hiring Pipeline</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Candidate drop-off across stages</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  cursor={{fill: 'var(--border-color)', opacity: 0.2}}
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '1rem', color: 'var(--text-primary)' }}
                  itemStyle={{ fontWeight: 'bold', color: 'var(--primary-400)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={32}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Roles Distribution Donut */}
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in flex flex-col" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <PieChartIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Roles</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Top candidate mapping</p>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] relative flex items-center justify-center">
            {rolesData.length === 0 ? (
              <div className="text-slate-400 text-sm font-bold">No candidates found</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rolesData}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {rolesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '1rem' }}
                    itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {rolesData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-30px]">
                <span className="text-3xl font-black text-[var(--text-primary)]">{appliedCount}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Detailed Table */}
        <div className="xl:col-span-3 glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
                <Layers size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Candidate Tracking</h2>
                <p className="text-sm text-[var(--text-secondary)] font-medium">Detailed candidate list</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search candidates..." className="pl-12 pr-4 py-3 bg-[var(--background)] border border-[var(--border-color)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full md:w-64 text-[var(--text-primary)] placeholder-slate-500 font-medium" />
            </div>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            <table className="w-full border-separate border-spacing-y-3">
              <thead className="sticky top-0 z-20 bg-[var(--background)]/80 backdrop-blur-md">
                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-6 py-4 text-left rounded-l-2xl border-y border-l border-[var(--border-color)]">Candidate</th>
                  <th className="px-6 py-4 text-left border-y border-[var(--border-color)]">Role</th>
                  <th className="px-6 py-4 text-center border-y border-[var(--border-color)]">Date</th>
                  <th className="px-6 py-4 text-center border-y border-[var(--border-color)]">Stage</th>
                  <th className="px-6 py-4 text-right rounded-r-2xl border-y border-r border-[var(--border-color)]">Recruiter / Status</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="inline-flex items-center justify-center p-6 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                         <Briefcase size={32} className="text-slate-400" />
                      </div>
                      <h3 className="text-lg font-black text-slate-500">No candidates found</h3>
                      <p className="text-sm text-slate-400 mt-2">Connecting your applicant tracking to the dashboard...</p>
                    </td>
                  </tr>
                ) : (
                  tableData.map((candidate, idx) => (
                    <tr key={candidate.id + idx} className="group hover:translate-x-1 transition-all duration-300">
                      <td className="px-6 py-4 bg-[var(--card-bg)]/50 rounded-l-2xl border-y border-l border-[var(--border-color)]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center font-black text-lg shadow-sm">
                            {candidate.name[0]}
                          </div>
                          <span className="font-bold text-[var(--text-primary)] text-sm">{candidate.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 bg-[var(--card-bg)]/50 border-y border-[var(--border-color)] font-medium text-[var(--text-secondary)] text-sm">
                        {candidate.role}
                      </td>
                      <td className="px-6 py-4 bg-[var(--card-bg)]/50 border-y border-[var(--border-color)] text-center text-sm font-bold text-slate-500">
                        {candidate.date}
                      </td>
                      <td className="px-6 py-4 bg-[var(--card-bg)]/50 border-y border-[var(--border-color)] text-center">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                          candidate.stage === 'Applied' ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20' :
                          candidate.stage === 'Interview' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                          candidate.stage === 'Offer' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          candidate.stage === 'Shortlisted' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {candidate.stage}
                        </div>
                      </td>
                      <td className="px-6 py-4 bg-[var(--card-bg)]/50 rounded-r-2xl border-y border-r border-[var(--border-color)] text-right">
                         <div className="flex flex-col items-end">
                           <span className={`text-sm font-black ${
                            candidate.status === 'Accepted' ? 'text-emerald-500' :
                            candidate.status === 'Closed' ? 'text-red-500' :
                            'text-indigo-500'
                           }`}>
                             {candidate.status}
                           </span>
                           <span className="text-xs text-slate-400 font-bold mt-1">via {candidate.recruiter}</span>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in flex flex-col" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-sky-500/10 text-sky-500 rounded-2xl relative">
              <Activity size={24} />
              <span className="absolute top-0 right-0 w-3 h-3 bg-sky-500 border-2 border-[var(--card-bg)] rounded-full animate-ping"></span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Live Feed</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Recent HR actions</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 max-h-[500px]">
            {activityFeed.length === 0 ? (
              <div className="text-slate-400 text-sm font-bold text-center mt-10">Waiting for activity...</div>
            ) : (
              activityFeed.map((activity, i) => (
                <div key={activity.id + i} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-[var(--border-color)] flex items-center justify-center text-slate-500 z-10 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                      {activity.type.includes('Offer') ? <Award size={14} /> : 
                       activity.type.includes('Interview') ? <Calendar size={14} /> :
                       activity.type.includes('Rejected') ? <XCircle size={14} /> :
                       <Users size={14} />}
                    </div>
                    {i !== activityFeed.length - 1 && <div className="w-0.5 h-full bg-[var(--border-color)] mt-2"></div>}
                  </div>
                  <div className="pb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{activity.time} &bull; {activity.type}</p>
                    <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">{activity.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HRTracker;
