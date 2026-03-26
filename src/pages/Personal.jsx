import React, { useEffect } from 'react';
import SyncStatus from '../components/SyncStatus';
import { 
  User, 
  CreditCard, 
  Briefcase, 
  ShoppingBag, 
  Zap, 
  PlayCircle, 
  Tv, 
  Apple, 
  Plus,
  Pizza,
  ArrowUpRight,
  TrendingUp,
  Star,
  Layers,
  Globe,
  Plane,
  ShoppingCart,
  RotateCw,
  ShieldCheck,
  AlertCircle,
  Activity,
  Wallet,
  Smartphone,
  Receipt
} from 'lucide-react';
import { useEmailStore } from '../store/useEmailStore';
import PremiumSpinner from '../components/PremiumSpinner';
import EcosystemFilterBanner from '../components/common/EcosystemFilterBanner';

const PersonalCard = ({ icon: Icon, title, value, label, color, delay, trend, isLoading }) => (
  <div
    className="glass-card p-6 rounded-[2rem] flex flex-col gap-5 group hover:translate-y-[-4px] transition-all duration-500 cursor-pointer animate-fade-in relative overflow-hidden h-full"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between relative z-10">
      <div className={`p-4 rounded-2xl ${color} text-white shadow-xl shadow-opacity-20 transform group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--background)] text-slate-400 rounded-full font-bold text-[10px] uppercase tracking-widest border border-[var(--border-color)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {trend === 'Live' ? 'Live' : trend}
        </div>
      )}
    </div>

    <div className="relative z-10">
      <p className="text-[var(--text-secondary)] font-semibold text-sm uppercase tracking-wider mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        {isLoading ? (
          <div className="py-2.5"><PremiumSpinner size={32} className="text-slate-400" /></div>
        ) : (
          <>
            <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
              {value}
            </h3>
            {label && <p className="text-[11px] text-slate-400 font-medium">{label}</p>}
          </>
        )}
      </div>
    </div>

    <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 ${color}`}></div>
  </div>
);

