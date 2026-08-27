import React from 'react';
import planedgeLogoImg from '@/src/assets/planedge-logo.png';

interface PlanedgeLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function PlanedgeLogo({ className = '', size = 'md' }: PlanedgeLogoProps) {
  const containerSizes = {
    sm: 'h-8 w-auto max-h-8',
    md: 'h-10 w-auto max-h-10',
    lg: 'h-12 w-auto max-h-12',
    xl: 'h-16 w-auto max-h-16'
  };

  return (
    <div 
      className={`bg-white border border-slate-200/90 rounded-xl shadow-2xs flex items-center justify-center p-1 select-none shrink-0 overflow-hidden ${className}`} 
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





