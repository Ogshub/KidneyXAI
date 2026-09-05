import React from 'react';

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
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        required={required}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${
          error
            ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-950'
            : 'border-slate-300 dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-teal-100 dark:focus:ring-teal-950 hover:border-slate-400 dark:hover:border-slate-600'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
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
  const selectId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${
          error
            ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-950'
            : 'border-slate-300 dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-teal-100 dark:focus:ring-teal-950 hover:border-slate-400 dark:hover:border-slate-600'
        } ${className}`}
        {...props}
      >
        {children ||
          options.map((opt) => (
            <option key={opt.value} value={opt.value} className="dark:bg-slate-900 dark:text-slate-100">
              {opt.label}
            </option>
          ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  );
};
