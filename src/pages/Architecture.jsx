import React, { useEffect } from 'react';
import { Workflow, RotateCcw, ExternalLink, Sparkles, Play, ChevronRight, Activity, Shield, Zap, Mail, LayoutDashboard, Radio, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ArchFlow from '../components/ArchFlow';

const Architecture = ({ isOverlay = false, isPlaying = false, onPlayEnd }) => {
  const navigate = useNavigate();

  useEffect(() => { 
    window.scrollTo(0, 0); 
  }, []);

  return (
    <div className={`relative w-full flex flex-col items-center bg-[#f8fafc] animate-fade-in overflow-hidden ${isOverlay ? 'pt-0 min-h-0 h-full flex-1' : 'min-h-screen'}`}>
      
      {/* 🏗️ CLEAN GRID HEADER (Inspired by User Image) */}
      {!isOverlay && (
        <div className="w-full max-w-7xl px-8 py-10 flex flex-col md:flex-row justify-between items-center gap-6 relative z-20">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-primary-500 rounded-3xl shadow-2xl shadow-primary-500/20 text-white transform hover:rotate-6 transition-transform">
              <Workflow size={36} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">
                System <span className="text-primary-500">Logic Flow</span>
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Infrastructure Logic Protocol v4.0</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3 pr-6 border-r border-slate-200">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-4 border-[#f8fafc] bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm">
                    0{i}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Active Nodes</span>
            </div>
            
            <button 
              onClick={() => window.location.reload()}
              className="group px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
            >
              <Activity size={16} className="group-hover:animate-pulse" />
              Live Telemetry
            </button>
          </div>
        </div>
      )}

      {/* 🗺️ MAIN ARCH FLOW CANVAS */}
      <div className="flex-1 w-full relative z-10 overflow-hidden bg-white/50 backdrop-blur-sm">
        <ArchFlow isPlaying={isPlaying} onPlayEnd={onPlayEnd} />
      </div>

      {/* 📋 FOOTER STATUS PROTOCOL */}
      {!isOverlay && (
        <div className="w-[calc(100%+2rem)] -ml-4 md:-ml-8 bg-white/80 backdrop-blur-md shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] p-5 px-10 flex flex-col md:flex-row items-center justify-between gap-4 relative z-20">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 tracking-widest drop-shadow-sm">Environment: Production</span>
            </div>
            <div className="flex items-center gap-3 bg-primary-500/10 px-3 py-1.5 rounded-full border border-primary-500/20">
              <div className="w-2 h-2 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)] animate-pulse" />
              <span className="text-[10px] font-bold text-primary-600 tracking-widest drop-shadow-sm">Latency: 12ms</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20">
              <Shield size={12} className="text-violet-500" />
              <span className="text-[10px] font-bold text-violet-600 tracking-widest drop-shadow-sm">Security: Level 5</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 italic">PMM Neural Orchestration Flow Snapshot</span>
            <div className="h-4 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <div className="w-1 h-1 bg-primary-500 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* 🎚️ CUSTOM SCROLLBAR CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  );
};

export default Architecture;
