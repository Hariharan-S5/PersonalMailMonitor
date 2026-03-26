import React, { useState, useEffect, useMemo } from 'react';
import { 
  Filter, X, Clock, History, CalendarDays, Calendar, 
  Zap, Infinity, ChevronRight, RotateCcw, Settings, Search, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEmailStore } from '../../store/useEmailStore';
import { NAV_ITEMS } from '../../constants/navigation';
import { FILTER_PRESETS } from '../../constants/filterPresets';
import { formatFilterDate, getPresetDateRange } from '../../utils/dateUtils';

/**
 * Reusable content for the Ecosystem Filter, used in both the Header Overlay and Banner Popover.
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close the parent overlay/popover.
 * @param {boolean|string} props.hideContext - If true or a string (pageId), hides the page selection range.
 * @param {boolean} props.isCompact - If true, reduces padding and font sizes for smaller popovers.
 */
const FilterOverlayContent = ({ onClose, hideContext, isCompact = false }) => {
  const { pageFilters, setPageFilter, preferences = {} } = useEmailStore();
  
  // pageId is strictly the context ID passed in
  const pageId = typeof hideContext === 'string' ? hideContext : 'overview';

  // Initialize temp filter strictly from page-specific source
  const [tempFilter, setTempFilter] = useState(() => {
    return pageFilters[pageId] || { 
      type: 'preset', 
      preset: '7d', 
      mode: 'between', 
      startDate: '', 
      endDate: ''
    };
  });

  // Sync temp filter when pageId changes
  useEffect(() => {
    setTempFilter(pageFilters[pageId] || { 
      type: 'preset', 
      preset: '7d', 
      mode: 'between', 
      startDate: '', 
      endDate: ''
    });
  }, [pageFilters, pageId]);

  const formatDate = formatFilterDate;

  const validationError = useMemo(() => {
    if (tempFilter.type !== 'custom') return null;
    if (!tempFilter.startDate) return "Start date required";
    if (tempFilter.mode === 'between') {
      if (!tempFilter.endDate) return "End date required";
      if (tempFilter.startDate > tempFilter.endDate) return "Start date cannot be after end date";
    }
    return null;
  }, [tempFilter]);
  const [presetSearch, setPresetSearch] = useState('');

  const pages = NAV_ITEMS;

  const presetIcons = {
    'today': <Clock size={16} />,
    '24h': <Clock size={16} />,
    'yesterday': <History size={16} />,
    'day_before': <History size={16} />,
    '3d': <CalendarDays size={16} />,
    '7d': <CalendarDays size={16} />,
    '14d': <CalendarDays size={16} />,
    '30d': <Calendar size={16} />,
    'this_week': <CalendarDays size={16} />,
    'last_week': <CalendarDays size={16} />,
    'this_month': <Calendar size={16} />,
    'last_month': <Calendar size={16} />,
    'this_quarter': <Zap size={16} />,
    'last_quarter': <Zap size={16} />,
    'this_year': <Zap size={16} />,
    'last_year': <Zap size={16} />,
    '90d': <Zap size={16} />,
    '180d': <Zap size={16} />,
    '365d': <Zap size={16} />,
    'all': <Infinity size={16} />,
  };

  const presets = FILTER_PRESETS
    .filter(p => 
      p.label.toLowerCase().includes(presetSearch.toLowerCase()) || 
      p.desc.toLowerCase().includes(presetSearch.toLowerCase())
    )
    .map(p => ({
      ...p,
      icon: presetIcons[p.id] || <Calendar size={16} />
    }));

  const handleApply = () => {
    if (validationError) return;
    
    // Always apply strictly to the current pageId
    setPageFilter(pageId, tempFilter);
    
    if (onClose) onClose();
  };

  const handleReset = () => {
    const resetFilter = { 
      type: 'preset', 
      preset: '7d', 
      mode: 'between', 
      startDate: '', 
      endDate: ''
    };
    setTempFilter(resetFilter);
    setPageFilter(pageId, resetFilter);
    setPresetSearch('');
  };

  return (
    <div className={`relative z-10 ${isCompact ? 'p-5' : 'p-10'}`}>
      {/* Decorative Background Gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className={`flex items-center justify-between ${isCompact ? 'mb-4' : 'mb-6'}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 ${isCompact ? 'w-7 h-7' : 'w-9 h-9'}`}>
              <Filter size={isCompact ? 14 : 18} />
            </div>
            <div>
              <h3 className={`${isCompact ? 'text-[10px]' : 'text-[13px]'} font-black text-[var(--text-primary)] uppercase tracking-wider`}>Page Date Filter</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Local Override</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset}
              className={`flex items-center gap-2 bg-rose-500/10 text-rose-500 font-black uppercase tracking-widest rounded-lg hover:bg-rose-500 hover:text-white transition-all group ${isCompact ? 'px-2 py-1 text-[8px]' : 'px-3 py-1.5 text-[9px]'}`}
            >
              <RotateCcw size={isCompact ? 10 : 12} className="group-hover:rotate-[-180deg] transition-transform duration-500" />
              Reset
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg text-slate-400 transition-all active:scale-90"
            >
              <X size={16} />
            </button>
          </div>
        </div>


        {/* Search & Sync Row (Global Sync Disabled) */}
        <div className={`flex items-stretch gap-4 ${isCompact ? 'mb-4' : 'mb-6'}`}>
          {/* Preset Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={isCompact ? 12 : 14} className="text-primary-500/60" />
            </div>
            <input
              type="text"
              placeholder="Search date presets..."
              value={presetSearch}
              onChange={(e) => setPresetSearch(e.target.value)}
              className={`block w-full h-full pl-10 pr-10 py-2.5 bg-slate-800/40 border border-white/5 rounded-xl ${isCompact ? 'text-[9px]' : 'text-[11px]'} font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all hover:bg-slate-800/60 hover:border-white/10 shadow-inner`}
            />
            {presetSearch && (
              <button
                onClick={() => setPresetSearch('')}
                className="absolute inset-y-0 right-3 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className={`flex items-stretch ${isCompact ? 'gap-6' : 'gap-8'}`}>
          {/* Left Side: Compact Grid Presets */}
          <div className="flex-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1 opacity-50">Quick Presets</p>
            <div className="grid grid-cols-5 gap-1.5">
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => setTempFilter({ ...tempFilter, type: 'preset', preset: p.id, mode: 'between', startDate: '', endDate: '' })}
                  className={`group flex items-center gap-2 text-left px-2.5 py-2 rounded-xl transition-all duration-300 ${tempFilter.type === 'preset' && tempFilter.preset === p.id ? 'bg-primary-500 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-primary-500/10 hover:text-primary-500'}`}
                >
                  <div className={`transition-colors ${tempFilter.type === 'preset' && tempFilter.preset === p.id ? 'text-white' : 'text-primary-500'}`}>
                    {p.icon}
                  </div>
                  <div className="min-w-0 flex-1 relative group/container">
                    <div className="flex items-center justify-between gap-1 w-full">
                      <p className="text-[10px] font-black uppercase tracking-tight leading-none truncate pr-1">{p.label}</p>
                      
                      {/* Info Icon inside preset button */}
                      <div className="group/presetinfo relative cursor-help flex-shrink-0">
                        <Info size={10} className={`transition-all ${tempFilter.type === 'preset' && tempFilter.preset === p.id ? 'text-white opacity-0 group-hover/container:opacity-90' : 'text-slate-400 opacity-0 group-hover/container:opacity-50 group-hover/presetinfo:!opacity-100 group-hover/presetinfo:text-primary-500'}`} />
                        
                        {/* The tooltip pops above the icon on hover */}
                        <div className="absolute right-0 bottom-[140%] w-max max-w-[180px] p-2 bg-slate-800 text-slate-200 text-[9px] font-bold tracking-widest uppercase rounded-lg shadow-xl border border-primary-500/20 opacity-0 group-hover/presetinfo:opacity-100 pointer-events-none transition-all z-30">
                          {getPresetDateRange(p.id)}
                        </div>
                      </div>
                    </div>
                    
                    <p className={`text-[7px] font-bold uppercase tracking-widest mt-0.5 opacity-60 ${tempFilter.type === 'preset' && tempFilter.preset === p.id ? 'text-white' : 'text-slate-400'}`}>
                      {p.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Optimized Custom */}
          <div className={`${isCompact ? 'w-[240px]' : 'w-[350px]'} border-l pl-6 border-[var(--border-color)] flex flex-col`}>
            <div className={`flex items-center justify-between ${isCompact ? 'mb-2' : 'mb-3'}`}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-50">Manual Adjustments</p>
              {tempFilter.type !== 'custom' && (
                <button 
                  onClick={() => setTempFilter({ ...tempFilter, type: 'custom', mode: 'between', startDate: '', endDate: '' })}
                  className="text-[9px] font-black text-primary-500 uppercase tracking-widest hover:underline transition-all"
                >
                  Open Config
                </button>
              )}
            </div>
            
            {tempFilter.type === 'custom' ? (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="p-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl flex gap-0.5">
                  {['after', 'before', 'between'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTempFilter({ ...tempFilter, type: 'custom', mode })}
                      className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${tempFilter.mode === mode ? 'bg-primary-500 text-white shadow-md' : 'text-slate-500 hover:text-primary-500'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500 pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity">
                      <Clock size={12} />
                    </div>
                    <input 
                      type="datetime-local"
                      value={tempFilter.startDate || ''}
                      onClick={(e) => {
                        try { if (e.target.showPicker) e.target.showPicker(); } catch (err) {}
                      }}
                      onChange={(e) => setTempFilter({ ...tempFilter, type: 'custom', startDate: e.target.value })}
                      className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-[11px] font-bold rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-primary-500/50 transition-all custom-date-input"
                      style={{ colorScheme: preferences.theme === 'dark' ? 'dark' : 'light' }}
                    />
                  </div>
                  
                  {tempFilter.mode === 'between' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative group"
                    >
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500 pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity">
                        <Clock size={12} />
                      </div>
                      <input 
                        type="datetime-local"
                        value={tempFilter.endDate || ''}
                        onClick={(e) => {
                          try { if (e.target.showPicker) e.target.showPicker(); } catch (err) {}
                        }}
                        onChange={(e) => setTempFilter({ ...tempFilter, type: 'custom', endDate: e.target.value })}
                        className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-[11px] font-bold rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-primary-500/50 transition-all custom-date-input"
                        style={{ colorScheme: preferences.theme === 'dark' ? 'dark' : 'light' }}
                      />
                    </motion.div>
                  )}
                </div>
                
                {validationError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 text-[8px] font-black text-rose-500 uppercase tracking-widest pl-2"
                  >
                    <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                    {validationError}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <button 
                onClick={() => setTempFilter({ ...tempFilter, type: 'custom', mode: 'between', startDate: '', endDate: '' })}
                className="w-full flex-1 flex flex-col items-center justify-center bg-primary-500/5 hover:bg-primary-500/10 border border-dashed border-primary-500/20 rounded-[1.5rem] transition-all group min-h-[100px]"
              >
                <Settings size={isCompact ? 16 : 20} className="text-primary-500 mb-1.5 group-hover:rotate-90 transition-transform duration-700" />
                <p className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} font-black uppercase tracking-[0.2em] text-primary-500`}>Configure Logic</p>
                {!isCompact && <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-60">Manual Date & Time Selection</p>}
              </button>
            )}
          </div>
        </div>

        <div className={`${isCompact ? 'mt-4 pt-4' : 'mt-6 pt-5'} border-t border-[var(--border-color)] flex items-center justify-end`}>
          <button 
            onClick={handleApply}
            disabled={!!validationError}
            className={`px-8 ${isCompact ? 'py-2' : 'py-2.5'} bg-gradient-to-r text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2 group ${validationError ? 'from-slate-600 to-slate-700 opacity-50 cursor-not-allowed grayscale' : 'from-primary-600 to-indigo-600 hover:shadow-[0_15px_30px_rgba(var(--primary-rgb),0.3)]'}`}
          >
            Apply Filter
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterOverlayContent;
