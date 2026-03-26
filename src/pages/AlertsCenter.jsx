import React, { useEffect, useMemo, useRef } from 'react';
import SyncStatus from '../components/SyncStatus';
import { 
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldAlert,
  BarChart3,
  Activity,
  RotateCw,
  Search,
  CheckCircle2,
  FileText,
  ShieldCheck,
  XCircle,
  Info
} from 'lucide-react';
import { useEmailStore } from '../store/useEmailStore';
import PremiumSpinner from '../components/PremiumSpinner';
import EcosystemFilterBanner from '../components/common/EcosystemFilterBanner';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, delay, isLoading }) => (
  <div 
    className="glass-card p-6 rounded-[2rem] flex flex-col gap-5 group hover:translate-y-[-4px] transition-all duration-500 cursor-pointer animate-fade-in relative overflow-hidden"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between relative z-10">
      <div className={`p-4 rounded-2xl ${color} text-white shadow-xl shadow-opacity-20 transform group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="relative z-10" style={{ height: '60px' }}>
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

const AlertsCenter = () => {
  const { isLoading, fetchEmails, securityAlertsByPage, getFilteredAlertStats, setActivePageId, pageFilters } = useEmailStore();
  
  const emails = securityAlertsByPage['alerts-center'] || [];
  
  useEffect(() => {
    setActivePageId('alerts-center');
  }, [setActivePageId]);

  const activePageId = useEmailStore(s => s.activePageId);
  const currentPageFilter = pageFilters['alerts-center'];
  const lastFetchRef = useRef(null);

  // Trigger fetch when local filter changes
  useEffect(() => {
    if (activePageId !== 'alerts-center') return;
    
    const filterKey = JSON.stringify(currentPageFilter);
    if (lastFetchRef.current === filterKey) return;
    lastFetchRef.current = filterKey;

    fetchEmails('alerts-center');
  }, [currentPageFilter, fetchEmails, activePageId]);

  const alertStats = getFilteredAlertStats('alerts-center');
  const isLiveFilter = useEmailStore((s) => s.isLiveFilterActive());

  useEffect(() => {
    if (!isLiveFilter) return;
    
    const interval = setInterval(() => {
      if (!isLoading) fetchEmails('alerts-center');
    }, 120000);
    return () => clearInterval(interval);
  }, [fetchEmails, isLoading, isLiveFilter]);

  const { 
    total,
    critical,
    warning,
    resolved,
    pending,
    tableData,
    chartData,
    activityFeed
  } = alertStats;

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#ec4899'];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-10 mt-6 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in relative z-30">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-3">
            Alerts <span className="gradient-text">Center</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] font-medium tracking-tight">Real-time system security and event monitor.</p>
          <div className="mt-4"><SyncStatus /></div>
        </div>
        <div className="flex flex-col items-stretch ml-auto">
          <EcosystemFilterBanner pageId="alerts-center" />
          <div className="flex items-stretch justify-between gap-3 -mt-2">
            <button 
              onClick={() => fetchEmails('alerts-center')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--card-bg)] text-[var(--text-primary)] rounded-2xl border border-[var(--border-color)] font-black text-xs uppercase tracking-widest shadow-sm hover:bg-[var(--background)] transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCw size={16} className={`${isLoading ? 'animate-spin' : ''} text-primary-500`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--card-bg)] text-[var(--text-primary)] rounded-2xl border border-[var(--border-color)] font-black text-xs uppercase tracking-widest shadow-sm">
              <ShieldCheck size={16} className="text-emerald-500" />
              System: Active
            </div>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <StatCard title="Total Alerts" value={total} icon={Bell} color="bg-indigo-500" delay={200} isLoading={isLoading && emails.length === 0} />
        <StatCard title="Critical" value={critical} icon={ShieldAlert} color="bg-red-500" delay={300} isLoading={isLoading && emails.length === 0} />
        <StatCard title="Warning" value={warning} icon={AlertTriangle} color="bg-amber-500" delay={400} isLoading={isLoading && emails.length === 0} />
        <StatCard title="Resolved" value={resolved} icon={CheckCircle} color="bg-emerald-500" delay={500} isLoading={isLoading && emails.length === 0} />
        <StatCard title="Pending" value={pending} icon={Clock} color="bg-blue-500" delay={600} isLoading={isLoading && emails.length === 0} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Alerts Trend Chart */}
        <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Alert Trends</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Daily alert frequency</p>
            </div>
          </div>
          <div className="h-80">
            {chartData.trendData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 font-bold">Awaiting alert distribution...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '1rem', color: 'var(--text-primary)' }}
                    itemStyle={{ fontWeight: 'bold', color: '#6366f1' }}
                  />
                  <Area type="monotone" dataKey="alerts" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAlerts)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Severity Distribution Donut */}
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in flex flex-col" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Severity Split</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Distribution by impact</p>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] relative flex items-center justify-center">
            {chartData.severityData.length === 0 ? (
              <div className="text-slate-400 text-sm font-bold">No severity data found</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.severityData}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.severityData.map((entry, index) => (
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
            {chartData.severityData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-30px]">
                <span className="text-xl font-black text-[var(--text-primary)]">Impact</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Level</span>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Alert Category Frequency (Bar Chart) */}
        <div className="xl:col-span-2 glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl">
              <BarChart3 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Alert Categories</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Frequency by type</p>
            </div>
          </div>
          <div className="h-64">
             {chartData.categoryData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 font-bold">No category data...</div>
             ) : (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData.categoryData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                   <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                   <Tooltip 
                     cursor={{ fill: 'transparent' }}
                     contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '1rem' }}
                     itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                   />
                   <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
                 </BarChart>
               </ResponsiveContainer>
             )}
          </div>
        </div>

        {/* Resolution Status (Pie Chart) */}
        <div className="xl:col-span-2 glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-teal-500/10 text-teal-500 rounded-2xl">
              <CheckCircle size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Resolution Efficiency</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Acknowledge vs Resolved</p>
            </div>
          </div>
          <div className="h-64">
            {chartData.resolutionData.length === 0 ? (
               <div className="flex items-center justify-center h-full text-slate-400 font-bold">No resolution stats...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.resolutionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.resolutionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Resolved' ? '#10b981' : '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '1rem' }}
                    itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Detailed Alerts Table */}
        <div className="xl:col-span-3 glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in" style={{ animationDelay: '800ms' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Detailed Log</h2>
                <p className="text-sm text-[var(--text-secondary)] font-medium">Recent security event details</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search logs..." className="pl-12 pr-4 py-3 bg-[var(--background)] border border-[var(--border-color)] rounded-2xl text-sm focus:outline-none focus:ring-0 w-full md:w-64 text-[var(--text-primary)] placeholder-slate-500 font-medium" />
            </div>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            <table className="w-full border-separate border-spacing-y-3">
              <thead className="sticky top-0 z-20 bg-[var(--background)]/80 backdrop-blur-md">
                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-6 py-4 text-left rounded-l-2xl border-y border-l border-[var(--border-color)]">Alert ID / Type</th>
                  <th className="px-6 py-4 text-left border-y border-[var(--border-color)]">Source</th>
                  <th className="px-6 py-4 text-center border-y border-[var(--border-color)]">Severity</th>
                  <th className="px-6 py-4 text-center border-y border-[var(--border-color)]">Timestamp</th>
                  <th className="px-6 py-4 text-right rounded-r-2xl border-y border-r border-[var(--border-color)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="inline-flex items-center justify-center p-6 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                         <Bell size={32} className="text-slate-400" />
                      </div>
                      <h3 className="text-lg font-black text-slate-500">No logs identified</h3>
                      <p className="text-sm text-slate-400 mt-2">Listening for incoming alerts and events...</p>
                    </td>
                  </tr>
                ) : (
                  tableData.map((alert, idx) => (
                    <tr key={alert.id + idx} className="group hover:translate-x-1 transition-all duration-300">
                      <td className="px-6 py-4 bg-[var(--card-bg)]/50 rounded-l-2xl border-y border-l border-[var(--border-color)]">
                        <div className="flex flex-col">
                          <span className="font-bold text-[var(--text-primary)] text-sm">{alert.type}</span>
                          <span className="text-xs text-slate-400 font-semibold mt-0.5">ID: {alert.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 bg-[var(--card-bg)]/50 border-y border-[var(--border-color)] font-medium text-[var(--text-secondary)] text-sm">
                        {alert.source}
                      </td>
                      <td className="px-6 py-4 bg-[var(--card-bg)]/50 border-y border-[var(--border-color)] text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          alert.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          alert.severity === 'Warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          {alert.severity === 'Critical' ? <ShieldAlert size={10} /> : <Info size={10} />}
                          {alert.severity}
                        </div>
                      </td>
                      <td className="px-6 py-4 bg-[var(--card-bg)]/50 border-y border-[var(--border-color)] text-center text-sm font-bold text-slate-500">
                        {alert.timestamp}
                      </td>
                      <td className="px-6 py-4 bg-[var(--card-bg)]/50 rounded-r-2xl border-y border-r border-[var(--border-color)] text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                          alert.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          {alert.status}
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
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in flex flex-col" style={{ animationDelay: '900ms' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-sky-500/10 text-sky-500 rounded-2xl relative">
              <Activity size={24} />
              <span className="absolute top-0 right-0 w-3 h-3 bg-sky-500 border-2 border-[var(--card-bg)] rounded-full animate-ping"></span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Alert Feed</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Real-time pulses</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 max-h-[500px]">
            {activityFeed.length === 0 ? (
              <div className="text-slate-400 text-sm font-bold text-center mt-10">Waiting for pulses...</div>
            ) : (
              activityFeed.map((activity, i) => (
                <div key={activity.id + i} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-[var(--border-color)] flex items-center justify-center text-slate-500 z-10 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                      {activity.type === 'check' ? <CheckCircle2 size={14} /> : 
                       activity.type === 'x' ? <XCircle size={14} /> :
                       <Bell size={14} />}
                    </div>
                    {i !== activityFeed.length - 1 && <div className="w-0.5 h-full bg-[var(--border-color)] mt-2"></div>}
                  </div>
                  <div className="pb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{activity.time} &bull; {activity.status}</p>
                    <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">{activity.title}</p>
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

export default AlertsCenter;
