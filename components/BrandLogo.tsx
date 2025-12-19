import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'monochrome' | 'color';
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'default' 
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  };

  const medworkColors = variant === 'monochrome' 
    ? 'text-slate-900' 
    : 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent';
  
  const digitalColors = variant === 'monochrome'
    ? 'text-slate-500'
    : 'text-slate-600';

  return (
    <div className={`inline-flex items-baseline gap-1 font-semibold tracking-tight ${sizeClasses[size]} ${className}`}>
      <span className={`font-bold ${medworkColors} transition-all duration-300 hover:scale-105`}>
        medwork
      </span>
      <span className={`font-light opacity-90 ${digitalColors} transition-all duration-300`}>
        .digital
      </span>
    </div>
  );
};

export default BrandLogo;

