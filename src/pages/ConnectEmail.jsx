import React, { useState } from 'react';
import { 
  Mail, 
  Shield, 
  Lock, 
  Check, 
  ChevronRight,
  Globe,
  Settings,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmailStore } from '../store/useEmailStore';

const ConnectEmail = () => {
  const [connecting, setConnecting] = useState(false);
  const navigate = useNavigate();
  const login = useEmailStore((state) => state.login);
  const user = useEmailStore((state) => state.user);

  const handleGoogleLogin = async () => {
    setConnecting(true);
    await login();
    setConnecting(false);
    if (useEmailStore.getState().user) {
      navigate('/overview');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 glass-card rounded-[3rem] overflow-hidden shadow-2xl bg-white border-none">
        
        {/* Left Side: Information */}
        <div className="p-12 lg:p-16 sidebar-gradient text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-primary-500 rounded-2xl shadow-lg shadow-primary-500/20">
                <Mail size={28} />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">MailMonitor</span>
            </div>
            
            <h1 className="text-4xl font-extrabold mb-6 leading-tight">
              Connect Your <span className="text-primary-400">Digital Life.</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed mb-10">
              Monitor all your email accounts in one beautiful, real-time dashboard. Secure, fast, and private.
            </p>
            
            <ul className="space-y-6">
              {[
                { icon: Shield, text: "End-to-end encryption" },
                { icon: Lock, text: "No data ever stored on servers" },
                { icon: Check, text: "Google Firebase Auth active" }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-slate-200 font-medium">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <item.icon size={20} className="text-primary-400" />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="text-sm text-slate-400 mt-12">
            © 2026 MailMonitor. All rights reserved.
          </div>
        </div>

        {/* Right Side: Connection Methods */}
        <div className="p-12 lg:p-16 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Welcome Back</h2>
              <p className="text-slate-500 font-medium">Please sign in to access your mailbox</p>
            </div>
            
            <div className="space-y-6">
              <button 
                onClick={handleGoogleLogin}
                disabled={connecting}
                className={`w-full p-6 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-primary-500 hover:bg-primary-50/10 transition-all flex items-center justify-between group shadow-sm hover:shadow-xl active:scale-95 disabled:opacity-50
                `}
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="block font-black text-slate-800 text-lg">Continue with Google</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Firebase Secure Auth</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-primary-500 group-hover:text-white transition-all transform group-hover:rotate-45">
                  {connecting ? (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <ArrowRight size={20} />
                  )}
                </div>
              </button>
              
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-4 text-slate-400 font-bold uppercase tracking-widest">Enterprise Access</span>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 opacity-60">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                   <Globe size={18} className="text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-500">Other methods available for enterprise clients</p>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-10 px-8 leading-relaxed font-medium">
              By connecting, you agree to our Terms of Service. Your data is protected by Google Identity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectEmail;