const SubscriptionItem = ({ name, count, total, idx }) => {
  const serviceIcons = {
    'netflix': <PlayCircle size={20} />,
    'amazon': <span className="font-black text-sm">A</span>,
    'spotify': <span className="font-black text-sm">S</span>,
    'hotstar': <Tv size={20} />,
    'disney': <div className="font-black text-[10px]">D+</div>,
    'youtube': <div className="font-black text-[10px]">YT</div>,
    'google': <div className="font-black text-[10px]">G</div>,
    'apple': <Apple size={20} />,
    'adobe': <div className="font-black text-[10px]">Ai</div>,
    'microsoft': <div className="font-black text-[10px]">M</div>
  };

  const colors = [
    { bg: 'bg-red-100', text: 'text-red-600', accent: 'bg-red-500' },
    { bg: 'bg-blue-100', text: 'text-blue-600', accent: 'bg-blue-500' },
    { bg: 'bg-green-100', text: 'text-green-600', accent: 'bg-green-500' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600', accent: 'bg-indigo-500' }
  ];

  const theme = colors[idx % colors.length];
  const icon = serviceIcons[name.toLowerCase()] || <div className="font-black text-sm">{name[0]}</div>;

  return (
    <div className="p-5 bg-[var(--background)] rounded-3xl border border-[var(--border-color)] group hover:bg-[var(--card-bg)] hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.1)] transition-all duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 ${theme.bg} ${theme.text} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm shadow-opacity-10`}>
          {icon}
        </div>
        <span className="text-lg font-black text-[var(--text-primary)]">{count}</span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{name}</p>
      <div className="h-1 bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border-color)]">
        <div 
          className={`h-full ${theme.accent} rounded-full transition-all duration-1000`}
          style={{ width: `${(count / (total || 1)) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

const SpendAudit = ({ transactions, color }) => (
  <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
      {transactions.length > 0 ? (
        transactions
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-[var(--background)]/50 rounded-2xl hover:bg-[var(--card-bg)] hover:shadow-md transition-all border border-transparent hover:border-[var(--border-color)] group">
              <div className="flex flex-col gap-1 min-w-0 flex-1 mr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-[var(--text-primary)]">{tx.platform}</span>
                  {tx.tripId && (
                    <span className="text-[8px] font-black text-sky-600 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 uppercase tracking-tighter">
                      ID: {tx.tripId}
                    </span>
                  )}
                  <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5 bg-[var(--background)] rounded-md border border-[var(--border-color)]">
                    {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] truncate font-medium group-hover:text-[var(--text-primary)]">{tx.subject}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-[var(--text-primary)] tracking-tight">₹{tx.amount.toLocaleString()}</span>
              </div>
            </div>
          ))
      ) : null}
    </div>
  </div>
);

const PersonalPage = () => {
  const { getStats, user, fetchEmails, error, isLoading, emailsByPage, globalDateFilter, setActivePageId } = useEmailStore();
  
  const emails = emailsByPage['personal'] || [];
  
  useEffect(() => {
    setActivePageId('personal');
  }, [setActivePageId]);
  const isLiveFilter = useEmailStore((s) => s.isLiveFilterActive());
  // No filter loading needed
  const lastFetchRef = React.useRef(null);

  const activePageId = useEmailStore(s => s.activePageId);
  const currentPageFilter = useEmailStore(s => s.pageFilters['personal']);

  useEffect(() => {
    if (activePageId !== 'personal') return;
    
    const filterKey = JSON.stringify(currentPageFilter);
    if (lastFetchRef.current === filterKey) return;
    lastFetchRef.current = filterKey;

    fetchEmails('personal');
  }, [currentPageFilter, fetchEmails, activePageId]);

  useEffect(() => {
    if (!isLiveFilter) return;
    
    const interval = setInterval(() => {
      if (!isLoading) fetchEmails();
    }, 120000);
    return () => clearInterval(interval);
  }, [fetchEmails, isLoading, isLiveFilter]);
  const stats = getStats();
  const isInitialLoading = isLoading && emails.length === 0 && (emailsByPage['personal'] || []).length === 0;
  const { purchases, foodOrders, foodSpend, foodPlatformSpend, foodTransactions, travelSpend, travelBreakdown, travelPlatformSpend, travelTransactions, purchaseSpend, purchasePlatformSpend, purchaseTransactions, subscriptionSpend, subscriptionPlatformSpend, subscriptionTransactions, mobileRechargeSpend, mobileRechargePlatformSpend, mobileRechargeTransactions, billingSpend, billingPlatformSpend, billingTransactions, paymentAppSpend, subscriptions, subscriptionInsights } = stats;

  const maxUsagePlatform = paymentAppSpend ? Object.entries({
    'PhonePe': paymentAppSpend.phonePeTotal || 0,
    'Google Pay': paymentAppSpend.gpayTotal || 0,
    'Paytm': paymentAppSpend.paytmTotal || 0
  }).reduce((max, obj) => obj[1] > max[1] ? obj : max, ['None', 0]) : ['None', 0];

  const totalPaymentAppUsage = paymentAppSpend ? 
    (paymentAppSpend.phonePeTotal || 0) + 
    (paymentAppSpend.gpayTotal || 0) + 
    (paymentAppSpend.paytmTotal || 0) : 0;

  return (
    <div id="personal-dashboard-root" className="space-y-10 max-w-7xl mx-auto pb-10 px-4 mt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in relative z-30">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-3">
            Personal <span className="gradient-text">Insights</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] font-medium tracking-tight">Deep-scan analysis of your {user?.displayName || 'digital'} footprint.</p>
          <div className="mt-4"><SyncStatus /></div>
        </div>
        <div className="flex flex-col items-stretch ml-auto">
          <EcosystemFilterBanner pageId="personal" />
          <div className="flex items-stretch justify-between gap-3 -mt-2">
            <button 
              onClick={() => fetchEmails()}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--card-bg)] text-[var(--text-primary)] rounded-2xl border border-[var(--border-color)] font-black text-xs uppercase tracking-widest shadow-sm hover:bg-[var(--background)] transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCw size={16} className={`${isLoading ? 'animate-spin' : ''} text-primary-500`} />
              Refresh
            </button>
            <div className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--card-bg)] text-[var(--text-primary)] rounded-2xl border border-[var(--border-color)] font-black text-xs uppercase tracking-widest shadow-sm">
              <ShieldCheck size={16} className="text-emerald-500" />
              System: Secure
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="animate-shake p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4 text-rose-600">
          <div className="p-3 bg-white rounded-2xl shadow-sm">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="font-black uppercase tracking-widest text-[10px] mb-1">System Error</p>
            <p className="font-bold">{error}</p>
          </div>
        </div>
      )}

      {/* High Level Personal Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        <PersonalCard 
          icon={Wallet} 
          title="Overall expenses" 
          value={`₹${((foodSpend || 0) + (travelSpend || 0) + (purchaseSpend || 0) + (subscriptionSpend || 0) + (mobileRechargeSpend || 0) + (billingSpend || 0)).toLocaleString()}`} 
          label="" 
          color="bg-indigo-500" 
          delay={100}
          trend="Live"
          isLoading={isInitialLoading}
        />
        <PersonalCard 
          icon={Pizza} 
          title="Total Food Spend" 
          value={`₹${(foodSpend || 0).toLocaleString()}`} 
          label="" 
          color="bg-orange-500" 
          delay={150}
          trend="Live"
          isLoading={isInitialLoading}
        />
        <PersonalCard 
          icon={Plane} 
          title="Total Travel Spend" 
          value={`₹${(travelSpend || 0).toLocaleString()}`} 
          label="" 
          color="bg-sky-500" 
          delay={200}
          trend="Live"
          isLoading={isInitialLoading}
        />
        <PersonalCard 
          icon={ShoppingCart} 
          title="Online Purchases Spend" 
          value={`₹${(purchaseSpend || 0).toLocaleString()}`} 
          label="" 
          color="bg-violet-500" 
          delay={225}
          trend="Live"
          isLoading={isInitialLoading}
        />
        <PersonalCard 
          icon={Zap} 
          title="Subscription Spend" 
          value={`₹${(subscriptionSpend || 0).toLocaleString()}`} 
          label="" 
          color="bg-teal-500" 
          delay={250}
          trend="Live"
          isLoading={isInitialLoading}
        />
        <PersonalCard 
          icon={Smartphone} 
          title="Mobile Recharge" 
          value={`₹${(mobileRechargeSpend || 0).toLocaleString()}`} 
          label="" 
          color="bg-fuchsia-500" 
          delay={250}
          trend="Live"
          isLoading={isInitialLoading}
        />
        <PersonalCard 
          icon={Receipt} 
          title="Utility & Bills" 
          value={`₹${(billingSpend || 0).toLocaleString()}`} 
          label="" 
          color="bg-amber-500" 
          delay={250}
          trend="Live"
          isLoading={isInitialLoading}
        />
        <PersonalCard 
          icon={TrendingUp} 
          title="Maximum Usage" 
          value={`₹${maxUsagePlatform[1].toLocaleString()}`} 
          label={maxUsagePlatform[0]} 
          color="bg-emerald-500" 
          delay={250}
          trend="Live"
          isLoading={isInitialLoading}
        />
        <PersonalCard 
          icon={CreditCard} 
          title="Subscriptions" 
          value={subscriptionInsights.sources.length} 
          label="Active Services" 
          color="bg-rose-500" 
          delay={250}
          trend="Live"
          isLoading={isInitialLoading}
        />

      </div>

      {/* Insight Charts - Row 1: Food & Travel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Food Insight Chart */}
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in border border-[var(--border-color)]" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Pizza size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--text-primary)]">Food Insight</h3>
                <p className="text-sm text-[var(--text-secondary)] font-medium">Platform-wise spending</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--background)] text-slate-400 rounded-full font-bold text-[10px] uppercase tracking-widest border border-[var(--border-color)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {isLiveFilter ? 'Live' : 'Cached'}
            </div>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(foodPlatformSpend || {})
              .sort(([,a], [,b]) => b - a)
              .map(([platform, amount], index) => {
                const maxAmount = Math.max(...Object.values(foodPlatformSpend || { _: 1 }));
                const barWidth = (amount / maxAmount) * 100;
                const barColors = [
                  'from-orange-500 to-orange-400', 'from-pink-500 to-pink-400',
                  'from-violet-500 to-violet-400', 'from-sky-500 to-sky-400',
                  'from-emerald-500 to-emerald-400', 'from-amber-500 to-amber-400',
                  'from-rose-500 to-rose-400', 'from-teal-500 to-teal-400',
                ];
                return (
                  <div key={platform} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-[var(--text-secondary)]">{platform}</span>
                      <span className="text-sm font-black text-[var(--text-primary)]">₹{amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-[var(--background)] rounded-full h-3 overflow-hidden border border-[var(--border-color)]">
                      <div className={`h-full bg-gradient-to-r ${barColors[index % barColors.length]} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${barWidth}%` }}></div>
                    </div>
                  </div>
                );
              })
            }
            {isInitialLoading ? (
              <div className="py-12 flex justify-center"><PremiumSpinner size={40} className="text-slate-400" /></div>
            ) : Object.keys(foodPlatformSpend || {}).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No food spend detected yet</p>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
            <span className="text-lg font-black text-[var(--text-primary)]">₹{(foodSpend || 0).toLocaleString()}</span>
          </div>

          <SpendAudit 
            transactions={foodTransactions || []} 
            color="text-orange-500" 
          />
        </div>

        {/* Travel Insight Chart */}
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in border border-[var(--border-color)]" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Plane size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--text-primary)]">Travel Insight</h3>
                <p className="text-sm text-[var(--text-secondary)] font-medium">Platform-wise spending</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--background)] text-slate-400 rounded-full font-bold text-[10px] uppercase tracking-widest border border-[var(--border-color)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {isLiveFilter ? 'Live' : 'Cached'}
            </div>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(travelPlatformSpend || {})
              .sort(([,a], [,b]) => b - a)
              .map(([platform, amount], index) => {
                const maxAmount = Math.max(...Object.values(travelPlatformSpend || { _: 1 }));
                const barWidth = (amount / maxAmount) * 100;
                const barColors = [
                  'from-sky-500 to-sky-400', 'from-indigo-500 to-indigo-400',
                  'from-blue-500 to-blue-400', 'from-cyan-500 to-cyan-400',
                  'from-violet-500 to-violet-400', 'from-teal-500 to-teal-400',
                  'from-emerald-500 to-emerald-400', 'from-amber-500 to-amber-400',
                ];
                return (
                  <div key={platform} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-[var(--text-secondary)]">{platform}</span>
                      <span className="text-sm font-black text-[var(--text-primary)]">₹{amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-[var(--background)] rounded-full h-3 overflow-hidden border border-[var(--border-color)]">
                      <div className={`h-full bg-gradient-to-r ${barColors[index % barColors.length]} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${barWidth}%` }}></div>
                    </div>
                  </div>
                );
              })
            }
            {isInitialLoading ? (
              <div className="py-12 flex justify-center"><PremiumSpinner size={40} className="text-slate-400" /></div>
            ) : Object.keys(travelPlatformSpend || {}).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No travel spend detected yet</p>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
            <span className="text-lg font-black text-[var(--text-primary)]">₹{(travelSpend || 0).toLocaleString()}</span>
          </div>

          <SpendAudit 
            transactions={travelTransactions || []} 
            color="text-sky-500" 
          />
        </div>
      </div>

      {/* Insight Charts - Row 2: Online Purchases */}
      <div className="grid grid-cols-1 gap-8">
        {/* Online Purchases Insight Chart */}
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in border border-[var(--border-color)]" style={{ animationDelay: '450ms' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <ShoppingCart size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--text-primary)]">Purchase Insight</h3>
                <p className="text-sm text-[var(--text-secondary)] font-medium">Platform-wise spending</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--background)] text-slate-400 rounded-full font-bold text-[10px] uppercase tracking-widest border border-[var(--border-color)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {isLiveFilter ? 'Live' : 'Cached'}
            </div>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(purchasePlatformSpend || {})
              .sort(([,a], [,b]) => b - a)
              .map(([platform, amount], index) => {
                const maxAmount = Math.max(...Object.values(purchasePlatformSpend || { _: 1 }));
                const barWidth = (amount / maxAmount) * 100;
                const barColors = [
                  'from-violet-500 to-violet-400', 'from-fuchsia-500 to-fuchsia-400',
                  'from-purple-500 to-purple-400', 'from-pink-500 to-pink-400',
                  'from-rose-500 to-rose-400', 'from-indigo-500 to-indigo-400',
                  'from-blue-500 to-blue-400', 'from-cyan-500 to-cyan-400',
                ];
                return (
                  <div key={platform} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-[var(--text-secondary)]">{platform}</span>
                      <span className="text-sm font-black text-[var(--text-primary)]">₹{amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-[var(--background)] rounded-full h-3 overflow-hidden border border-[var(--border-color)]">
                      <div className={`h-full bg-gradient-to-r ${barColors[index % barColors.length]} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${barWidth}%` }}></div>
                    </div>
                  </div>
                );
              })
            }
            {isInitialLoading ? (
              <div className="py-12 flex justify-center"><PremiumSpinner size={40} className="text-slate-400" /></div>
            ) : Object.keys(purchasePlatformSpend || {}).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No purchase spend detected yet</p>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
            <span className="text-lg font-black text-[var(--text-primary)]">₹{(purchaseSpend || 0).toLocaleString()}</span>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 mb-10">
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 animate-fade-in border border-[var(--border-color)]" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl">
                <Layers size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Subscription Insight</h2>
                <p className="text-sm text-[var(--text-secondary)] font-medium">Digital services & lifestyle</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--background)] text-slate-400 rounded-full font-bold text-[10px] uppercase tracking-widest border border-[var(--border-color)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live
            </div>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(subscriptionPlatformSpend || {})
              .sort(([,a], [,b]) => b - a)
              .map(([platform, amount], index) => {
                const maxAmount = Math.max(...Object.values(subscriptionPlatformSpend || { _: 1 }));
                const barWidth = (amount / maxAmount) * 100;
                const barColors = [
                  'from-rose-500 to-rose-400', 'from-pink-500 to-pink-400',
                  'from-orange-500 to-orange-400', 'from-red-500 to-red-400',
                  'from-amber-500 to-amber-400', 'from-emerald-500 to-emerald-400'
                ];
                return (
                  <div key={platform} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-[var(--text-secondary)]">{platform}</span>
                      <span className="text-sm font-black text-[var(--text-primary)]">₹{amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-[var(--background)] rounded-full h-3 overflow-hidden border border-[var(--border-color)]">
                      <div className={`h-full bg-gradient-to-r ${barColors[index % barColors.length]} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${barWidth}%` }}></div>
                    </div>
                  </div>
                );
              })
            }
            {isInitialLoading ? (
              <div className="py-12 flex justify-center"><PremiumSpinner size={40} className="text-slate-400" /></div>
            ) : Object.keys(subscriptionPlatformSpend || {}).length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                <p className="text-slate-400 font-bold">No active subscriptions detected</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL</span>
            <span className="text-lg font-black text-[var(--text-primary)]">₹{(subscriptionSpend || 0).toLocaleString()}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PersonalPage;
