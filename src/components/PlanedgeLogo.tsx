import React from 'react';
import planedgeLogoImg from '@/src/assets/planedge-logo.png';

interface PlanedgeLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'login' | 'header';
}

export default function PlanedgeLogo({ className = '', size = 'md' }: PlanedgeLogoProps) {
  const containerSizes = {
    sm: 'h-7 w-auto max-h-7',
    md: 'h-8 sm:h-10 w-auto max-h-10',
    lg: 'h-12 sm:h-14 w-auto max-h-14',
    xl: 'h-16 sm:h-18 w-auto max-h-18',
    '2xl': 'h-20 sm:h-22 w-auto max-h-22',
    header: 'h-8 sm:h-9 w-auto max-h-9',
    login: 'h-20 sm:h-24 md:h-28 w-auto max-h-28'
  };

  return (
    <div 
      className={`bg-white border border-slate-200/90 rounded-xl shadow-xs flex items-center justify-center p-1 sm:p-1.5 select-none shrink-0 overflow-hidden ${className}`} 
      id="planedge-corporate-logo"
    >
      <img 
        src={planedgeLogoImg} 
        alt="Planedge - We Build Better" 
        className={`object-contain ${containerSizes[size]}`}
      />
    </div>
  );
}





