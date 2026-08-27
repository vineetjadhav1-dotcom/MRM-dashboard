import React from 'react';

export default function PlanedgePdfLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Planedge Star/Compass Logo */}
      <svg 
        viewBox="0 0 100 100" 
        className="w-7 h-7" 
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M 52,2 L 44,48 L 4,97 L 50,63 L 91,97 L 69,48 L 57,54 Z" 
          fill="#1d42ab" 
        />
      </svg>
      <span className="text-[9px] font-black tracking-wider text-slate-800 uppercase mt-0.5 leading-none">
        PLANEDGE
      </span>
      <span className="text-[7.5px] font-medium text-slate-500 italic tracking-tight leading-tight mt-0.5">
        We Build Better
      </span>
    </div>
  );
}
