import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Architecture from '../pages/Architecture';
import WorkflowFlow from '../components/WorkflowFlow';
import CodeFlow from '../components/CodeFlow';
import DataFlow from '../components/DataFlow';
import NetworkFlow from '../components/NetworkFlow';
import { useEmailStore } from '../store/useEmailStore';
import { X, Play, Square, Shield, Activity } from 'lucide-react';
import VerificationIntro from '../components/VerificationIntro';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWorkflowPlaying, setIsWorkflowPlaying] = useState(false);
  const [isArchPlaying, setIsArchPlaying] = useState(false);
  const [isCodeFlowPlaying, setIsCodeFlowPlaying] = useState(false);
  const [isDataFlowPlaying, setIsDataFlowPlaying] = useState(false);
  
  const { 
    isSubscriptionVerified, 
    isArchOverlayOpen, 
    isWorkflowOverlayOpen, 
    isCodeFlowOverlayOpen, 
    isDataFlowOverlayOpen, 
    isNetworkFlowOverlayOpen, 
    updateNetworkMetrics 
  } = useEmailStore();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Verification Gate - Full Screen Takeover
  if (!isSubscriptionVerified) {
    return (
      <div className="flex h-screen bg-[var(--background)] overflow-hidden text-[var(--text-primary)] transition-colors duration-500 items-center justify-center">
        <VerificationIntro />
      </div>
    );
  }

  // Main App Shell
  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden text-[var(--text-primary)] transition-colors duration-500">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in relative">
          <Outlet />
        </main>
      </div>

      {/* Global Architecture Overlay */}
      {isArchOverlayOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl" onClick={() => { useEmailStore.getState().setArchOverlayOpen(false); setIsArchPlaying(false); }}></div>
          <div className="relative w-full max-w-7xl h-[85vh] bg-[var(--card-bg)] rounded-[3rem] border border-[var(--border-color)] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
            <div className="px-8 py-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--background)]/50 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-500 rounded-2xl text-white shadow-xl shadow-primary-500/20">
                  <Shield size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase leading-none">Ecosystem Architecture</h2>
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Live</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold tracking-tight text-[var(--text-secondary)] mt-1">Multi-Node Hybrid Cloud Infrastructure</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsArchPlaying(!isArchPlaying)}
                  className={`p-3 rounded-2xl transition-all ${isArchPlaying ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-primary-500/10 text-primary-500 border-primary-500/20'} border hover:scale-105 active:scale-95`}
                >
                  {isArchPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
                <button 
                  onClick={() => { useEmailStore.getState().setArchOverlayOpen(false); setIsArchPlaying(false); }}
                  className="p-3 bg-[var(--background)] text-slate-400 hover:text-rose-500 rounded-2xl border border-[var(--border-color)] transition-all hover:rotate-90"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 relative bg-[var(--background)]/30">
              <Architecture isOverlay={true} isPlaying={isArchPlaying} />
            </div>
            <div className="px-8 py-4 bg-[var(--background)]/50 border-t border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Environment: Production</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latency: 12ms</span>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Shield size={12} className="text-slate-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security: Level 5</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Flow Overlay */}
      {isWorkflowOverlayOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl" onClick={() => { useEmailStore.getState().setWorkflowOverlayOpen(false); setIsWorkflowPlaying(false); }}></div>
          <div className="relative w-full max-w-7xl h-[85vh] bg-[var(--card-bg)] rounded-[3rem] border border-[var(--border-color)] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
             <div className="px-8 py-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--background)]/50 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                  <Activity size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase leading-none">Workflow Intelligence</h2>
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Live</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold tracking-tight text-[var(--text-secondary)] mt-1">Real-time Data Processing Pipelines</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsWorkflowPlaying(!isWorkflowPlaying)}
                  className={`p-3 rounded-2xl transition-all ${isWorkflowPlaying ? 'bg-rose-500/10 text-rose-500' : 'bg-primary-500/10 text-primary-500'} hover:scale-105 active:scale-95`}
                >
                  {isWorkflowPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
                <button onClick={() => { useEmailStore.getState().setWorkflowOverlayOpen(false); setIsWorkflowPlaying(false); }} className="p-3 bg-[var(--background)] text-slate-400 hover:text-rose-500 rounded-2xl border border-[var(--border-color)] transition-all hover:rotate-90">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 relative bg-[var(--background)]/30">
              <WorkflowFlow isOverlay={true} isPlaying={isWorkflowPlaying} />
            </div>
            <div className="px-8 py-4 bg-[var(--background)]/50 border-t border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Environment: Production</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latency: 12ms</span>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Shield size={12} className="text-slate-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security: Level 5</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Flow Overlay */}
      {isCodeFlowOverlayOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl" onClick={() => { useEmailStore.getState().setCodeFlowOverlayOpen(false); setIsCodeFlowPlaying(false); }}></div>
          <div className="relative w-full max-w-7xl h-[85vh] bg-[var(--card-bg)] rounded-[3rem] border border-[var(--border-color)] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
             <div className="px-8 py-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--background)]/50 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-600 rounded-2xl text-white shadow-xl shadow-violet-500/20">
                  <Activity size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase leading-none">Code Logic Flow</h2>
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Live</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold tracking-tight text-[var(--text-secondary)] mt-1">Algorithmic Execution Visualization</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsCodeFlowPlaying(!isCodeFlowPlaying)}
                  className={`p-3 rounded-2xl transition-all ${isCodeFlowPlaying ? 'bg-rose-500/10 text-rose-500' : 'bg-primary-500/10 text-primary-500'} hover:scale-105 active:scale-95`}
                >
                  {isCodeFlowPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
                <button onClick={() => { useEmailStore.getState().setCodeFlowOverlayOpen(false); setIsCodeFlowPlaying(false); }} className="p-3 bg-[var(--background)] text-slate-400 hover:text-rose-500 rounded-2xl border border-[var(--border-color)] transition-all hover:rotate-90">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 relative bg-[var(--background)]/30">
              <CodeFlow isOverlay={true} isPlaying={isCodeFlowPlaying} />
            </div>
            <div className="px-8 py-4 bg-[var(--background)]/50 border-t border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Environment: Production</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latency: 12ms</span>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Shield size={12} className="text-slate-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security: Level 5</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Flow Overlay */}
      {isDataFlowOverlayOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl" onClick={() => { useEmailStore.getState().setDataFlowOverlayOpen(false); setIsDataFlowPlaying(false); }}></div>
          <div className="relative w-full max-w-7xl h-[85vh] bg-[var(--card-bg)] rounded-[3rem] border border-[var(--border-color)] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
             <div className="px-8 py-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--background)]/50 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-600 rounded-2xl text-white shadow-xl shadow-cyan-500/20">
                  <Activity size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase leading-none">Data Stream Analysis</h2>
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Live</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold tracking-tight text-[var(--text-secondary)] mt-1">End-to-End Encryption Pathways</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsDataFlowPlaying(!isDataFlowPlaying)}
                  className={`p-3 rounded-2xl transition-all ${isDataFlowPlaying ? 'bg-rose-500/10 text-rose-500' : 'bg-primary-500/10 text-primary-500'} hover:scale-105 active:scale-95`}
                >
                  {isDataFlowPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
                <button onClick={() => { useEmailStore.getState().setDataFlowOverlayOpen(false); setIsDataFlowPlaying(false); }} className="p-3 bg-[var(--background)] text-slate-400 hover:text-rose-500 rounded-2xl border border-[var(--border-color)] transition-all hover:rotate-90">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 relative bg-[var(--background)]/30">
              <DataFlow isOverlay={true} isPlaying={isDataFlowPlaying} />
            </div>
            <div className="px-8 py-4 bg-[var(--background)]/50 border-t border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Environment: Production</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latency: 12ms</span>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Shield size={12} className="text-slate-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security: Level 5</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network Flow Overlay */}
      {isNetworkFlowOverlayOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl" onClick={() => { useEmailStore.getState().setNetworkFlowOverlayOpen(false); }}></div>
          <div className="relative w-full max-w-7xl h-[85vh] bg-[var(--card-bg)] rounded-[3rem] border border-[var(--border-color)] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
            <div className="px-8 py-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--background)]/50 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-500/20">
                  <Activity size={24} />
                </div>
                <div>
                   <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase leading-none">Network Propagation</h2>
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Live</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold tracking-tight text-[var(--text-secondary)] mt-1">Live Global Node Latency Monitor</p>
                </div>
              </div>
              <button 
                onClick={() => { useEmailStore.getState().setNetworkFlowOverlayOpen(false); }}
                className="p-3 bg-[var(--background)] text-slate-400 hover:text-rose-500 rounded-2xl border border-[var(--border-color)] transition-all hover:rotate-90"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 relative bg-[var(--background)]/30">
              <NetworkFlow isOverlay={true} onUpdateMetrics={updateNetworkMetrics} />
            </div>
            <div className="px-8 py-4 bg-[var(--background)]/50 border-t border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Environment: Production</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latency: 12ms</span>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Shield size={12} className="text-slate-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security: Level 5</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
