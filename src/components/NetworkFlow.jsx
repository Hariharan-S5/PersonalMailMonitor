import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Send, Clock, CheckCircle2, AlertCircle, Database, Timer } from 'lucide-react';
import { useEmailStore } from '../store/useEmailStore';

// ─── Custom Node Types ─────────────────────────────────────────────────────────

const MetricNode = ({ data }) => {
  const activeStyle = data.isPulsing ? {
    boxShadow: `0 0 20px -2px ${data.color}`,
    backgroundColor: '#ffffff',
    transform: 'scale(1.05)',
  } : {
    backgroundColor: '#ffffff',
    transform: 'scale(1)',
  };

  return (
    <div
      className="rounded-2xl border-2 px-4 py-3 min-w-[200px] transition-all duration-300 shadow-sm relative overflow-hidden group"
      style={{ borderColor: data.color, ...activeStyle }}
    >
      <div className="absolute top-0 right-0 p-2 opacity-10 filter blur-[2px] transform translate-x-4 -translate-y-4 group-hover:blur-none group-hover:opacity-20 transition-all text-current" style={{ color: data.color }}>
        {data.icon}
      </div>

      {data.in && <Handle type="target" position={Position.Left} id="left" className="!w-2 !h-2 !border-0" style={{ background: data.color }} />}
      {data.topIn && <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !border-0" style={{ background: data.color }} />}
      
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md transition-transform" style={{ backgroundColor: data.color }}>
          {data.icon}
        </div>
        <div className="flex-1 w-full flex flex-col items-start text-left">
          <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-0.5">{data.label}</p>
          <div className="text-xl font-black text-slate-800 tracking-tighter tabular-nums flex items-baseline gap-1">
            {data.value}
            <span className="text-[10px] font-bold text-slate-400 tracking-widest">{data.unit}</span>
          </div>
          {data.subValue && (
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest py-0.5 px-1.5 rounded bg-slate-100/80">
              {data.subValue}
            </p>
          )}
        </div>
      </div>

      {data.out && <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !border-0" style={{ background: data.color }} />}
      {data.bottomOut && <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !border-0" style={{ background: data.color }} />}
    </div>
  );
};

const nodeTypes = { metric: MetricNode };

// ─── Colors ──────────────────────────────────────────────────────────
const C_SEND = '#3b82f6'; // Blue
const C_PEND = '#f59e0b'; // Amber
const C_SUCC = '#10b981'; // Emerald
const C_ERR  = '#ef4444'; // Red
const C_TIME = '#8b5cf6'; // Violet

// ─── Component ─────────────────────────────────────────────────────────
const NetworkFlow = () => {
  const [displayMetrics, setDisplayMetrics] = useState(useEmailStore.getState().networkMetrics);

  // Sampling interval: Update the UI every 5 seconds to reduce visual noise
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayMetrics(useEmailStore.getState().networkMetrics);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (kb) => {
    if (kb === 0) return '0 KB';
    const bytes = kb * 1024;
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Construct Data Nodes bound to sampled metrics
  const makeNodes = () => [
    { 
      id: 'n_send', type: 'metric', position: { x: 50, y: 150 }, 
      data: { label: 'Requests Sent', value: displayMetrics.requests, unit: 'req', subValue: `${formatBytes(displayMetrics.sentKb)} Uploaded`, icon: <Send size={18} />, color: C_SEND, out: true, isPulsing: displayMetrics.pending > 0 } 
    },
    { 
      id: 'n_pend', type: 'metric', position: { x: 350, y: 150 }, 
      data: { label: 'Pending / Network', value: displayMetrics.pending, unit: 'req', subValue: 'Awaiting Response', icon: <Clock size={18} />, color: C_PEND, in: true, out: true, bottomOut: true, isPulsing: displayMetrics.pending > 0 } 
    },
    { 
      id: 'n_succ', type: 'metric', position: { x: 650, y: 50 }, 
      data: { label: 'Successful', value: displayMetrics.success, unit: 'req', subValue: `${formatBytes(displayMetrics.fetchedKb)} Fetched`, icon: <CheckCircle2 size={18} />, color: C_SUCC, in: true, out: true, isPulsing: displayMetrics.success > 0 && displayMetrics.pending > 0 } 
    },
    { 
      id: 'n_err', type: 'metric', position: { x: 650, y: 250 }, 
      data: { label: 'Errors / Timeouts', value: displayMetrics.errors, unit: 'req', subValue: `${((displayMetrics.errors / Math.max(displayMetrics.requests, 1)) * 100).toFixed(1)}% Failure Rate`, icon: <AlertCircle size={18} />, color: C_ERR, in: true, isPulsing: displayMetrics.errors > 0 } 
    },
    { 
      id: 'n_time', type: 'metric', position: { x: 950, y: 50 }, 
      data: { label: 'Execution Engine', value: displayMetrics.avgTime, unit: 'ms', subValue: `Avg Response Time`, icon: <Timer size={18} />, color: C_TIME, in: true, isPulsing: displayMetrics.success > 0 } 
    },
  ];

  const makeEdges = () => [
    { id: 'e_s2p', source: 'n_send', target: 'n_pend', sourceHandle: 'right', targetHandle: 'left', type: 'default', animated: displayMetrics.pending > 0, style: { stroke: C_SEND, strokeWidth: displayMetrics.pending > 0 ? 3 : 1, opacity: displayMetrics.pending > 0 ? 1 : 0.2 } },
    { id: 'e_p2s', source: 'n_pend', target: 'n_succ', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', animated: displayMetrics.success > 0 && displayMetrics.pending > 0, style: { stroke: C_SUCC, strokeWidth: displayMetrics.success > 0 ? 3 : 1, opacity: displayMetrics.success > 0 ? 1 : 0.2 } },
    { id: 'e_p2e', source: 'n_pend', target: 'n_err', sourceHandle: 'bottom', targetHandle: 'left', type: 'smoothstep', animated: displayMetrics.errors > 0 && displayMetrics.pending > 0, style: { stroke: C_ERR, strokeWidth: displayMetrics.errors > 0 ? 3 : 1, opacity: displayMetrics.errors > 0 ? 1 : 0.2 } },
    { id: 'e_s2t', source: 'n_succ', target: 'n_time', sourceHandle: 'right', targetHandle: 'left', type: 'default', animated: displayMetrics.success > 0, style: { stroke: C_TIME, strokeWidth: displayMetrics.success > 0 ? 3 : 1, opacity: displayMetrics.success > 0 ? 1 : 0.2 } },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync React Flow state with sampled metrics
  useEffect(() => {
    setNodes(makeNodes());
    setEdges(makeEdges());
  }, [displayMetrics]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
      </ReactFlow>
    </div>
  );
};

export default NetworkFlow;
