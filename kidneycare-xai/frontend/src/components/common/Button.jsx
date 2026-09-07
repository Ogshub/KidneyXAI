import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  icon: Icon,
  ...props
}) => {
  const { isBrutalist } = useTheme();

  const baseStyles = isBrutalist
    ? 'inline-flex items-center justify-center font-black uppercase tracking-wider transition-all duration-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-[3px]'
    : 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5 font-semibold',
  };

  const clinicalVariants = {
    primary: 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white shadow-sm hover:shadow focus:ring-teal-500 border border-transparent',
    secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-slate-400 border border-slate-200 dark:border-slate-700',
    outline: 'border border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50 focus:ring-teal-500',
    danger: 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white shadow-sm focus:ring-rose-500 border border-transparent',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-transparent',
  };

  const brutalistVariants = {
    primary: 'bg-[var(--brutalist-red)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)] text-white border-[var(--brutalist-black)]',
    secondary: 'bg-[var(--brutalist-yellow)] hover:bg-[var(--brutalist-red)] hover:text-white text-[var(--brutalist-black)] border-[var(--brutalist-black)]',
    outline: 'bg-transparent hover:bg-[var(--brutalist-black)] hover:text-[var(--brutalist-cream)] text-[var(--text-main)] border-[var(--border-subtle)]',
    danger: 'bg-[var(--brutalist-red)] hover:bg-[var(--brutalist-black)] text-white border-[var(--brutalist-black)]',
    ghost: 'bg-transparent hover:bg-[var(--brutalist-yellow)] text-[var(--text-main)] border-transparent hover:border-[var(--brutalist-black)]',
  };

  const variantStyles = isBrutalist ? brutalistVariants : clinicalVariants;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
      {isBrutalist && !loading && (
        <span className="ml-1 text-xs">↗</span>
      )}
    </button>
  );
};
