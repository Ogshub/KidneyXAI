import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const Input = ({
  label,
  error,
  helperText,
  id,
  type = 'text',
  className = '',
  required = false,
  ...props
}) => {
  const { isBrutalist } = useTheme();
  const inputId = id || props.name;

  const inputStyle = isBrutalist
    ? `w-full px-3.5 py-2.5 border-[3px] bg-[var(--bg-surface)] text-[var(--text-main)] text-sm font-semibold transition-colors duration-100 focus:outline-none focus:border-[var(--brutalist-red)] ${
        error
          ? 'border-[var(--brutalist-red)]'
          : 'border-[var(--border-subtle)] hover:border-[var(--brutalist-yellow)]'
      } ${className}`
    : `w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${
        error
          ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-950'
          : 'border-slate-300 dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-teal-100 dark:focus:ring-teal-950 hover:border-slate-400 dark:hover:border-slate-600'
      } ${className}`;

  const labelStyle = isBrutalist
    ? 'block text-xs font-black text-[var(--text-main)] mb-1 uppercase tracking-wider'
    : 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className={labelStyle}>
          {label} {required && <span className={isBrutalist ? 'text-[var(--brutalist-red)]' : 'text-rose-500'}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        required={required}
        className={inputStyle}
        {...props}
      />
      {error && <p className={`mt-1 text-xs font-medium ${isBrutalist ? 'text-[var(--brutalist-red)] uppercase font-bold' : 'text-rose-600 dark:text-rose-400'}`}>{error}</p>}
      {!error && helperText && <p className={`mt-1 text-xs ${isBrutalist ? 'text-[var(--text-muted)] font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>{helperText}</p>}
    </div>
  );
};

export const Select = ({
  label,
  error,
  helperText,
  id,
  options = [],
  children,
  className = '',
  required = false,
  ...props
}) => {
  const { isBrutalist } = useTheme();
  const selectId = id || props.name;

  const selectStyle = isBrutalist
    ? `w-full px-3.5 py-2.5 border-[3px] bg-[var(--bg-surface)] text-[var(--text-main)] text-sm font-semibold transition-colors duration-100 focus:outline-none focus:border-[var(--brutalist-red)] ${
        error
          ? 'border-[var(--brutalist-red)]'
          : 'border-[var(--border-subtle)] hover:border-[var(--brutalist-yellow)]'
      } ${className}`
    : `w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${
        error
          ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-950'
          : 'border-slate-300 dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-teal-100 dark:focus:ring-teal-950 hover:border-slate-400 dark:hover:border-slate-600'
      } ${className}`;

  const labelStyle = isBrutalist
    ? 'block text-xs font-black text-[var(--text-main)] mb-1 uppercase tracking-wider'
    : 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className={labelStyle}>
          {label} {required && <span className={isBrutalist ? 'text-[var(--brutalist-red)]' : 'text-rose-500'}>*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        className={selectStyle}
        {...props}
      >
        {children ||
          options.map((opt) => (
            <option key={opt.value} value={opt.value} className="dark:bg-slate-900 dark:text-slate-100">
              {opt.label}
            </option>
          ))}
      </select>
      {error && <p className={`mt-1 text-xs font-medium ${isBrutalist ? 'text-[var(--brutalist-red)] uppercase font-bold' : 'text-rose-600 dark:text-rose-400'}`}>{error}</p>}
      {!error && helperText && <p className={`mt-1 text-xs ${isBrutalist ? 'text-[var(--text-muted)] font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>{helperText}</p>}
    </div>
  );
};
