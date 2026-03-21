import React, { useEffect, useState } from 'react';
import { Mail, Zap, Brain, Shield, Bell, Database, Play, Square } from 'lucide-react';

// ─── Node & connection data ────────────────────────────────────────────────────
const ALL_NODES = [
  { id: 'start',            type: 'circle',    x: 80,   y: 175, icon: Play },
  { id: 'fetch',            type: 'rectangle', x: 280,  y: 175, icon: Mail,     label: 'Fetch Recent Threads',  color: '#0891b2' },
  { id: 'threads_exist',    type: 'diamond',   x: 500,  y: 175, label: 'Threads Found?',    color: '#ea580c' },
  { id: 'neural_engine',    type: 'rectangle', x: 750,  y: 175, icon: Zap,      label: 'Neural Engine Logic',   color: '#0891b2' },
  { id: 'classify',         type: 'diamond',   x: 1000, y: 175, label: 'Category Detected?',color: '#ea580c' },
  { id: 'no_mail',          type: 'rectangle', x: 500,  y: 55,  icon: Mail,     label: 'No Recent Emails',      color: '#0891b2' },
  { id: 'stop_1',           type: 'circle',    x: 680,  y: 55,  icon: Square },
  { id: 'food_insight',     type: 'rectangle', x: 1000, y: 55,  icon: Brain,    label: 'Process Food Insights', color: '#0891b2' },
  { id: 'food_confirm',     type: 'diamond',   x: 1180, y: 55,  label: 'Amount Valid?',     color: '#ea580c' },
  { id: 'update_dashboard', type: 'rectangle', x: 1360, y: 55,  icon: Database, label: 'Dashboard Update',      color: '#0891b2' },
  { id: 'sub_insight',      type: 'rectangle', x: 1000, y: 295, icon: Bell,     label: 'Identify Subscriptions',color: '#0891b2' },
  { id: 'payment_confirm',  type: 'rectangle', x: 1180, y: 295, icon: Shield,   label: 'Payment Confirmation',  color: '#0891b2' },
  { id: 'notify_user',      type: 'rectangle', x: 1360, y: 295, icon: Mail,     label: 'Send Alert Note',       color: '#0891b2' },
  { id: 'stop_2',           type: 'circle',    x: 1480, y: 295, icon: Square },
];

const ALL_CONNECTIONS = [
  { id: 'c1', from: 'start',         to: 'fetch' },
  { id: 'c2', from: 'fetch',         to: 'threads_exist' },
  { id: 'c3', from: 'threads_exist', to: 'no_mail',          label: 'No' },
  { id: 'c4', from: 'no_mail',       to: 'stop_1' },
  { id: 'c5', from: 'threads_exist', to: 'neural_engine',    label: 'Yes' },
  { id: 'c6', from: 'neural_engine', to: 'classify' },
  { id: 'c7', from: 'classify',      to: 'food_insight',     label: 'Food' },
  { id: 'c8', from: 'food_insight',  to: 'food_confirm' },
  { id: 'c9', from: 'food_confirm',  to: 'update_dashboard', label: 'Yes' },
  { id: 'c10',from: 'classify',      to: 'sub_insight',      label: 'Subscription' },
  { id: 'c11',from: 'sub_insight',   to: 'payment_confirm' },
  { id: 'c12',from: 'payment_confirm',to:'notify_user' },
  { id: 'c13',from: 'notify_user',   to: 'stop_2' },
];

// ─── Animation steps ───────────────────────────────────────────────────────────
const STEPS = [
  { activeNodes: ['start'],                                                                                              activeConns: [] },
  { activeNodes: ['start','fetch'],                                                                                      activeConns: ['c1'] },
  { activeNodes: ['start','fetch','threads_exist'],                                                                      activeConns: ['c1','c2'] },
  { activeNodes: ['start','fetch','threads_exist','no_mail'],                                                            activeConns: ['c1','c2','c3'] },
  { activeNodes: ['start','fetch','threads_exist','no_mail','stop_1'],                                                   activeConns: ['c1','c2','c3','c4'] },
  { activeNodes: ['start','fetch','threads_exist','no_mail','stop_1','neural_engine'],                                   activeConns: ['c1','c2','c3','c4','c5'] },
  { activeNodes: ['start','fetch','threads_exist','no_mail','stop_1','neural_engine','classify'],                        activeConns: ['c1','c2','c3','c4','c5','c6'] },
  { activeNodes: ['start','fetch','threads_exist','no_mail','stop_1','neural_engine','classify','food_insight','sub_insight'], activeConns: ['c1','c2','c3','c4','c5','c6','c7','c10'] },
  { activeNodes: ['start','fetch','threads_exist','no_mail','stop_1','neural_engine','classify','food_insight','sub_insight','food_confirm','payment_confirm'], activeConns: ['c1','c2','c3','c4','c5','c6','c7','c8','c10','c11'] },
  { activeNodes: ['start','fetch','threads_exist','no_mail','stop_1','neural_engine','classify','food_insight','sub_insight','food_confirm','payment_confirm','update_dashboard','notify_user'], activeConns: ['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12'] },
  { activeNodes: ['start','fetch','threads_exist','no_mail','stop_1','neural_engine','classify','food_insight','sub_insight','food_confirm','payment_confirm','update_dashboard','notify_user','stop_2'], activeConns: ['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12','c13'] },
];

