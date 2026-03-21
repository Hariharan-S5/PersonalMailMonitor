import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Inbox, 
  RotateCw,
  Mail, 
  LogOut,
  X,
  Shield,
  Star,
  Zap,
  User,
  Users,
  Sparkles,
  Network,
  CreditCard,
  SendHorizontal,
  Bell,
  ShieldAlert
} from 'lucide-react';
import { useEmailStore } from '../store/useEmailStore';

import { useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { setActiveFolder, user, logout, subscriptionType } = useEmailStore();
  const navigate = useNavigate();
  
  const navItems = [
    { id: 'overview', path: '/overview', icon: Zap, label: 'Overview' },
    { id: 'personal', path: '/personal', icon: User, label: 'Personal' },
    { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Job Monitor', restricted: 'Pro' },
    { id: 'hr-tracker', path: '/hr-tracker', icon: Users, label: 'HR Monitor', restricted: 'Elite' },
    { id: 'business-analytics', path: '/business-analytics', icon: Sparkles, label: 'Business Analytics', restricted: 'Pro' },
    { id: 'alerts-center', path: '/alerts-center', icon: ShieldAlert, label: 'Alerts Center', restricted: 'Elite' },
    { id: 'inbox', path: '/inbox', icon: Inbox, label: 'Incoming' },
    { id: 'sent', path: '/sent', icon: SendHorizontal, label: 'Outgoing' },
  ];

  const handleRestrictedClick = (item) => {
    const isBasic = subscriptionType === 'Basic';
    const isPro = subscriptionType === 'Pro';
    
    if ((isBasic && item.restricted) || (isPro && item.restricted === 'Elite')) {
      alert(`Upgrade to ${item.restricted} to access ${item.label}. Check the Plans page for details!`);
      navigate('/plans');
      return true;
    }
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 sidebar-gradient text-white transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0 lg:static lg:inset-0 border-r border-white/5 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-24 px-8">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/overview')}>
            <div className="p-2.5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] transform group-hover:rotate-12 transition-transform duration-300">
              <Mail size={26} className="text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight leading-none">MailMonitor</span>
                <span className={`px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-widest ${
                  subscriptionType === 'Elite' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' :
                  subscriptionType === 'Pro' ? 'bg-primary-500/20 border-primary-500/30 text-primary-400' :
                  'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                }`}>
                  {subscriptionType}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary-400/80 mt-1">Premium Ecosystem</span>
            </div>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 pl-4">Main Menu</div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isItemRestricted = (subscriptionType === 'Basic' && item.restricted) || (subscriptionType === 'Pro' && item.restricted === 'Elite');
              
              const content = (
                <>
                  <item.icon 
                    size={20} 
                    className={`
                      ${isOpen ? 'scale-110' : ''} 
                      transition-transform duration-700 
                      ${item.id === 'sent' ? 'group-hover:rotate-[360deg]' : 'group-hover:scale-125'}
                    `} 
                  />
                  <span className="font-bold tracking-tight">{item.label}</span>
                  {isItemRestricted && (
                    <span className={`ml-auto px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                      item.restricted === 'Elite' ? 'bg-purple-500/20 text-purple-400' : 'bg-primary-500/20 text-primary-400'
                    }`}>
                      {item.restricted}
                    </span>
                  )}
                </>
              );

              if (isItemRestricted) {
                return (
                  <div
                    key={item.id}
                    onClick={() => handleRestrictedClick(item)}
                    className="flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 text-slate-500/50 cursor-not-allowed hover:bg-white/5 opacity-60 grayscale-[0.5]"
                  >
                    {content}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => {
                    setActiveFolder(item.id);
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                  className={({ isActive }) => `
                    flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group
                    ${isActive 
                      ? 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white shadow-[0_15px_30px_rgba(var(--primary-rgb),0.25)]' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  {content}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="px-6 py-4">
          <nav className="space-y-2">
            <NavLink 
              to="/plans"
              className={({ isActive }) => `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group font-bold tracking-tight ${isActive ? 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white shadow-[0_15px_30px_rgba(var(--primary-rgb),0.25)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <CreditCard size={20} className="group-hover:translate-y-[-2px] transition-transform duration-300" />
              <span>Plans</span>
            </NavLink>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
