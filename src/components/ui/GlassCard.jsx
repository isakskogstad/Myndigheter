import React from 'react';
import ds from '../../styles/designSystem';

/**
 * GlassCard Component
 * A glassmorphism-styled card with backdrop blur and subtle borders
 *
 * @param {Object} props
 * @param {'default' | 'elevated' | 'subtle'} props.variant - Card style variant
 * @param {'none' | 'lift' | 'glow'} props.hover - Hover effect type
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Card content
 */
const GlassCard = ({
  children,
  variant = 'default',
  hover = 'none',
  className = '',
  ...props
}) => {
  const baseClasses = ds.cn(
    'backdrop-blur-xl border transition-all',
    ds.radius.md
  );

  const variantClasses = {
    default: 'bg-white/70 dark:bg-slate-900/70 border-white/20 dark:border-slate-700/50 shadow-glass',
    elevated: 'bg-white/80 dark:bg-slate-900/80 border-white/30 dark:border-slate-600/50 shadow-elevated',
    subtle: 'bg-white/50 dark:bg-slate-900/50 border-white/10 dark:border-slate-800/50',
  };

  const hoverClasses = {
    none: '',
    lift: 'hover:shadow-elevated hover:-translate-y-1 hover:border-white/40 dark:hover:border-slate-600/60',
    glow: 'hover:shadow-[0_0_30px_rgba(14,165,233,0.15)] hover:border-primary-200/50 dark:hover:border-primary-700/50',
  };

  return (
    <div
      className={ds.cn(
        baseClasses,
        variantClasses[variant],
        hoverClasses[hover],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