const LIT = '#f59e0b';
const DIM = '#cbd5e1';

// ─── Path builder (same orthogonal logic as before) ──────────────────────────
function buildPath(from, to) {
  const sx = from.x, sy = from.y, ex = to.x, ey = to.y;
  if (Math.abs(sy - ey) < 10) {
    const so = from.type === 'rectangle' ? 88 : from.type === 'diamond' ? 40 : 20;
    const eo = to.type === 'rectangle' ? 88 : to.type === 'diamond' ? 40 : 20;
    return `M ${sx + so} ${sy} H ${ex - eo}`;
  }
  const midX = sx + (ex - sx) / 2;
  return `M ${sx} ${sy} H ${midX} V ${ey} H ${ex}`;
}

// ─── Main Component ────────────────────────────────────────────────────────────
const LogicFlow = ({ isPlaying, onPlayEnd }) => {
  const [stepIndex, setStepIndex] = useState(-1);
  const [activeNodes, setActiveNodes] = useState([]);
  const [activeConns, setActiveConns] = useState([]);

  // Start / Stop
  useEffect(() => {
    if (isPlaying) {
      setStepIndex(0);
    } else {
      setStepIndex(-1);
      setActiveNodes([]);
      setActiveConns([]);
    }
  }, [isPlaying]);

  // Step through
  useEffect(() => {
    if (stepIndex < 0 || stepIndex >= STEPS.length) return;
    const step = STEPS[stepIndex];
    setActiveNodes(step.activeNodes);
    setActiveConns(step.activeConns);

    if (stepIndex < STEPS.length - 1) {
      const t = setTimeout(() => setStepIndex(i => i + 1), 700);
      return () => clearTimeout(t);
    } else {
      if (onPlayEnd) setTimeout(onPlayEnd, 500);
    }
  }, [stepIndex]);

  return (
    <div className="relative w-full h-[350px] bg-[#f8fafc] overflow-hidden p-0 select-none">
      {/* Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />

      {/* Connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        {ALL_CONNECTIONS.map(conn => {
          const from = ALL_NODES.find(n => n.id === conn.from);
          const to   = ALL_NODES.find(n => n.id === conn.to);
          if (!from || !to) return null;
          const lit = activeConns.includes(conn.id);
          const pathData = buildPath(from, to);
          return (
            <g key={conn.id}>
              <path
                d={pathData}
                stroke={lit ? LIT : DIM}
                strokeWidth={lit ? 2.5 : 1.5}
                fill="none"
                style={{ transition: 'stroke 0.4s ease, stroke-width 0.4s ease' }}
              />
              {conn.label && (
                <text
                  x={from.x + 35}
                  y={from.y + (from.y > to.y ? -25 : 25)}
                  className="fill-slate-400 text-[7px] font-black uppercase tracking-widest"
                  fontSize={7}
                >
                  {conn.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {ALL_NODES.map(node => {
        const lit = activeNodes.includes(node.id);
        return (
          <div key={node.id} style={{ position: 'absolute', left: node.x, top: node.y, transform: 'translate(-50%, -50%)', zIndex: 10 }}>

            {node.type === 'circle' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 transition-all duration-500"
                style={{ backgroundColor: lit ? '#22c55e' : '#1e293b', borderColor: lit ? '#16a34a' : '#334155' }}>
                <node.icon size={12} />
              </div>
            )}

            {node.type === 'diamond' && (
              <div className="relative w-16 h-16 flex items-center justify-center transition-all duration-500"
                style={{ filter: lit ? 'drop-shadow(0 0 6px #f97316)' : 'none' }}>
                <div className="absolute inset-0 rotate-45 rounded-sm border-2 border-white shadow-lg transition-all duration-500"
                  style={{ background: lit ? 'linear-gradient(135deg, #f97316 55%, #fff7ed 55%)' : 'linear-gradient(135deg, #cbd5e1 55%, #f8fafc 55%)' }} />
                <span className="relative z-10 text-[7px] font-black text-center text-slate-800 uppercase tracking-tight leading-tight max-w-[50px]">
                  {node.label}
                </span>
              </div>
            )}

            {node.type === 'rectangle' && (
              <div className="w-40 bg-white rounded-lg border-2 overflow-hidden flex flex-col transition-all duration-500"
                style={{
                  borderColor: lit ? node.color : '#e2e8f0',
                  boxShadow: lit ? `0 0 0 3px ${node.color}22, 0 8px 25px -5px rgba(0,0,0,0.1)` : '0 8px 25px -5px rgba(0,0,0,0.1)'
                }}>
                <div className="h-1 w-full transition-all duration-500" style={{ backgroundColor: lit ? node.color : '#e2e8f0' }} />
                <div className="flex-1 p-2 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg transition-all duration-500"
                    style={{ backgroundColor: lit ? `${node.color}18` : '#f1f5f9', color: lit ? node.color : '#94a3b8' }}>
                    <node.icon size={14} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-800 leading-none uppercase tracking-tighter">{node.label}</span>
                    <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">Automated Sector</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LogicFlow;
