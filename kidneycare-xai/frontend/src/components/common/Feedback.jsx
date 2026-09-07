import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const { isBrutalist } = useTheme();

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3.5 py-1.5 text-sm font-semibold',
  };

  const clinicalVariants = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
    low: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    moderate: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    high: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
    critical: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    teal: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
    blue: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  };

  const brutalistVariants = {
    default: 'bg-[var(--bg-surface)] text-[var(--text-main)] border-[2px] border-[var(--border-subtle)] uppercase font-black tracking-wider',
    low: 'bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] border-[2px] border-[var(--brutalist-black)] uppercase font-black tracking-wider',
    moderate: 'bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] border-[2px] border-[var(--brutalist-black)] uppercase font-black tracking-wider',
    high: 'bg-[var(--brutalist-red)] text-white border-[2px] border-[var(--brutalist-black)] uppercase font-black tracking-wider',
    critical: 'bg-[var(--brutalist-red)] text-white border-[2px] border-[var(--brutalist-black)] uppercase font-black tracking-wider',
    teal: 'bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] border-[2px] border-[var(--brutalist-black)] uppercase font-black tracking-wider',
    blue: 'bg-[var(--bg-surface)] text-[var(--text-main)] border-[2px] border-[var(--border-subtle)] uppercase font-black tracking-wider',
  };

  const variantStyles = isBrutalist ? brutalistVariants : clinicalVariants;

  return (
    <span className={`inline-flex items-center ${isBrutalist ? '' : 'rounded-full'} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.default} ${className}`}>
      {children}
    </span>
  );
};

export const Alert = ({
  type = 'info',
  title,
  children,
  className = '',
  onClose,
}) => {
  const { isBrutalist } = useTheme();

  const clinicalStyles = {
    info: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200',
    warning: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    danger: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200',
    success: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
  };

  const brutalistStyles = {
    info: 'bg-[var(--bg-surface)] border-[3px] border-[var(--border-subtle)] text-[var(--text-main)]',
    warning: 'bg-[var(--brutalist-yellow)] border-[3px] border-[var(--brutalist-black)] text-[var(--brutalist-black)]',
    danger: 'bg-[var(--brutalist-red)] border-[3px] border-[var(--brutalist-black)] text-white',
    success: 'bg-[var(--brutalist-yellow)] border-[3px] border-[var(--brutalist-black)] text-[var(--brutalist-black)]',
  };

  const styles = isBrutalist ? brutalistStyles : clinicalStyles;

  return (
    <div className={`p-4 ${isBrutalist ? '' : 'rounded-xl'} border flex items-start gap-3 ${styles[type]} ${className}`} role="alert">
      <div className="flex-1 text-sm">
        {title && <h4 className={`mb-0.5 ${isBrutalist ? 'font-black uppercase tracking-wider' : 'font-semibold'}`}>{title}</h4>}
        <div className={isBrutalist ? 'font-semibold' : ''}>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`text-current opacity-60 hover:opacity-100 text-sm font-bold ml-2 p-0.5 cursor-pointer ${isBrutalist ? 'text-lg' : ''}`}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export const Spinner = ({ size = 'md', className = '' }) => {
  const { isBrutalist } = useTheme();

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinnerStyle = isBrutalist
    ? `${sizes[size]} border-4 border-[var(--brutalist-yellow)] border-t-[var(--brutalist-red)] animate-spin`
    : `${sizes[size]} border-4 border-teal-200 dark:border-teal-900 border-t-teal-600 dark:border-t-teal-400 rounded-full animate-spin`;

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={spinnerStyle}></div>
    </div>
  );
};
