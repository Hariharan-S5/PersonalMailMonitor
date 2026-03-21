import React from 'react';
import { 
  Zap, 
  Sparkles, 
  Globe, 
  CheckCircle2, 
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
  Shield,
  Layers,
  Lock,
  Cpu,
  Headphones,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmailStore } from '../store/useEmailStore';
import { motion, AnimatePresence } from 'framer-motion';

const PLAN_CONFIG = {
  basic: { price: '₹9', originalPrice: '₹19' },
  pro: { price: '₹19', originalPrice: '₹39' },
  elite: { price: '₹29', originalPrice: '₹59' }
};

const Plans = () => {
  const navigate = useNavigate();
  const { subscriptionType, upgradeSubscription } = useEmailStore();

  const promotedTierId = subscriptionType === 'Basic' ? 'pro' : 'elite';

  const getButtonClass = (tierId, theme) => {
    const isCurrent = subscriptionType === tierId;
    const isPromoted = tierId === promotedTierId;

    if (isCurrent) {
       if (theme === 'vibrant') return 'bg-primary-500/10 text-primary-500 cursor-default border-primary-500/30 border';
       if (theme === 'luxury') return 'bg-purple-500/10 text-purple-500 cursor-default border-purple-500/30 border';
       return 'bg-[var(--background)] text-slate-400 cursor-default border-[var(--border-color)] border';
    }

    if (isPromoted) {
      if (theme === 'luxury') return 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 border-transparent';
      return 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 border-transparent';
    }

    if (theme === 'luxury') return 'bg-[var(--card-bg)] text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/50 border';
    if (theme === 'vibrant') return 'bg-[var(--card-bg)] text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/50 border';
    return 'bg-[var(--background)] text-slate-600 hover:bg-slate-50 border-[var(--border-color)] group-hover:border-primary-500/30 transition-all border';
  };

  const tiers = [
    {
      id: 'basic',
      name: 'Basic',
      tagline: 'Standard Node',
      price: PLAN_CONFIG.basic.price,
      originalPrice: PLAN_CONFIG.basic.originalPrice,
      icon: Globe,
      theme: 'silver',
      glow: 'shadow-[0_0_50px_-12px_rgba(148,163,184,0.3)]',
      border: 'border-[var(--border-color)]',
      features: ['3 Connected Accounts', 'Basic AI Monitoring', 'Standard Encryption', 'Community Support'],
      buttonText: subscriptionType === 'Basic' ? 'Current Plan' : 'Standard Node',
      buttonClass: getButtonClass('basic', 'silver'),
      isCurrent: subscriptionType === 'Basic',
      popular: 'basic' === promotedTierId,
      onClick: () => upgradeSubscription('Basic')
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'Advanced Workflow',
      price: PLAN_CONFIG.pro.price,
      originalPrice: PLAN_CONFIG.pro.originalPrice,
      icon: Zap,
      theme: 'vibrant',
      glow: 'shadow-[0_0_80px_-20px_rgba(var(--primary-rgb),0.3)]',
      border: 'border-primary-500/30 dark:border-primary-500/40',
      features: ['Unlimited Accounts', 'Advanced AI Analysis', 'AES-256 Storage', 'Priority Sync', 'Email Support'],
      buttonText: subscriptionType === 'Pro' ? 'Current Plan' : 'Select Pro',
      buttonClass: getButtonClass('pro', 'vibrant'),
      isCurrent: subscriptionType === 'Pro',
      popular: 'pro' === promotedTierId,
      onClick: () => upgradeSubscription('Pro')
    },
    {
      id: 'elite',
      name: 'Elite',
      tagline: 'Ultimate Control',
      price: PLAN_CONFIG.elite.price,
      originalPrice: PLAN_CONFIG.elite.originalPrice,
      icon: Sparkles,
      theme: 'luxury',
      glow: 'shadow-[0_0_90px_-20px_rgba(168,85,247,0.4)]',
      border: 'border-purple-500/30 dark:border-purple-500/40',
      features: ['Everything in Pro', 'Unlimited Flow Nodes', 'Hardware-Key Auth', 'Personal Account Manager', '24/7 Phone Support'],
      buttonText: subscriptionType === 'Elite' ? 'Current Plan' : 'Go Elite',
      buttonClass: getButtonClass('elite', 'luxury'),
      isCurrent: subscriptionType === 'Elite',
      popular: 'elite' === promotedTierId,
      onClick: () => upgradeSubscription('Elite')
    }
  ];

  const comparisonFeatures = [
    { name: 'Connected Account Nodes', free: '3 Units', pro: 'Unlimited', elite: 'Unlimited', icon: Layers },
    { name: 'AI Synchronization Delay', free: '15 Minutes', pro: 'Real-time', elite: 'Prioritized Instant', icon: Cpu },
    { name: 'Data Encryption Standard', free: 'AES-128', pro: 'AES-256', elite: 'AES-256 (Military)', icon: Lock },
    { name: 'Ecosystem Global Search', free: 'Limited', pro: 'Full Access', elite: 'Full Access', icon: Globe },
    { name: 'Support Communication', free: 'Community', pro: 'Priority Email', elite: '24/7 Phone & Manager', icon: Headphones },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--background)] animate-fade-in pb-20 overflow-hidden selection:bg-primary-500/30">
      {/* Cinematic Background Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-5%] left-[-5%] w-[50%] h-[40%] bg-primary-500/5 dark:bg-primary-500/[0.03] rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[40%] bg-purple-500/5 dark:bg-purple-500/[0.03] rounded-full blur-[120px]"
        />
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-6"
      >
        {/* Compact Header Section */}
        <div className="pt-12 pb-16 text-center space-y-4 relative">
          <motion.button 
            variants={itemVariants}
            onClick={() => navigate(-1)}
            whileHover={{ x: -10 }}
            className="group absolute left-0 top-12 hidden lg:flex items-center gap-2 text-slate-400 hover:text-primary-500 transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500 transition-all shadow-sm">
              <ChevronLeft size={16} />
            </div>
            Back
          </motion.button>

          <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-4 py-1.5 bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--border-color)] rounded-full shadow-lg">
            <Sparkles size={12} className="text-primary-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Subscription Ecosystem v2.0</span>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-none italic uppercase">
              Select Your <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary-500 to-indigo-600">Sync Node</span>
            </h1>
            <p className="text-base text-[var(--text-secondary)] font-medium max-w-2xl mx-auto leading-relaxed tracking-tight">
              Scale your email intelligence with high-fidelity infrastructure.
            </p>
          </motion.div>
        </div>

        {/* Rounded Tier Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch mb-20 relative">
          {tiers.map((tier, idx) => (
            <motion.div 
              key={tier.id}
              variants={itemVariants}
              whileHover={{ 
                y: -5, 
                rotateX: 1, 
                rotateY: idx === 0 ? 2 : idx === 2 ? -2 : 0, 
                transition: { type: "spring", stiffness: 400, damping: 20 }
              }}
              className={`group p-8 rounded-[3rem] border backdrop-blur-3xl flex flex-col space-y-8 transition-shadow duration-700 relative overflow-hidden bg-[var(--card-bg)]/80 ${tier.border} ${tier.glow} ${tier.popular ? 'lg:-translate-y-4 ring-4 ring-primary-500/5' : ''}`}
            >
              <div className={`absolute -top-32 -right-32 w-64 h-64 blur-[100px] opacity-10 rounded-full pointer-events-none ${tier.theme === 'vibrant' ? 'bg-primary-500' : tier.theme === 'luxury' ? 'bg-purple-500' : 'bg-slate-400'}`}></div>

              {tier.popular && (
                <div className="absolute top-8 right-8 z-20">
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${tier.theme === 'luxury' ? 'bg-purple-500' : 'bg-primary-500'}`}>
                    {subscriptionType === 'Elite' ? 'Best Value' : 'Recommended'}
                  </div>
                </div>
              )}

              <div className="space-y-6 relative z-10">
                {/* ICON NODE */}
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 shadow-lg ring-4 ring-[var(--background)] ${tier.theme === 'vibrant' ? 'bg-primary-500 text-white group-hover:rotate-6' : tier.theme === 'luxury' ? 'bg-purple-600 text-white group-hover:rotate-6' : 'bg-[var(--background)] text-slate-500 border border-[var(--border-color)]'}`}>
                  {tier.icon && <tier.icon size={28} strokeWidth={2.5} />}
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase leading-none">{tier.name}</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)]">{tier.tagline}</p>
                  </div>
                  {tier.originalPrice && (
                    <div className="flex items-center gap-2 animate-fade-in">
                       <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 shadow-sm">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Offer</span>
                          <div className="w-1.5 h-4 bg-emerald-500/30 rounded-full"></div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight leading-none">Worth</span>
                            <span className="relative text-[14px] font-black italic text-slate-400 tracking-tighter leading-none px-0.5">
                              {tier.originalPrice}
                              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-rose-500 -rotate-12 transform origin-center opacity-90"></div>
                            </span>
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-6xl font-black text-[var(--text-primary)] tracking-tighter italic leading-none">{tier.price}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ cycle</span>
                </div>
              </div>

              <div className="h-[1px] w-full bg-[var(--border-color)] opacity-40"></div>

              {/* FEATURES LIST */}
              <ul className="space-y-3 flex-1 relative z-10">
                {tier.features.map((feat, i) => (
                  <motion.li 
                    key={i} 
                    variants={itemVariants}
                    className="flex items-center gap-3 text-xs font-bold group/item cursor-default"
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-110 shadow-md ${tier.theme === 'vibrant' ? 'bg-primary-500/20 text-primary-600' : tier.theme === 'luxury' ? 'bg-purple-500/20 text-purple-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      <CheckCircle2 size={12} strokeWidth={3} />
                    </div>
                    <span className="text-[var(--text-secondary)] dark:text-slate-300 font-bold group-hover/item:text-[var(--text-primary)] transition-colors tracking-tight text-[11px] leading-tight flex-1">{feat}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={tier.onClick}
                disabled={true}
                className={`w-full py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all duration-300 relative z-10 border shadow-lg flex items-center justify-center gap-3 opacity-50 cursor-not-allowed ${tier.buttonClass}`}
              >
                {tier.buttonText}
                {!tier.isCurrent && <ArrowRight size={14} className="translate-x-0 group-hover:translate-x-1 transition-transform" />}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Rounded Comparison Section */}
        <motion.div variants={itemVariants} className="space-y-10 relative">
          <div className="text-center space-y-2">
             <div className="w-10 h-1 bg-gradient-to-r from-primary-500 to-indigo-600 mx-auto rounded-full"></div>
             <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight leading-none italic uppercase">Capability <span className="text-primary-500">Protocols</span></h2>
             <p className="text-[var(--text-secondary)] font-bold text-[9px] uppercase tracking-[0.3em] opacity-60">Full node comparison</p>
          </div>

          <div className="bg-[var(--card-bg)]/80 backdrop-blur-3xl rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-xl relative">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="p-6 text-left text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Parameter Configuration</th>
                    <th className="p-6 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Basic</th>
                    <th className="p-6 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Pro Sync</th>
                    <th className="p-6 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Elite Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/50">
                  {comparisonFeatures.map((feat, i) => (
                    <motion.tr 
                      key={i} 
                      variants={itemVariants}
                      whileHover={{ backgroundColor: "rgba(var(--primary-rgb), 0.02)" }}
                      className="group transition-colors duration-300"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-lg bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center text-slate-400 group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-all duration-500">
                            <feat.icon size={18} />
                          </div>
                          <div>
                             <span className="text-xs font-black text-[var(--text-primary)] tracking-tight block">{feat.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center text-xs font-bold text-[var(--text-secondary)]">{feat.free}</td>
                      <td className="p-6 text-center text-xs font-bold text-[var(--text-secondary)]">{feat.pro}</td>
                      <td className="p-6 text-center text-xs font-bold text-[var(--text-secondary)]">{feat.elite}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Rounded Security Footer */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="mt-20 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group border border-white/5"
        >
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
            <div className="relative shrink-0">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-dashed border-primary-500/20 rounded-full scale-125"
              />
              <div className="w-24 h-24 bg-white/5 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center border border-white/10 relative z-10">
                <ShieldCheck size={48} className="text-primary-400" />
              </div>
            </div>
            
            <div className="flex-1 space-y-4 text-center lg:text-left text-white">
              <div className="space-y-1">
                <h3 className="text-2xl font-black italic tracking-tighter leading-none uppercase">Security Node</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-2xl tracking-tight">
                  Encapsulated in quantum-resistant AES-256 containers.
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                {[
                  { label: 'Quantum Ready', icon: Zap },
                  { label: 'Tunnel Sync', icon: Globe },
                  { label: 'Privileged', icon: Lock }
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest"
                  >
                    <item.icon size={10} className="text-primary-500" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-primary-500/10 to-transparent pointer-events-none blur-[100px]"></div>
          <div className="absolute bottom-[-50%] left-[-10%] w-[60%] h-[100%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        </motion.div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-150%) rotate(45deg); }
          100% { transform: translateX(150%) rotate(45deg); }
        }
        .animate-shimmer {
          animation: shimmer 6s infinite linear;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default Plans;
