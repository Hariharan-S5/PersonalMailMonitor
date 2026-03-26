import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ─── Custom Node: Module ───────────────────────────────────────────────────────
const ModuleNode = ({ data }) => (
  <div
    style={{ borderColor: data.active ? data.color : '#e2e8f0', boxShadow: data.active ? `0 0 0 3px ${data.color}33` : undefined }}
    className="bg-white rounded-xl border-2 shadow-lg px-3 py-2.5 min-w-[130px] max-w-[160px] transition-all duration-500"
  >
    <Handle type="target" position={Position.Left} className="!bg-slate-300 !w-2 !h-2 !border-0" />
    <Handle type="target" position={Position.Top} className="!bg-slate-300 !w-2 !h-2 !border-0" />
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm shrink-0 transition-all duration-500"
        style={{ backgroundColor: data.active ? data.color : '#cbd5e1' }}>
        {data.icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-800 uppercase tracking-tight leading-tight">{data.label}</p>
        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{data.sublabel}</p>
      </div>
    </div>
    <Handle type="source" position={Position.Right} className="!bg-slate-300 !w-2 !h-2 !border-0" />
    <Handle type="source" position={Position.Bottom} className="!bg-slate-300 !w-2 !h-2 !border-0" />
  </div>
);

// ─── Custom Node: Decision ─────────────────────────────────────────────────────
const DecisionNode = ({ data }) => (
  <div className="relative w-20 h-20 flex items-center justify-center transition-all duration-500"
    style={{ filter: data.active ? 'drop-shadow(0 0 6px #f97316)' : 'none' }}>
    <Handle type="target" position={Position.Left} className="!bg-orange-300 !w-2 !h-2 !border-0" />
    <Handle type="target" position={Position.Top} className="!bg-orange-300 !w-2 !h-2 !border-0" />
    <div
      className="absolute inset-0 rotate-45 rounded-sm border-2 border-white shadow-lg transition-all duration-500"
      style={{ background: data.active ? 'linear-gradient(135deg, #f97316 55%, #fff7ed 55%)' : 'linear-gradient(135deg, #cbd5e1 55%, #f8fafc 55%)' }}
    />
    <span className="relative z-10 text-[7px] font-black text-center text-slate-800 uppercase tracking-tight leading-tight max-w-[55px]">
      {data.label}
    </span>
    <Handle type="source" position={Position.Right} className="!bg-orange-300 !w-2 !h-2 !border-0" />
    <Handle type="source" position={Position.Bottom} className="!bg-orange-300 !w-2 !h-2 !border-0" />
  </div>
);

// ─── Custom Node: Trigger/End ──────────────────────────────────────────────────
const CircleNode = ({ data }) => (
  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg text-base transition-all duration-500 border-2"
    style={{ backgroundColor: data.active ? '#22c55e' : '#1e293b', borderColor: data.active ? '#16a34a' : '#334155' }}>
    <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2 !border-0" />
    {data.icon}
    <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2 !border-0" />
    <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2 !border-0" />
  </div>
);

const nodeTypes = { module: ModuleNode, decision: DecisionNode, circle: CircleNode };

// ─── Node Definitions ──────────────────────────────────────────────────────────
const makeNodes = (active = []) => [
  { id: 'trigger',      type: 'circle',   position: { x: 20,   y: 220 }, data: { icon: '▶', active: active.includes('trigger') } },
  { id: 'gmail_api',    type: 'module',   position: { x: 110,  y: 50  }, data: { label: 'Gmail API',     sublabel: 'Data Source',   color: '#ea4335', icon: '✉', active: active.includes('gmail_api') } },
  { id: 'fetch',        type: 'module',   position: { x: 110,  y: 200 }, data: { label: 'Fetch Threads', sublabel: 'Ingestion',     color: '#0891b2', icon: '⬇', active: active.includes('fetch') } },
  { id: 'token',        type: 'module',   position: { x: 110,  y: 350 }, data: { label: 'OAuth Token',   sublabel: 'Auth Layer',    color: '#7c3aed', icon: '🔑', active: active.includes('token') } },
  { id: 'zustand',      type: 'module',   position: { x: 290,  y: 200 }, data: { label: 'Zustand Store', sublabel: 'State Manager', color: '#0f766e', icon: '⚡', active: active.includes('zustand') } },
  { id: 'threads_found',type: 'decision', position: { x: 460,  y: 180 }, data: { label: 'Threads Found?', active: active.includes('threads_found') } },
  { id: 'no_result',    type: 'module',   position: { x: 460,  y: 50  }, data: { label: 'Empty State',   sublabel: 'No Results',    color: '#94a3b8', icon: '∅', active: active.includes('no_result') } },
  { id: 'neural',       type: 'module',   position: { x: 620,  y: 200 }, data: { label: 'Neural Engine', sublabel: 'AI Processing', color: '#0891b2', icon: '🧠', active: active.includes('neural') } },
  { id: 'classify',     type: 'decision', position: { x: 800,  y: 180 }, data: { label: 'Category?', active: active.includes('classify') } },
  { id: 'food',         type: 'module',   position: { x: 960,  y: 50  }, data: { label: 'Food Insights', sublabel: 'Nutrition Data',color: '#16a34a', icon: '🍔', active: active.includes('food') } },
  { id: 'subscriptions',type: 'module',   position: { x: 960,  y: 200 }, data: { label: 'Subscriptions', sublabel: 'Billing Tracker',color:'#b45309', icon: '🔔', active: active.includes('subscriptions') } },
  { id: 'payment',      type: 'module',   position: { x: 960,  y: 350 }, data: { label: 'Payments',      sublabel: 'Transactions',  color: '#be185d', icon: '💳', active: active.includes('payment') } },
  { id: 'dashboard',    type: 'module',   position: { x: 1150, y: 50  }, data: { label: 'Dashboard',     sublabel: 'UI Layer',      color: '#0891b2', icon: '📊', active: active.includes('dashboard') } },
  { id: 'alerts',       type: 'module',   position: { x: 1150, y: 200 }, data: { label: 'Alerts',        sublabel: 'Notifications', color: '#dc2626', icon: '🚨', active: active.includes('alerts') } },
  { id: 'analytics',    type: 'module',   position: { x: 1150, y: 350 }, data: { label: 'Analytics',     sublabel: 'Reports',       color: '#7c3aed', icon: '📈', active: active.includes('analytics') } },
  { id: 'end',          type: 'circle',   position: { x: 1350, y: 220 }, data: { icon: '■', active: active.includes('end') } },
];

// ─── Edge animation steps (in order) ─────────────────────────────────────────
// Each step: which edges go "lit", which nodes go "active"
const STEPS = [
  { activeNodes: ['trigger'],         activeEdges: [] },
  { activeNodes: ['trigger','fetch','gmail_api','token'], activeEdges: ['e-trigger-fetch','e-gmail-fetch','e-token-fetch'] },
  { activeNodes: ['trigger','fetch','gmail_api','token','zustand'], activeEdges: ['e-trigger-fetch','e-gmail-fetch','e-token-fetch','e-fetch-zustand'] },
  { activeNodes: ['trigger','fetch','gmail_api','token','zustand','threads_found','no_result'], activeEdges: ['e-trigger-fetch','e-gmail-fetch','e-token-fetch','e-fetch-zustand','e-zustand-dec','e-dec-no'] },
  { activeNodes: ['trigger','fetch','gmail_api','token','zustand','threads_found','no_result','neural'], activeEdges: ['e-trigger-fetch','e-gmail-fetch','e-token-fetch','e-fetch-zustand','e-zustand-dec','e-dec-no','e-dec-yes'] },
  { activeNodes: ['trigger','fetch','gmail_api','token','zustand','threads_found','no_result','neural','classify'], activeEdges: ['e-trigger-fetch','e-gmail-fetch','e-token-fetch','e-fetch-zustand','e-zustand-dec','e-dec-no','e-dec-yes','e-neural-cls'] },
  { activeNodes: ['trigger','fetch','gmail_api','token','zustand','threads_found','no_result','neural','classify','food','subscriptions','payment'], activeEdges: ['e-trigger-fetch','e-gmail-fetch','e-token-fetch','e-fetch-zustand','e-zustand-dec','e-dec-no','e-dec-yes','e-neural-cls','e-cls-food','e-cls-sub','e-cls-pay'] },
  { activeNodes: ['trigger','fetch','gmail_api','token','zustand','threads_found','no_result','neural','classify','food','subscriptions','payment','dashboard','alerts','analytics'], activeEdges: ['e-trigger-fetch','e-gmail-fetch','e-token-fetch','e-fetch-zustand','e-zustand-dec','e-dec-no','e-dec-yes','e-neural-cls','e-cls-food','e-cls-sub','e-cls-pay','e-food-dash','e-sub-alerts','e-pay-analytics'] },
  { activeNodes: ['trigger','fetch','gmail_api','token','zustand','threads_found','no_result','neural','classify','food','subscriptions','payment','dashboard','alerts','analytics','end'], activeEdges: ['e-trigger-fetch','e-gmail-fetch','e-token-fetch','e-fetch-zustand','e-zustand-dec','e-dec-no','e-dec-yes','e-neural-cls','e-cls-food','e-cls-sub','e-cls-pay','e-food-dash','e-sub-alerts','e-pay-analytics','e-dash-end','e-alerts-end','e-analytics-end'] },
];

// ─── Edge builder ─────────────────────────────────────────────────────────────
const LIT_COLOR = '#f59e0b';
const DEFAULT_COLOR = '#cbd5e1';

const makeEdges = (activeEdges = []) => [
  { id: 'e-trigger-fetch', source: 'trigger',       target: 'fetch',         type: 'smoothstep', animated: activeEdges.includes('e-trigger-fetch'), style: { stroke: activeEdges.includes('e-trigger-fetch') ? LIT_COLOR : DEFAULT_COLOR, strokeWidth: activeEdges.includes('e-trigger-fetch') ? 2.5 : 1.5 } },
  { id: 'e-gmail-fetch',   source: 'gmail_api',     target: 'fetch',         type: 'smoothstep', animated: activeEdges.includes('e-gmail-fetch'),   style: { stroke: activeEdges.includes('e-gmail-fetch') ? '#ea4335' : DEFAULT_COLOR,  strokeWidth: activeEdges.includes('e-gmail-fetch') ? 2.5 : 1.5 } },
  { id: 'e-token-fetch',   source: 'token',         target: 'fetch',         type: 'smoothstep', animated: activeEdges.includes('e-token-fetch'),   style: { stroke: activeEdges.includes('e-token-fetch') ? '#7c3aed' : DEFAULT_COLOR,  strokeWidth: activeEdges.includes('e-token-fetch') ? 2.5 : 1.5 } },
  { id: 'e-fetch-zustand', source: 'fetch',         target: 'zustand',       type: 'smoothstep', animated: activeEdges.includes('e-fetch-zustand'), style: { stroke: activeEdges.includes('e-fetch-zustand') ? '#0891b2' : DEFAULT_COLOR, strokeWidth: activeEdges.includes('e-fetch-zustand') ? 2.5 : 1.5 } },
  { id: 'e-zustand-dec',   source: 'zustand',       target: 'threads_found', type: 'smoothstep', animated: activeEdges.includes('e-zustand-dec'),   style: { stroke: activeEdges.includes('e-zustand-dec') ? LIT_COLOR : DEFAULT_COLOR,  strokeWidth: activeEdges.includes('e-zustand-dec') ? 2.5 : 1.5 } },
  { id: 'e-dec-no',        source: 'threads_found', target: 'no_result',     type: 'smoothstep', label: 'No',  labelStyle: { fontSize: 8, fontWeight: 700, fill: '#94a3b8' }, animated: activeEdges.includes('e-dec-no'), style: { stroke: activeEdges.includes('e-dec-no') ? '#94a3b8' : DEFAULT_COLOR, strokeWidth: activeEdges.includes('e-dec-no') ? 2.5 : 1.5 } },
  { id: 'e-dec-yes',       source: 'threads_found', target: 'neural',        type: 'smoothstep', label: 'Yes', labelStyle: { fontSize: 8, fontWeight: 700, fill: '#0891b2' }, animated: activeEdges.includes('e-dec-yes'), style: { stroke: activeEdges.includes('e-dec-yes') ? '#0891b2' : DEFAULT_COLOR, strokeWidth: activeEdges.includes('e-dec-yes') ? 2.5 : 1.5 } },
  { id: 'e-neural-cls',    source: 'neural',        target: 'classify',      type: 'smoothstep', animated: activeEdges.includes('e-neural-cls'),    style: { stroke: activeEdges.includes('e-neural-cls') ? LIT_COLOR : DEFAULT_COLOR,   strokeWidth: activeEdges.includes('e-neural-cls') ? 2.5 : 1.5 } },
  { id: 'e-cls-food',      source: 'classify',      target: 'food',          type: 'smoothstep', label: 'Food',    labelStyle: { fontSize: 8, fontWeight: 700, fill: '#16a34a' }, animated: activeEdges.includes('e-cls-food'), style: { stroke: activeEdges.includes('e-cls-food') ? '#16a34a' : DEFAULT_COLOR,  strokeWidth: activeEdges.includes('e-cls-food') ? 2.5 : 1.5 } },
  { id: 'e-cls-sub',       source: 'classify',      target: 'subscriptions', type: 'smoothstep', label: 'Sub',     labelStyle: { fontSize: 8, fontWeight: 700, fill: '#b45309' }, animated: activeEdges.includes('e-cls-sub'),  style: { stroke: activeEdges.includes('e-cls-sub') ? '#b45309' : DEFAULT_COLOR,   strokeWidth: activeEdges.includes('e-cls-sub') ? 2.5 : 1.5 } },
  { id: 'e-cls-pay',       source: 'classify',      target: 'payment',       type: 'smoothstep', label: 'Payment', labelStyle: { fontSize: 8, fontWeight: 700, fill: '#be185d' }, animated: activeEdges.includes('e-cls-pay'),  style: { stroke: activeEdges.includes('e-cls-pay') ? '#be185d' : DEFAULT_COLOR,   strokeWidth: activeEdges.includes('e-cls-pay') ? 2.5 : 1.5 } },
  { id: 'e-food-dash',     source: 'food',          target: 'dashboard',     type: 'smoothstep', animated: activeEdges.includes('e-food-dash'),     style: { stroke: activeEdges.includes('e-food-dash') ? '#16a34a' : DEFAULT_COLOR,   strokeWidth: activeEdges.includes('e-food-dash') ? 2.5 : 1.5 } },
  { id: 'e-sub-alerts',    source: 'subscriptions', target: 'alerts',        type: 'smoothstep', animated: activeEdges.includes('e-sub-alerts'),    style: { stroke: activeEdges.includes('e-sub-alerts') ? '#b45309' : DEFAULT_COLOR,   strokeWidth: activeEdges.includes('e-sub-alerts') ? 2.5 : 1.5 } },
  { id: 'e-pay-analytics', source: 'payment',       target: 'analytics',     type: 'smoothstep', animated: activeEdges.includes('e-pay-analytics'), style: { stroke: activeEdges.includes('e-pay-analytics') ? '#be185d' : DEFAULT_COLOR, strokeWidth: activeEdges.includes('e-pay-analytics') ? 2.5 : 1.5 } },
  { id: 'e-dash-end',      source: 'dashboard',     target: 'end',           type: 'smoothstep', animated: activeEdges.includes('e-dash-end'),      style: { stroke: activeEdges.includes('e-dash-end') ? '#22c55e' : DEFAULT_COLOR,     strokeWidth: activeEdges.includes('e-dash-end') ? 2.5 : 1.5 } },
  { id: 'e-alerts-end',    source: 'alerts',        target: 'end',           type: 'smoothstep', animated: activeEdges.includes('e-alerts-end'),    style: { stroke: activeEdges.includes('e-alerts-end') ? '#22c55e' : DEFAULT_COLOR,   strokeWidth: activeEdges.includes('e-alerts-end') ? 2.5 : 1.5 } },
  { id: 'e-analytics-end', source: 'analytics',     target: 'end',           type: 'smoothstep', animated: activeEdges.includes('e-analytics-end'), style: { stroke: activeEdges.includes('e-analytics-end') ? '#22c55e' : DEFAULT_COLOR, strokeWidth: activeEdges.includes('e-analytics-end') ? 2.5 : 1.5 } },
];

// ─── Main Component ────────────────────────────────────────────────────────────
const WorkflowFlow = ({ isPlaying, onPlayEnd }) => {
  const [stepIndex, setStepIndex] = useState(-1);
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes([]));
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges([]));

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // When isPlaying flips to true → start stepping through
  useEffect(() => {
    if (isPlaying) {
      setStepIndex(0);
    } else {
      // Reset everything
      setStepIndex(-1);
      setNodes(makeNodes([]));
      setEdges(makeEdges([]));
    }
  }, [isPlaying]);

  // Step through animation
  useEffect(() => {
    if (stepIndex < 0 || stepIndex >= STEPS.length) return;

    const step = STEPS[stepIndex];
    setNodes(makeNodes(step.activeNodes));
    setEdges(makeEdges(step.activeEdges));

    if (stepIndex < STEPS.length - 1) {
      const timer = setTimeout(() => setStepIndex(i => i + 1), 800);
      return () => clearTimeout(timer);
    } else {
      // Done
      if (onPlayEnd) setTimeout(onPlayEnd, 600);
    }
  }, [stepIndex]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.4}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
      </ReactFlow>
    </div>
  );
};

export default WorkflowFlow;
