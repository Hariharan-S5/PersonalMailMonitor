import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Mail, 
  Search, 
  Brain, 
  Database, 
  Activity,
  ChevronRight,
  Zap,
  Network,
  Workflow as WorkflowIcon,
  Play
} from 'lucide-react';

const NODES = [
  { 
    id: 'edge', 
    label: 'Edge Sync', 
    icon: Mail, 
    color: 'emerald', 
    desc: 'Real-time multi-protocol ingestion gateway.',
    features: ['OAuth2 Sync', 'TLS Tunneling', 'Intelligent Filtering']
  },
  { 
    id: 'engine', 
    label: 'Neural Engine', 
    icon: Zap, 
    color: 'blue', 
    desc: 'Central monitoring and state orchestration core.',
    features: ['Instant Discovery', 'Anomaly Patterns', 'State Persistence']
  },
  { 
    id: 'analytics', 
    label: 'Insight Hub', 
    icon: Brain, 
    color: 'purple', 
    desc: 'Advanced behavioral analytics and spending intelligence.',
    features: ['Spend Intelligence', 'Volume Forecast', 'Interactive Charts']
  },
  { 
    id: 'stream', 
    label: 'Data Streams', 
    icon: Network, 
    color: 'amber', 
    desc: 'Zero-latency conduits for seamless mail flow.',
    features: ['Prioritization Flow', 'Stream Buffering', 'Traffic Balancing']
  },
  { 
    id: 'security', 
    label: 'Identity Vault', 
    icon: Shield, 
    color: 'rose', 
    desc: 'Encrypted identity verification and security layers.',
    features: ['Vault Encryption', 'Identity Guard', 'Multi-factor Keys']
  },
  { 
    id: 'protocol', 
    label: 'Sync Master', 
    icon: WorkflowIcon, 
    color: 'indigo', 
    desc: 'Infrastructure management and scaling engine.',
    features: ['Auto-Scaling', 'Quantum Tiers', 'Resilience Nodes']
  }
];

const Workflow = () => {
  const [activeNode, setActiveNode] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setActiveNode((prev) => (prev + 1) % NODES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight mb-2 flex items-center gap-4">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <WorkflowIcon className="text-amber-500" size={32} />
            </div>
            System Workflow
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Sequential Data Pipeline Logic</p>
        </div>
        
        <button 
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black transition-all ${
            isAutoPlaying 
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
              : 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:scale-105'
          }`}
        >
          {isAutoPlaying ? (
            <><Activity className="animate-pulse" size={18} /> Stop Simulation</>
          ) : (
            <><Play size={18} /> Start Simulation</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Vertical Pipeline */}
        <div className="relative space-y-16 pl-12">
          {/* Main Connector Line */}
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-primary-500 to-indigo-600 rounded-full opacity-20"></div>
          
          {NODES.map((node, index) => {
            const isActive = activeNode === index;
            const Icon = node.icon;
            
            return (
              <div 
                key={node.id}
                className={`relative transition-all duration-700 ${isActive ? 'scale-105 ml-4' : 'opacity-40 grayscale pointer-events-none'}`}
              >
                {/* Node Pointer */}
                <div className={`absolute -left-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-[var(--background)] flex items-center justify-center transition-all duration-500 ${isActive ? `bg-${node.color}-500 shadow-lg shadow-${node.color}-500/40 scale-125` : 'bg-slate-700'}`}>
                  {isActive && <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>}
                </div>

                <div 
                  className={`p-6 bg-[var(--card-bg)]/40 backdrop-blur-xl border-2 rounded-[2rem] transition-all duration-500 ${
                    isActive 
                      ? `border-${node.color}-500/30 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]` 
                      : 'border-transparent'
                  }`}
                  onClick={() => setActiveNode(index)}
                >
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-2.5xl bg-${node.color}-500/10 group-hover:rotate-12 transition-all duration-500`}>
                      <Icon className={`text-${node.color}-500`} size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[var(--text-primary)] mb-1">{node.label}</h3>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed">{node.desc}</p>
                    </div>
                  </div>
                </div>

                {index < NODES.length - 1 && (
                  <div className={`absolute -bottom-10 left-6 -translate-x-1/2 flex flex-col items-center gap-1 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-1 h-2 bg-white/20 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Node Details (Insight Panel) */}
        <div className="sticky top-32">
          <div className="p-8 bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            {/* Animated Background Glow */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 bg-${NODES[activeNode].color}-500/10 blur-[100px] transition-colors duration-1000`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-${NODES[activeNode].color}-500/20 text-${NODES[activeNode].color}-400 border border-${NODES[activeNode].color}-500/20`}>
                  Protocol Phase 0{activeNode + 1}
                </span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active State</span>
              </div>

              <h2 className="text-5xl font-black text-white mb-6 tracking-tight leading-none italic uppercase">
                {NODES[activeNode].label}
              </h2>

              <p className="text-lg text-slate-300 font-medium leading-relaxed mb-10 pr-12">
                "This layer orchestrates {NODES[activeNode].desc.toLowerCase().replace('.', '')}, ensuring zero-latency data integrity across the premium ecosystem."
              </p>

              <div className="space-y-4">
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Core Telemetry Features</p>
                <div className="grid grid-cols-1 gap-3">
                  {NODES[activeNode].features.map((feature, i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/feat"
                    >
                      <div className={`p-1.5 rounded-lg bg-${NODES[activeNode].color}-500/20 text-${NODES[activeNode].color}-500`}>
                        <ChevronRight size={14} className="group-hover/feat:translate-x-1 transition-transform" />
                      </div>
                      <span className="text-sm font-bold text-slate-200">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-10 h-10 rounded-xl border-2 border-slate-900 bg-${NODES[activeNode].color}-500/40 flex items-center justify-center text-[10px] font-bold`}>
                      P{i}
                    </div>
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-500">Instance Priority: High</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workflow;
