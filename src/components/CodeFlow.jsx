import React, { useCallback } from 'react';
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
import { Layout, FileCode2, Link, Server, Database, Code2 } from 'lucide-react';

// ─── Custom Node Types ─────────────────────────────────────────────────────────
const FileNode = ({ data }) => {
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
      className="rounded-xl border-2 px-3 py-2 min-w-[140px] max-w-[160px] transition-all duration-500 shadow-sm"
      style={{ borderColor: data.color, ...activeStyle }}
    >
      {data.in && <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !border-0 transition-all duration-500" style={{ background: data.color, filter: activeStyle.filter, opacity: activeStyle.opacity }} />}
      {data.topIn && <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !border-0 transition-all duration-500" style={{ background: data.color, filter: activeStyle.filter, opacity: activeStyle.opacity }} />}
      
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0 transition-all duration-500" style={{ backgroundColor: data.color }}>
          {data.icon}
        </div>
        <div>
          <p className="text-[8.5px] font-black text-slate-800 tracking-tighter leading-tight">{data.label}</p>
          <p className="text-[6.5px] font-bold text-slate-400 uppercase tracking-widest">{data.sub}</p>
        </div>
      </div>

      {data.out && <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !border-0 transition-all duration-500" style={{ background: data.color, filter: activeStyle.filter, opacity: activeStyle.opacity }} />}
      {data.bottomOut && <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !border-0 transition-all duration-500" style={{ background: data.color, filter: activeStyle.filter, opacity: activeStyle.opacity }} />}
    </div>
  );
};

const GroupNode = ({ data }) => {
  const activeStyle = data.isActive ? {
    backgroundColor: '#f8fafc',
    filter: 'none',
    opacity: 1
  } : {
    backgroundColor: '#f1f5f9',
    filter: 'grayscale(100%)',
    opacity: 0.5
  };

  return (
    <div
      className="rounded-3xl border-2 border-dashed relative transition-all duration-500"
      style={{ width: data.width, height: data.height, borderColor: data.color, ...activeStyle }}
    >
      <div 
        className="absolute -top-3 left-6 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-sm flex items-center gap-1.5 transition-all duration-500"
        style={{ backgroundColor: data.color }}
      >
        {data.icon} {data.label}
      </div>
    </div>
  );
};

const nodeTypes = { file: FileNode, group: GroupNode };

// ─── Node Definitions ──────────────────────────────────────────────────────────
const C_APP   = '#6366f1'; // Indigo
const C_PAGE  = '#0ea5e9'; // Light Blue
const C_COMP  = '#10b981'; // Emerald
const C_HOOK  = '#8b5cf6'; // Violet
const C_SERV  = '#f59e0b'; // Amber
const C_API   = '#ef4444'; // Red

const makeNodes = () => [
  // GROUPS - Much wider, compact grid layouts. Crucial: `style` block must contain width/height for extent: 'parent' to work correctly!
  { id: 'g_pages', type: 'group', position: { x: 220, y: 50 },  style: { width: 200, height: 260 }, data: { label: 'Pages (/src/pages)', width: 200, height: 260, color: C_PAGE, icon: <Layout size={10} /> } },
  { id: 'g_comps', type: 'group', position: { x: 450, y: 50 },  style: { width: 380, height: 260 }, data: { label: 'Components (/src/components)', width: 380, height: 260, color: C_COMP, icon: <FileCode2 size={10} /> } },
  { id: 'g_hooks', type: 'group', position: { x: 860, y: 50 },  style: { width: 200, height: 190 }, data: { label: 'Store & Hooks (/src/store)', width: 200, height: 190, color: C_HOOK, icon: <Link size={10} /> } },
  { id: 'g_servs', type: 'group', position: { x: 1090, y: 50 }, style: { width: 200, height: 260 }, data: { label: 'Services (/src/services)', width: 200, height: 260, color: C_SERV, icon: <Server size={10} /> } },
  { id: 'g_apis',  type: 'group', position: { x: 1320, y: 50 }, style: { width: 200, height: 190 }, data: { label: 'External APIs', width: 200, height: 190, color: C_API, icon: <Database size={10} /> } },

  // ROOT
  { id: 'app_jsx', type: 'file', position: { x: 20, y: 155 }, data: { label: 'App.jsx', sub: 'Root Router', icon: <Code2 size={12} />, color: C_APP, out: true } },

  // PAGES (1 column, 3 rows)
  { id: 'p_dash', type: 'file', position: { x: 20, y: 40 },  data: { label: 'Dashboard.jsx', sub: 'Page', icon: <Layout size={12} />, color: C_PAGE, in: true, out: true }, parentId: 'g_pages', extent: 'parent' },
  { id: 'p_arch', type: 'file', position: { x: 20, y: 110 }, data: { label: 'Architecture.jsx', sub: 'Page', icon: <Layout size={12} />, color: C_PAGE, in: true, out: true }, parentId: 'g_pages', extent: 'parent' },
  { id: 'p_work', type: 'file', position: { x: 20, y: 180 }, data: { label: 'Workflow.jsx', sub: 'Page', icon: <Layout size={12} />, color: C_PAGE, in: true, out: true }, parentId: 'g_pages', extent: 'parent' },

  // COMPONENTS (2 columns, 3 rows)
  { id: 'c_head', type: 'file', position: { x: 20, y: 40 },  data: { label: 'Header.jsx', sub: 'UI Component', icon: <FileCode2 size={12} />, color: C_COMP, in: true, out: true }, parentId: 'g_comps', extent: 'parent' },
  { id: 'c_side', type: 'file', position: { x: 20, y: 110 }, data: { label: 'Sidebar.jsx', sub: 'UI Component', icon: <FileCode2 size={12} />, color: C_COMP, in: true, out: true }, parentId: 'g_comps', extent: 'parent' },
  { id: 'c_mail', type: 'file', position: { x: 200, y: 40 }, data: { label: 'EmailList.jsx', sub: 'Feature UI', icon: <FileCode2 size={12} />, color: C_COMP, in: true, out: true }, parentId: 'g_comps', extent: 'parent' },
  { id: 'c_metr', type: 'file', position: { x: 200, y: 110 }, data: { label: 'MetricsPanel.jsx', sub: 'Feature UI', icon: <FileCode2 size={12} />, color: C_COMP, in: true, out: true }, parentId: 'g_comps', extent: 'parent' },
  { id: 'c_flow', type: 'file', position: { x: 110, y: 180 }, data: { label: 'ArchFlow.jsx', sub: 'Diagram UI', icon: <FileCode2 size={12} />, color: C_COMP, in: true, out: true }, parentId: 'g_comps', extent: 'parent' },

  // HOOKS / STORE (1 column, 2 rows)
  { id: 'h_mail', type: 'file', position: { x: 20, y: 40 }, data: { label: 'useEmailStore.js', sub: 'Zustand State', icon: <Link size={12} />, color: C_HOOK, in: true, out: true }, parentId: 'g_hooks', extent: 'parent' },
  { id: 'h_auth', type: 'file', position: { x: 20, y: 110 }, data: { label: 'useAuth.js', sub: 'Context Hook', icon: <Link size={12} />, color: C_HOOK, in: true, out: true }, parentId: 'g_hooks', extent: 'parent' },

  // SERVICES (1 column, 3 rows)
  { id: 's_mail', type: 'file', position: { x: 20, y: 40 }, data: { label: 'emailService.js', sub: 'API Client', icon: <Server size={12} />, color: C_SERV, in: true, out: true }, parentId: 'g_servs', extent: 'parent' },
  { id: 's_neur', type: 'file', position: { x: 20, y: 110 }, data: { label: 'neuralEngine.js', sub: 'AI Parser', icon: <Server size={12} />, color: C_SERV, in: true, out: true }, parentId: 'g_servs', extent: 'parent' },
  { id: 's_fire', type: 'file', position: { x: 20, y: 180 }, data: { label: 'firebase.js', sub: 'Auth Config', icon: <Server size={12} />, color: C_SERV, in: true, out: true }, parentId: 'g_servs', extent: 'parent' },

  // API (1 column, 2 rows)
  { id: 'a_gapi', type: 'file', position: { x: 20, y: 40 }, data: { label: 'Gmail API', sub: 'Google Cloud', icon: <Database size={12} />, color: C_API, in: true }, parentId: 'g_apis', extent: 'parent' },
  { id: 'a_fire', type: 'file', position: { x: 20, y: 110 }, data: { label: 'Firebase Auth', sub: 'Google Identity', icon: <Database size={12} />, color: C_API, in: true }, parentId: 'g_apis', extent: 'parent' },
];

const makeEdges = () => [
  // App routing to Pages
  { id: 'e1', source: 'app_jsx', target: 'p_dash', type: 'smoothstep', style: { stroke: C_PAGE, strokeWidth: 1.5 } },
  { id: 'e2', source: 'app_jsx', target: 'p_arch', type: 'smoothstep', style: { stroke: C_PAGE, strokeWidth: 1.5 } },
  { id: 'e3', source: 'app_jsx', target: 'p_work', type: 'smoothstep', style: { stroke: C_PAGE, strokeWidth: 1.5 } },

  // Pages to Components
  { id: 'e4', source: 'p_dash', target: 'c_head', type: 'smoothstep', style: { stroke: C_COMP, strokeWidth: 1.5 } },
  { id: 'e5', source: 'p_dash', target: 'c_side', type: 'smoothstep', style: { stroke: C_COMP, strokeWidth: 1.5 } },
  { id: 'e6', source: 'p_dash', target: 'c_mail', type: 'smoothstep', style: { stroke: C_COMP, strokeWidth: 1.5 } },
  { id: 'e7', source: 'p_dash', target: 'c_metr', type: 'smoothstep', style: { stroke: C_COMP, strokeWidth: 1.5 } },
  
  { id: 'e8', source: 'p_arch', target: 'c_flow', type: 'smoothstep', style: { stroke: C_COMP, strokeWidth: 1.5 } },

  // Components to UI State / Hooks
  { id: 'e9',  source: 'c_head', target: 'h_auth', type: 'smoothstep', style: { stroke: C_HOOK, strokeWidth: 1.5 } },
  { id: 'e10', source: 'c_mail', target: 'h_mail', type: 'smoothstep', style: { stroke: C_HOOK, strokeWidth: 1.5 } },
  { id: 'e11', source: 'c_metr', target: 'h_mail', type: 'smoothstep', style: { stroke: C_HOOK, strokeWidth: 1.5 } },
  { id: 'e12', source: 'c_flow', target: 'h_mail', type: 'smoothstep', style: { stroke: C_HOOK, strokeWidth: 1.5 } }, // Reads from store

  // Hooks to Services
  { id: 'e13', source: 'h_mail', target: 's_mail', type: 'smoothstep', style: { stroke: C_SERV, strokeWidth: 1.5 } },
  { id: 'e14', source: 'h_mail', target: 's_neur', type: 'smoothstep', style: { stroke: C_SERV, strokeWidth: 1.5 } },
  { id: 'e15', source: 'h_auth', target: 's_fire', type: 'smoothstep', style: { stroke: C_SERV, strokeWidth: 1.5 } },

  // Services to APIs
  { id: 'e16', source: 's_mail', target: 'a_gapi', type: 'smoothstep', animated: true, style: { stroke: C_API, strokeWidth: 2 } },
  { id: 'e17', source: 's_fire', target: 'a_fire', type: 'smoothstep', animated: true, style: { stroke: C_API, strokeWidth: 2 } },
];

const CodeFlow = ({ isPlaying, onPlayEnd }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [step, setStep] = React.useState(0);

  // Play animation sequence
  React.useEffect(() => {
    if (!isPlaying) {
      setStep(0);
      return;
    }

    const maxSteps = 7;
    setStep(1); // Start immediately
    
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
  React.useEffect(() => {
    const activeNodes = new Set();
    const activeEdges = new Set();
    
    if (step >= 1) activeNodes.add('app_jsx');
    
    if (step >= 2) {
      ['p_dash', 'p_arch', 'p_work'].forEach(n => activeNodes.add(n));
      ['e1', 'e2', 'e3'].forEach(e => activeEdges.add(e));
    }
    
    if (step >= 3) {
      ['c_head', 'c_side', 'c_mail', 'c_metr', 'c_flow'].forEach(n => activeNodes.add(n));
      ['e4', 'e5', 'e6', 'e7', 'e8'].forEach(e => activeEdges.add(e));
    }
    
    if (step >= 4) {
      ['h_mail', 'h_auth'].forEach(n => activeNodes.add(n));
      ['e9', 'e10', 'e11', 'e12'].forEach(e => activeEdges.add(e));
    }
    
    if (step >= 5) {
      ['s_mail', 's_neur', 's_fire'].forEach(n => activeNodes.add(n));
      ['e13', 'e14', 'e15'].forEach(e => activeEdges.add(e));
    }
    
    if (step >= 6) {
      // API out
      ['a_gapi', 'a_fire'].forEach(n => activeNodes.add(n));
      ['e16', 'e17'].forEach(e => activeEdges.add(e));
    }

    setNodes(nds => nds.map(n => {
      let isNodeActive = activeNodes.has(n.id);
      
      // If it's a group node, check if ANY of its children are active.
      if (n.type === 'group') {
        const groupChildren = nds.filter(child => child.parentId === n.id);
        isNodeActive = groupChildren.some(child => activeNodes.has(child.id));
      }

      // DO NOT pass `transform` to n.style, it overwrites React Flow's `translate(x, y)` coordinate positioning!
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
          strokeWidth: isActive ? 2.5 : 1,
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

export default CodeFlow;
