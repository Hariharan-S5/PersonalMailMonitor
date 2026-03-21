import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Lock, ArrowRight, ShieldCheck, Mail, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useEmailStore } from '../store/useEmailStore';
import PremiumSpinner from '../components/PremiumSpinner';

const PLANS = [
  { id: 'Basic', price: '₹9', gradient: 'from-amber-400 to-orange-500' },
  { id: 'Pro', price: '₹19', gradient: 'from-indigo-500 to-blue-500' },
  { id: 'Elite', price: '₹29', gradient: 'from-purple-500 to-pink-500' }
];

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const planId = searchParams.get('plan') || 'Pro';
  
  const selectedPlan = PLANS.find(p => p.id === planId) || PLANS[1];
  
  const createNewUserRecord = useEmailStore(state => state.createNewUserRecord);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Mock form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc) return;
    
    setLoading(true);
    // Simulate payment processing delay showing premium animations
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Create actual user record in backend
    const ok = await createNewUserRecord(selectedPlan.id);
    if (ok) {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0A0515]">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="absolute left-6 top-8 md:left-12 md:top-12 z-20 flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors font-bold text-xs uppercase tracking-widest group"
      >
        <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-300 group-hover:border-indigo-500/50 transition-all shadow-lg backdrop-blur-md">
          <ChevronLeft size={16} />
        </div>
        Back
      </button>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 mx-auto">
        
        {/* Left Side: Summary & Trust */}
        <div className="flex flex-col justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-8 border border-white/20">
             <Mail size={26} className="text-white" />
          </div>
          
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight mb-2">
            Complete your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 italic">Upgrade</span>
          </h1>
          <p className="text-slate-400 font-medium tracking-wide text-sm mb-10">
            You are subscribing to the <span className="text-white font-bold">{selectedPlan.id} Node</span> layout.
          </p>

          {/* Premium Plan Summary Card */}
          <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-xl relative overflow-hidden mb-8">
            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${selectedPlan.gradient}`} />
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Selected Plan</p>
                <h3 className="text-2xl font-black italic text-white uppercase">{selectedPlan.id}</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black italic text-white">{selectedPlan.price}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest ml-1">/CYCLE</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/10 mb-6" />

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-semibold">Total Due Today</span>
              <span className="text-indigo-400 font-black text-lg">{selectedPlan.price}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <p className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">Guaranteed 256-Bit SSL Encryption</p>
          </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="relative flex flex-col justify-center">
          <div className="relative p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Glossy top edge */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2 tracking-tight">
              <CreditCard className="text-indigo-400" /> Payment Details
            </h3>

            {success ? (
               <div className="flex flex-col items-center justify-center py-12 text-center">
                 <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-pulse">
                   <CheckCircle2 size={40} className="text-emerald-400" />
                 </div>
                 <h2 className="text-2xl font-black text-white tracking-tight mb-2">Payment Successful</h2>
                 <p className="text-sm font-semibold text-slate-400">Initializing your premium nodes...</p>
               </div>
            ) : (
              <form onSubmit={handlePayment} className="flex flex-col gap-5">
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      maxLength={19}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-mono tracking-widest text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600/50"
                      disabled={loading}
                    />
                    <CreditCard size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={e => setExpiry(e.target.value)}
                      maxLength={5}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-mono tracking-widest text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600/50"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Security Code</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="CVC"
                        value={cvc}
                        onChange={e => setCvc(e.target.value)}
                        maxLength={4}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-mono tracking-widest text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600/50"
                        disabled={loading}
                      />
                      <Lock size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500" />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    disabled={true}
                    className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-indigo-900 border border-indigo-500/50 text-indigo-300 opacity-60 cursor-not-allowed flex items-center justify-center gap-3"
                  >
                     Subscribe Securely <ArrowRight size={16} />
                  </button>
                </div>
                
                <div className="text-center mt-3 flex flex-col gap-1.5">
                  <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 py-2 px-4 rounded-xl inline-block mx-auto">Payment Screen Currently Not Working</span>
                  <span className="text-[9px] text-slate-500 font-semibold tracking-wide mt-1">
                    This is a secure 256-bit encrypted transaction.
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
