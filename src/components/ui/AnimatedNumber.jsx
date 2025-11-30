import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import ds from '../../styles/designSystem';

/**
 * AnimatedNumber Component
 * Smoothly animates number changes with spring physics
 *
 * @param {Object} props
 * @param {number} props.value - The target number to display
 * @param {string} props.format - Format type: 'number', 'percent', 'currency'
 * @param {number} props.duration - Animation duration in seconds
 * @param {string} props.locale - Locale for number formatting
 * @param {boolean} props.animated - Whether to animate (default true)
 */
const AnimatedNumber = ({
  value,
  format = 'number',
  duration = 1,
  locale = 'sv-SE',
  animated = true,
  className = '',
}) => {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => {
    const rounded = Math.round(current);

    if (format === 'percent') {
      return `${rounded.toLocaleString(locale)}%`;
    }
    if (format === 'currency') {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'SEK',
        maximumFractionDigits: 0,
      }).format(rounded);
    }
    return rounded.toLocaleString(locale);
  });

  useEffect(() => {
    if (animated) {
      spring.set(value);
    }
  }, [value, spring, animated]);

  if (!animated) {
    const formatted = format === 'percent'
      ? `${value.toLocaleString(locale)}%`
      : format === 'currency'
        ? new Intl.NumberFormat(locale, { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(value)
        : value.toLocaleString(locale);

    return <span className={className}>{formatted}</span>;
  }

  return (
    <motion.span className={ds.cn(ds.typography.numbers.tabular, className)}>
      {display}
    </motion.span>
  );
};

/**
 * StatCard with AnimatedNumber built-in
 */
export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  format = 'number',
  className = '',
}) => {
  return (
    <div className={ds.cn(
      'p-6 bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-100 dark:border-slate-800',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            <AnimatedNumber value={value} format={format} />
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
            <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={ds.cn(
          'mt-4 flex items-center text-sm font-medium',
          trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        )}>
          <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
          <span className="ml-2 text-slate-500 dark:text-slate-400">från förra året</span>
        </div>
      )}
    </div>
  );
};

export default AnimatedNumber;
