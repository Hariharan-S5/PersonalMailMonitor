import React, { useCallback, useState, useEffect } from 'react';
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
import { User, MousePointerClick, Layout, Database, Server, RefreshCcw, Activity } from 'lucide-react';

// ─── Custom Node Types ─────────────────────────────────────────────────────────

const ActionNode = ({ data }) => {
  const activeStyle = data.isActive ? {
    boxShadow: `0 0 20px -2px ${data.color}`,
    backgroundColor: '#ffffff',
    transform: 'scale(1.05)',
    filter: 'none',
    opacity: 1
  } : {
    backgroundColor: '#f8fafc',
    transform: 'scale(1)',
    filter: 'grayscale(100%)',
    opacity: 0.4
  };

  return (
    <div
      className="rounded-full border-4 px-4 py-3 min-w-[150px] transition-all duration-500 shadow-sm flex flex-col items-center justify-center"
      style={{ borderColor: data.color, ...activeStyle }}
    >
      {data.in && <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !border-0 transition-all duration-500" style={{ background: data.color, filter: activeStyle.filter, opacity: activeStyle.opacity }} />}
      
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 transition-all duration-500 mb-1" style={{ backgroundColor: data.color }}>
        {data.icon}
      </div>
      <p className="text-[10px] font-black text-slate-800 tracking-tight leading-tight text-center">{data.label}</p>
      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest text-center mt-0.5">{data.sub}</p>

      {data.out && <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !border-0 transition-all duration-500" style={{ background: data.color, filter: activeStyle.filter, opacity: activeStyle.opacity }} />}
    </div>
  );
};

const ProcessNode = ({ data }) => {
  const activeStyle = data.isActive ? {
    boxShadow: `0 0 20px -2px ${data.color}`,
    backgroundColor: '#ffffff',
    transform: 'scale(1.05)',
    filter: 'none',
    opacity: 1
  } : {
    backgroundColor: '#f8fafc',
    transform: 'scale(1)',
    filter: 'grayscale(100%)',
    opacity: 0.4
  };

  return (
    <div
      className="rounded-xl border-2 px-3 py-3 min-w-[140px] transition-all duration-500 flex flex-col items-center shadow-sm"
      style={{ borderColor: data.color, ...activeStyle, borderStyle: data.dashed ? 'dashed' : 'solid' }}
    >
      {data.in && <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !border-0 transition-all duration-500" style={{ background: data.color, filter: activeStyle.filter, opacity: activeStyle.opacity }} />}
      {data.topIn && <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !border-0 transition-all duration-500" style={{ background: data.color, filter: activeStyle.filter, opacity: activeStyle.opacity }} />}
      
      <div className="flex items-center gap-2 w-full">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 transition-all duration-500" style={{ backgroundColor: data.color }}>
          {data.icon}
        </div>
        <div className="flex-1 text-left">
          <p className="text-[9px] font-black text-slate-800 tracking-tighter leading-tight">{data.label}</p>
          <p className="text-[6.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{data.sub}</p>
        </div>
      </div>

      {data.out && <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !border-0 transition-all duration-500" style={{ background: data.color, filter: activeStyle.filter, opacity: activeStyle.opacity }} />}
      {data.bottomOut && <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !border-0 transition-all duration-500" style={{ background: data.color, filter: activeStyle.filter, opacity: activeStyle.opacity }} />}
    </div>
  );
};

const nodeTypes = { action: ActionNode, process: ProcessNode };

// ─── Colors ──────────────────────────────────────────────────────────
const C_USER  = '#ec4899'; // Pink
const C_UI    = '#0ea5e9'; // Light Blue
const C_STATE = '#8b5cf6'; // Violet
const C_SERV  = '#f59e0b'; // Amber
const C_API   = '#10b981'; // Emerald

// ─── Data Definitions ──────────────────────────────────────────────────────────
const makeNodes = () => [
  { id: 'n_user', type: 'action', position: { x: 50, y: 150 }, data: { label: 'User Action', sub: 'Click / Input', icon: <MousePointerClick size={16} />, color: C_USER, out: true } },
  
  { id: 'n_ui_req', type: 'process', position: { x: 300, y: 150 }, data: { label: 'Component Event', sub: 'EmailList.jsx', icon: <Layout size={14} />, color: C_UI, in: true, out: true } },
  
  { id: 'n_store_req', type: 'process', position: { x: 550, y: 150 }, data: { label: 'Zustand Action', sub: 'useEmailStore.js', icon: <Database size={14} />, color: C_STATE, in: true, out: true } },
  
  { id: 'n_svc_req', type: 'process', position: { x: 800, y: 150 }, data: { label: 'API Call', sub: 'emailService.js', icon: <Server size={14} />, color: C_SERV, in: true, out: true } },
  
  { id: 'n_api', type: 'action', position: { x: 1050, y: 150 }, data: { label: 'External API', sub: 'Gmail / Database', icon: <Activity size={16} />, color: C_API, in: true, out: true } },
  
  { id: 'n_store_res', type: 'process', position: { x: 800, y: 300 }, data: { label: 'State Hydration', sub: 'Zustand Mutated', icon: <Database size={14} />, color: C_STATE, in: true, out: true } },
  
  { id: 'n_ui_res', type: 'process', position: { x: 550, y: 300 }, data: { label: 'UI Re-render', sub: 'React DOM Update', icon: <RefreshCcw size={14} />, color: C_UI, in: true, out: true } },
];

const makeEdges = () => [
  { id: 'e1', source: 'n_user', target: 'n_ui_req', type: 'default', style: { stroke: C_USER } },
  { id: 'e2', source: 'n_ui_req', target: 'n_store_req', type: 'default', style: { stroke: C_UI } },
  { id: 'e3', source: 'n_store_req', target: 'n_svc_req', type: 'default', style: { stroke: C_STATE } },
  { id: 'e4', source: 'n_svc_req', target: 'n_api', type: 'default', style: { stroke: C_SERV } },
  
  // Return path
  { id: 'e5', source: 'n_api', target: 'n_store_res', type: 'smoothstep', style: { stroke: C_API } },
  { id: 'e6', source: 'n_store_res', target: 'n_ui_res', type: 'default', style: { stroke: C_STATE } },
];

// ─── Component ─────────────────────────────────────────────────────────
const DataFlow = ({ isPlaying, onPlayEnd }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [step, setStep] = useState(0);

  // Play animation sequence
  useEffect(() => {
    if (!isPlaying) {
      setStep(0);
      return;
    }

    const maxSteps = 8;
    setStep(1); 
    
    let currentStep = 1;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep > maxSteps) {
        clearInterval(interval);
        if (onPlayEnd) onPlayEnd();
        setStep(0);
      } else {
        setStep(currentStep);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, onPlayEnd]);

  // Update Node/Edge appearance based on Step
  useEffect(() => {
    const activeNodes = new Set();
    const activeEdges = new Set();
    
    if (step >= 1) activeNodes.add('n_user');
    
    if (step >= 2) {
      activeNodes.add('n_ui_req');
      activeEdges.add('e1');
    }
    
    if (step >= 3) {
      activeNodes.add('n_store_req');
      activeEdges.add('e2');
    }
    
    if (step >= 4) {
      activeNodes.add('n_svc_req');
      activeEdges.add('e3');
    }
    
    if (step >= 5) {
      activeNodes.add('n_api');
      activeEdges.add('e4');
    }
    
    if (step >= 6) {
      activeNodes.add('n_store_res');
      activeEdges.add('e5');
    }

    if (step >= 7) {
      activeNodes.add('n_ui_res');
      activeEdges.add('e6');
    }

    setNodes(nds => nds.map(n => {
      const isNodeActive = activeNodes.has(n.id);
      return {
        ...n,
        data: {
          ...n.data,
          isActive: isNodeActive
        }
      };
    }));

    setEdges(eds => eds.map(e => {
      const isActive = activeEdges.has(e.id);
      return {
        ...e,
        animated: isActive,
        style: {
          ...e.style,
          stroke: isActive ? e.style.stroke : '#94a3b8',
          strokeWidth: isActive ? 3 : 1,
          opacity: isActive ? 1 : 0.2,
          transition: 'all 500ms ease'
        }
      };
    }));
  }, [step, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

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
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
      </ReactFlow>
    </div>
  );
};

export default DataFlow;
