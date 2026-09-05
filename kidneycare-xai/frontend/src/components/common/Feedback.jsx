import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3.5 py-1.5 text-sm font-semibold',
  };

  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    low: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    moderate: 'bg-amber-50 text-amber-700 border border-amber-200',
    high: 'bg-orange-50 text-orange-700 border border-orange-200',
    critical: 'bg-rose-50 text-rose-700 border border-rose-200',
    teal: 'bg-teal-50 text-teal-700 border border-teal-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.default} ${className}`}>
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
  const styles = {
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-rose-50 border-rose-200 text-rose-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${styles[type]} ${className}`} role="alert">
      <div className="flex-1 text-sm">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100 text-sm font-bold ml-2 p-0.5"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${sizes[size]} border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin`}></div>
    </div>
  );
};
