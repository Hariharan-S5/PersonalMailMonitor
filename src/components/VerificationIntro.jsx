import React, { useState, useEffect } from 'react';
import {
  Shield, Sparkles, Key, CheckCircle2, AlertTriangle,
  ArrowRight, Mail, Crown, Zap, Diamond, Clock, Lock, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmailStore } from '../store/useEmailStore';
import PremiumSpinner from './PremiumSpinner';

const PLANS = [
  {
    id: 'Basic', label: 'Basic', tagline: 'Standard Node',
    price: '₹9', originalPrice: '₹19', period: '/cycle',
    icon: Zap,
    features: ['3 Email Accounts', 'AI Monitoring', 'Standard Encryption'],
    gradient: 'from-slate-500 to-slate-600',
    accent: 'text-slate-300',
    border: 'border-white/8 hover:border-slate-400/40',
    glow: '',
    badge: null,
  },
  {
    id: 'Pro', label: 'Pro', tagline: 'Advanced Workflow',
    price: '₹19', originalPrice: '₹39', period: '/cycle',
    icon: Sparkles,
    features: ['Unlimited Accounts', 'Advanced AI Analysis', 'AES-256 Storage', 'Priority Sync'],
    gradient: 'from-indigo-500 to-blue-600',
    accent: 'text-indigo-300',
    border: 'border-indigo-500/25 hover:border-indigo-500/60',
    glow: 'shadow-[0_0_40px_-8px_rgba(99,102,241,0.35)]',
    badge: 'Popular',
  },
  {
    id: 'Elite', label: 'Elite', tagline: 'Ultimate Control',
    price: '₹29', originalPrice: '₹59', period: '/cycle',
    icon: Diamond,
    features: ['Everything in Pro', 'Unlimited Flow Nodes', 'Hardware-Key Auth', '24/7 Support'],
    gradient: 'from-amber-400 to-orange-500',
    accent: 'text-amber-300',
    border: 'border-amber-500/25 hover:border-amber-500/60',
    glow: '',
    badge: null,
  },
];

