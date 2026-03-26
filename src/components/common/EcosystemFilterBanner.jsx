import React, { useState } from 'react';
import { Filter, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmailStore } from '../../store/useEmailStore';
import FilterOverlayContent from './FilterOverlayContent';
import { formatFilterDate, getPresetDateRange } from '../../utils/dateUtils';
import { FILTER_PRESETS } from '../../constants/filterPresets';

/**
 * Shows a banner when the Ecosystem Range filter is active for a specific page.
 * @param {string} pageId - The NAV_ITEMS id of the current page.
 */
const EcosystemFilterBanner = ({ pageId }) => {
  const pageFilters = useEmailStore((s) => s.pageFilters);
  const setPageFilter = useEmailStore((s) => s.setPageFilter);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Always use the page-specific filter
  const activeFilter = pageFilters[pageId] || { 
    type: 'preset', 
    preset: '7d',
    mode: 'between',
    startDate: '',
    endDate: ''
  };

  // Determine friendly label
  const formatDate = formatFilterDate;

  let label = '';
  if (activeFilter.type === 'preset') {
    label = FILTER_PRESETS.find(p => p.id === activeFilter.preset)?.label || 'Custom Range';
  } else {
    const { mode, startDate, endDate } = activeFilter;
    if (mode === 'between' && startDate && endDate) label = `${formatDate(startDate)} → ${formatDate(endDate)}`;
    else if (mode === 'after' && startDate) label = `Since ${formatDate(startDate)}`;
    else if (mode === 'before' && startDate) label = `Before ${formatDate(startDate)}`;
    else label = 'Custom Active';
  }

  const handleClear = () => {
    setPageFilter(pageId, {
      type: 'preset',
      preset: '7d',
      mode: 'between',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <div className="group relative z-40 mb-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900 px-5 py-3 shadow-xl ring-1 ring-white/5 animate-fade-in">
      {/* Subtle animated gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/10 via-transparent to-purple-500/10 opacity-30 transition-opacity duration-700 group-hover:opacity-70" />

      {/* Glossy top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Icon with container */}
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-primary-500/20 to-purple-500/20 shadow-lg transition-transform duration-500 group-hover:scale-105">
        <Filter size={16} className="text-white drop-shadow-md" />
        {/* Active pulsing dot */}
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full border border-slate-900 bg-primary-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
      </div>

      <div className="z-10 flex flex-col">
        <span className="mb-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Active Page Filter
        </span>
        <div className="flex items-center gap-2 group/bannerinfo relative">
          <span className="text-[13px] font-bold tracking-wide text-white">
            {label}
          </span>
          {activeFilter.type === 'preset' && (
            <div className="relative flex-shrink-0 cursor-help">
              <Info size={12} className="text-slate-400 opacity-50 group-hover/bannerinfo:opacity-100 group-hover/bannerinfo:text-primary-500 transition-all" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[140%] w-max max-w-[200px] p-2 bg-slate-800 text-slate-200 text-[9px] font-bold tracking-widest uppercase rounded-lg shadow-xl border border-primary-500/20 opacity-0 group-hover/bannerinfo:opacity-100 pointer-events-none transition-all z-50">
                {getPresetDateRange(activeFilter.preset)}
              </div>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        className={`z-10 ml-auto flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-300 backdrop-blur-md ${isPopoverOpen ? 'bg-primary-500 text-white border-primary-400 shadow-lg' : 'border-white/10 bg-white/5 text-slate-400 hover:border-primary-500/40 hover:bg-primary-500/20 hover:text-white'}`}
        title="Configure Filter Logic"
      >
        <Filter size={16} />
      </button>

      {/* Contextual Popover */}
      <AnimatePresence>
        {isPopoverOpen && (
          <>
            {/* Backdrop for closing */}
            <div 
              className="fixed inset-0 z-40 bg-transparent" 
              onClick={() => setIsPopoverOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
              className="absolute right-0 top-full z-50 mt-4 w-[1150px] origin-top-right overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <FilterOverlayContent 
                onClose={() => setIsPopoverOpen(false)} 
                hideContext={pageId} 
                isCompact={true}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EcosystemFilterBanner;
