import React from 'react';
import { Loader2 } from 'lucide-react';

const PremiumSpinner = ({ size = 24, className = "text-primary-500" }) => (
  <div className={`relative inline-flex items-center justify-center ${className}`}>
    <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-transparent animate-[spin_2s_linear_infinite] border-t-current border-l-current opacity-30 scale-125"></div>
    <div className="absolute inset-1 rounded-full border-b-2 border-r-2 border-transparent animate-[spin_3s_linear_infinite_reverse] border-b-current border-r-current opacity-40 scale-110"></div>
    <Loader2 size={size} className="animate-spin relative z-10" />
    <div className="absolute inset-0 bg-current opacity-20 blur-md rounded-full scale-150"></div>
  </div>
);

export default PremiumSpinner;
