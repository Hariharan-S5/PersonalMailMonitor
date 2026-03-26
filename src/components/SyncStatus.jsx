import React, { useEffect, useState } from 'react';
import { useEmailStore } from '../store/useEmailStore';

const SyncStatus = ({ hideText = false }) => {
  const lastSyncTime = useEmailStore((state) => state.lastSyncTime);
  const [timeAgo, setTimeAgo] = useState('just now');

  useEffect(() => {
    const updateTime = () => {
      if (!lastSyncTime) {
        setTimeAgo('just now');
        return;
      }
      const diffMins = Math.floor((Date.now() - lastSyncTime) / 60000);
      if (diffMins < 1) setTimeAgo('just now');
      // show hours if more than 60 mins
      else if (diffMins >= 60) {
        const diffHours = Math.floor(diffMins / 60);
        setTimeAgo(`${diffHours} hrs ago`);
      }
      else setTimeAgo(`${diffMins} mins ago`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  return (
    <div className="flex items-center gap-3">
      {/* 
        Don't break the layout if flex wrap happens. 
        Usually placed right after a title or subtitle.
      */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-[var(--text-secondary)] font-bold whitespace-nowrap">
          Synchronized {timeAgo}
        </span>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 whitespace-nowrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live
        </div>
      </div>
    </div>
  );
};

export default SyncStatus;