export default function VerificationIntro() {
  const { verifySubscription, applyLuckyCoupon, userPermissions, verificationWay, fetchUserPermissions, createNewUserRecord } = useEmailStore();

  const navigate = useNavigate();

  const [coupon, setCoupon]               = useState('');
  const [couponErr, setCouponErr]         = useState('');
  const [couponOk, setCouponOk]           = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [planLoading, setPlanLoading]     = useState(null);
  const [launching, setLaunching]         = useState(false);

  useEffect(() => { fetchUserPermissions(); }, [fetchUserPermissions]);

  const isNull  = userPermissions && Object.values(userPermissions).every(v => v === null);
  const hasData = userPermissions && !isNull;

  const activatePlan = async (id) => {
    setPlanLoading(id);
    await createNewUserRecord(id);
    setPlanLoading(null);
  };

  const submitCoupon = (e) => {
    e.preventDefault();
    setCouponErr('');
    setCouponLoading(true);
    if (coupon.length !== 15) {
      setTimeout(() => { setCouponErr('Must be exactly 15 characters.'); setCouponLoading(false); }, 700);
      return;
    }
    setTimeout(async () => {
      const success = await applyLuckyCoupon(coupon);
      if (success) {
          setCouponOk(true);
      } else { 
          setCouponErr('Invalid or expired code.'); 
          setCouponLoading(false); 
      }
    }, 1200);
  };

  const formatDays = (s) => {
    if (!s) return '30d';
    const passedDays = Math.floor(s / 86400);
    const remaining = Math.max(0, 30 - passedDays);
    return `${remaining}d`;
  };

  /* ── AUTHENTICATED STATE (PICTURE 2) ─────────────────── */
  if (hasData && (verificationWay === 'plans' || !verificationWay)) return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center p-6 lg:p-4 overflow-hidden bg-[#0A0515] animate-fade-in">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="relative p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center gap-6">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Icon */}
          <div className="relative mt-2">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <CheckCircle2 size={46} className="text-emerald-400 drop-shadow-lg" />
            </div>
            <div className="absolute -inset-2 rounded-[2.3rem] border border-emerald-500/30 animate-pulse opacity-20 pointer-events-none" />
          </div>

          <div className="text-center mb-2">
            <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase drop-shadow-md">Authenticated</h2>
            <p className="text-[11px] font-bold text-emerald-400 tracking-[.25em] uppercase mt-2">Subscription Active · {userPermissions?.subscription_type}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full mb-2">
            {[
              { icon: Clock, label: 'Remaining', value: formatDays(userPermissions?.live_subscription_interval), color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
              { icon: Shield, label: 'Security', value: '256-Bit', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { icon: Star, label: 'Tier', value: userPermissions?.subscription_type?.slice(0,3) ?? 'PRO', color: 'text-white', bg: 'bg-white/5', border: 'border-white/10' },
            ].map(({ icon: I, label, value, color, bg, border }) => (
              <div key={label} className={`rounded-[1.5rem] ${bg} ${border} border p-4 flex flex-col items-center gap-1.5 shadow-inner`}>
                <I size={16} className={color} />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className={`text-base font-black ${color} italic`}>{value}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setLaunching(true); setTimeout(() => verifySubscription(), 1400); }}
            disabled={launching}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all mt-4 ${
              launching ? 'bg-indigo-900 border border-indigo-500/50 text-indigo-300' : 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.5)] hover:shadow-[0_15px_40px_-5px_rgba(99,102,241,0.6)] hover:-translate-y-1'
            } disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3`}
          >
            {launching ? <><PremiumSpinner size={16} /> Initializing Nodes...</> : <>Continue to Dashboard <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );

  /* ── PLANS / LOADING STATE ───────────────────────── */
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#0A0515] p-6 lg:p-4">
      
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="w-full max-w-[1300px] flex flex-col items-center gap-6 relative z-10 mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-3 border border-white/20">
            <Mail size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[var(--text-primary)] leading-none italic uppercase drop-shadow-md">
            Mail<span className="text-indigo-400">Monitor</span>
          </h1>
          <div className="flex items-center gap-2 mt-2 bg-white/[0.05] px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <p className="text-[10px] font-bold text-slate-300 tracking-[0.2em] uppercase">Account Verification Node Active</p>
          </div>
        </div>

        {/* 2-Column Responsive Grid Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 relative items-stretch">
          
          {/* Global Loading Overlay */}
          {!userPermissions && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)]/80 backdrop-blur-lg rounded-[2.5rem]">
              <PremiumSpinner size={48} className="text-indigo-400 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] animate-pulse">Scanning Authorization Node…</p>
            </div>
          )}

          {/* LEFT COLUMN: 3 Plan Cards (Subgrid) */}
          <div className="grid grid-cols-3 gap-4 h-full">
            {(isNull || (hasData && verificationWay === 'lucky')) && PLANS.map((plan) => {
              const Icon = plan.icon;
              const busy = planLoading === plan.id;
              const disabled = !!planLoading && !busy;
              const isPro = plan.id === 'Pro';

              return (
                <div
                  key={plan.id}
                  onClick={() => !planLoading && navigate(`/payment?plan=${plan.id}`)}
                  className={`
                    relative flex flex-col items-center text-center rounded-[2rem] border transition-all duration-500 cursor-pointer overflow-hidden p-6
                    backdrop-blur-2xl h-full
                    ${isPro ? 'bg-indigo-950/40 border-indigo-400/50 shadow-[0_0_40px_-15px_rgba(99,102,241,0.5)] transform hover:-translate-y-2' : 'bg-white/[0.03] border-white/10 shadow-xl hover:-translate-y-1 hover:bg-white/[0.05]'}
                    ${disabled ? 'opacity-40 pointer-events-none' : ''}
                    ${busy ? 'scale-[0.99] opacity-80' : ''}
                  `}
                >
                  {/* Glassmorphism accents */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div className={`absolute -bottom-24 -right-24 w-64 h-64 bg-gradient-to-br ${plan.gradient} rounded-full blur-[60px] opacity-[0.15] pointer-events-none`} />

                  {/* Popular Badge */}
                  {isPro && (
                    <div className="absolute top-0 inset-x-0 mx-auto w-max px-3 py-1 bg-gradient-to-r from-indigo-500 to-blue-500 text-[8px] font-black tracking-widest text-white rounded-b-xl uppercase shadow-lg shadow-indigo-500/30">
                      Recommended
                    </div>
                  )}

                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shrink-0 shadow-lg border border-white/10 mb-5 mt-2`}>
                    {busy ? <PremiumSpinner size={22} className="text-white" /> : <Icon size={26} className="text-white" />}
                  </div>

                  <div className="mb-4">
                    <h3 className="text-xl font-black italic uppercase tracking-tight text-white leading-none mb-1">{plan.label}</h3>
                    <p className={`text-[9px] font-bold tracking-[0.15em] uppercase ${plan.accent}`}>{plan.tagline}</p>
                  </div>

                  {/* Price Block */}
                  <div className="flex items-baseline justify-center gap-1 mb-6">
                    <span className={`text-4xl font-black italic tracking-tighter ${plan.accent}`}>{plan.price}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{plan.period}</span>
                  </div>

                  {/* Features List */}
                  <ul className="flex flex-col gap-3 w-full text-left mb-6 flex-1">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 size={12} className={`shrink-0 mt-[2px] ${isPro ? "text-indigo-400" : "text-slate-400"}`} />
                        <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action */}
                  <div className="mt-auto w-full">
                    <div className={`w-full py-4 rounded-2xl bg-gradient-to-r ${plan.gradient} flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-white shadow-xl transition-transform hover:scale-[1.03] active:scale-95 shrink-0`}>
                      {busy ? <PremiumSpinner size={14} className="text-white" /> : <>Select Plan <ArrowRight size={14} /></>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Lucky Coupon Card */}
          {((isNull || !userPermissions) || (hasData && verificationWay === 'lucky')) && (
            <div
              className={`
                relative flex flex-col rounded-[2.5rem] border transition-all duration-500 overflow-hidden p-8
                bg-purple-950/20 border-purple-500/40 shadow-[0_0_60px_-15px_rgba(168,85,247,0.3)]
                h-full
              `}
            >
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-600/30 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute inset-0 opacity-[0.05]"
                   style={{ backgroundImage: 'radial-gradient(circle, rgba(168,85,247,0.8) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
              
              <div className="relative z-10 flex flex-col h-full items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(168,85,247,0.4)] mb-5 border border-purple-400/30">
                  <Star size={26} className="text-white" />
                </div>

                <div className="mb-4">
                  <h3 className="text-2xl font-black italic uppercase tracking-tight text-white leading-none mb-1 shadow-purple-500 drop-shadow-md">Lucky Coupon</h3>
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-purple-400">Elite Bypass Protocol</p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-semibold mb-6 flex-1">
                  Have a 15-character access code? Unlock the <span className="text-purple-300 font-bold">Elite node</span> limitlessly and completely free of charge.
                </p>

                {/* Status Indicator */}
                <div className="min-h-[28px] flex items-center mb-4 shrink-0">
                  {(couponErr && !couponOk) && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                      <AlertTriangle size={12} /> {couponErr}
                    </span>
                  )}
                  {couponOk && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                      <CheckCircle2 size={12} /> ELITE NODE UNLOCKED
                    </span>
                  )}
                  {(verificationWay === 'lucky' && hasData) && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                      <CheckCircle2 size={12} /> ALREADY ACTIVATED
                    </span>
                  )}
                </div>

                {hasData && verificationWay === 'lucky' ? (
                  <button
                    onClick={() => { setLaunching(true); setTimeout(() => verifySubscription(), 1400); }}
                    disabled={launching}
                    className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 mt-auto shadow-xl ${
                        launching ? 'bg-indigo-900 text-indigo-300' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-[1.02] active:scale-95 shadow-emerald-500/30'
                    }`}
                  >
                    {launching ? <PremiumSpinner size={14} /> : <>Continue to Dashboard <ArrowRight size={14} /></>}
                  </button>
                ) : (
                  <form onSubmit={submitCoupon} className="flex flex-col gap-4 mt-auto shrink-0 relative z-10 w-full">
                    <input
                      type="password"
                      value={coupon}
                      onChange={(e) => {
                        const v = e.target.value.toUpperCase();
                        if (/^[A-Z0-9@#$&*-]*$/.test(v) && v.length <= 15) { setCoupon(v); setCouponErr(''); }
                      }}
                      disabled={couponLoading || couponOk}
                      placeholder="ENTER-15-CODE"
                      className="w-full bg-black/40 backdrop-blur-md border border-purple-500/40 rounded-2xl py-4 flex-1 text-purple-100 font-mono font-bold tracking-[0.25em] text-sm text-center focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-400/40 transition-all placeholder:text-purple-900/60 disabled:opacity-50 shadow-inner"
                    />

                    <button
                      type="submit"
                      disabled={couponLoading || coupon.length < 5 || couponOk}
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all focus:outline-none flex items-center justify-center gap-2 shadow-xl shrink-0 ${
                        couponOk
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/40'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90 hover:shadow-purple-500/40 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100'
                      }`}
                    >
                      {couponLoading ? <><PremiumSpinner size={14} className="text-white" /> Validating</>
                        : couponOk ? <><CheckCircle2 size={14} /> Activated</>
                        : <><Key size={14} /> Redeem Code</>}
                    </button>
                  </form>
                )}

                <div className="flex flex-col items-center justify-center gap-1.5 mt-6 shrink-0 opacity-80">
                  <div className="flex items-center gap-1.5">
                    <Shield size={11} className="text-purple-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Secure AES-256</span>
                  </div>
                  <div className="w-12 h-[1px] bg-purple-500/30 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
