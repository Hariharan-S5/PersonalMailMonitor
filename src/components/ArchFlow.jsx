import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { architectureMap } from '../data/architecture_map';
import { useEmailStore } from '../store/useEmailStore';
import { 
  Layout, 
  Box, 
  Activity, 
  Zap, 
  Database, 
  Columns, 
  Code2, 
  Sparkles,
  Lock
} from 'lucide-react';

const ICON_MAP = {
  Layout: <Layout size={16} />,
  Box: <Box size={16} />,
  Activity: <Activity size={16} />,
  Zap: <Zap size={16} />,
  Database: <Database size={16} />,
  Columns: <Columns size={16} />,
};

// ─── Custom Node Types ─────────────────────────────────────────────────────────
const ModuleNode = ({ data, subscriptionType }) => {
  const isElite = subscriptionType === 'Elite';
  
  return (
    <div
      className={`rounded-2xl border-2 px-4 py-3 min-w-[160px] transition-all duration-500 relative group ${
        data.isSimplified ? 'opacity-90' : ''
      }`}
      style={{
        borderColor: data.color + '40',
        background: `linear-gradient(135deg, ${data.color}05 0%, white 100%)`,
        boxShadow: `0 10px 30px -10px ${data.color}15`,
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !border-0 !bg-slate-200" />
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg shadow-${data.color}-500/20"
          style={{ backgroundColor: data.color }}
        >
          {ICON_MAP[data.icon] || <Box size={16} />}
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-800 uppercase tracking-tight leading-tight mb-0.5">{data.label}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[7px] font-bold text-slate-400 tracking-widest uppercase">{data.sub}</span>
            {isElite && (
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <Code2 size={8} className="text-emerald-500" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isElite && (
        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-1 bg-violet-500 rounded-full text-white shadow-lg">
            <Sparkles size={8} />
          </div>
        </div>
      )}
      
      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !border-0 !bg-slate-200" />
    </div>
  );
};

const nodeTypes = { module: ModuleNode };

// ─── Main Component ────────────────────────────────────────────────────────────
const ArchFlow = () => {
  const { subscriptionType } = useEmailStore();

  const { nodes, edges } = useMemo(() => {
    // 1. Subscription-based Filtering
    let filteredNodes = [...architectureMap.nodes];
    
    if (subscriptionType === 'Basic') {
      // Show only core pages and services
      filteredNodes = filteredNodes.filter(n => n.module === 'pages' || n.module === 'services').slice(0, 8);
    } else if (subscriptionType === 'Pro') {
      // Show everything except maybe raw utilities/layouts if we want to keep it cleaner
      filteredNodes = filteredNodes.filter(n => n.module !== 'layouts');
    }
    // Elite shows ALL

    const nodeIds = new Set(filteredNodes.map(n => n.id));

    // 2. Responsive Grid Layout Algorithm
    const MODULE_ORDER = ['pages', 'components', 'hooks', 'store', 'services', 'layouts'];
    const COL_WIDTH = 250;
    const ROW_HEIGHT = 100;
    
    // Group nodes by module for the grid
    const grouped = {};
    filteredNodes.forEach(node => {
      if (!grouped[node.module]) grouped[node.module] = [];
      grouped[node.module].push(node);
    });

    const finalNodes = [];
    MODULE_ORDER.forEach((module, colIndex) => {
      const moduleNodes = grouped[module] || [];
      moduleNodes.forEach((node, rowIndex) => {
        finalNodes.push({
          ...node,
          type: 'module',
          position: { x: colIndex * COL_WIDTH, y: rowIndex * ROW_HEIGHT + (colIndex % 2 === 0 ? 0 : 50) },
          data: { ...node, subscriptionType }
        });
      });
    });

    // 3. Filter Edges based on visible nodes
    const filteredEdges = architectureMap.edges.filter(
      e => nodeIds.has(e.source) && nodeIds.has(e.target)
    ).map(e => ({
      ...e,
      type: 'smoothstep',
      animated: subscriptionType !== 'Basic',
      style: { 
        stroke: '#6366f140', 
        strokeWidth: subscriptionType === 'Elite' ? 2 : 1.5,
      },
      label: subscriptionType === 'Elite' ? 'CALL' : undefined,
      labelStyle: { fontSize: 6, fontWeight: 900, fill: '#6366f1' }
    }));

    return { nodes: finalNodes, edges: filteredEdges };
  }, [subscriptionType]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#f8fafc' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" gap={20} size={1} color="#e2e8f0" />
      </ReactFlow>

      {/* TIER INDICATOR OVERLAY */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-xl">
        <div className={`w-2 h-2 rounded-full ${subscriptionType === 'Elite' ? 'bg-violet-500' : subscriptionType === 'Pro' ? 'bg-primary-500' : 'bg-slate-400'}`} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Viewing {subscriptionType} Architecture
        </span>
        {subscriptionType !== 'Elite' && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200 ml-1">
            <Lock size={12} className="text-slate-400" />
            <span className="text-[8px] font-bold text-slate-400 uppercase">Upgrade for full access</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchFlow;

