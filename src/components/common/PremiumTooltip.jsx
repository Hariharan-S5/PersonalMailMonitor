import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PremiumTooltip = ({ text, children, position = 'bottom' }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center justify-center" 
         onMouseEnter={() => setShow(true)} 
         onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: position === 'bottom' ? -5 : 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'bottom' ? -5 : 5, scale: 0.95 }}
            className={`absolute ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} px-2.5 py-1 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-[100] pointer-events-none whitespace-nowrap`}
          >
            <p className="text-[9px] font-bold text-white leading-none">
              {text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumTooltip;
