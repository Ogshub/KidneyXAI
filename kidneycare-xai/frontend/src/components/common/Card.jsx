import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const Card = ({
  children,
  title,
  subtitle,
  action,
  icon: Icon,
  className = '',
  bodyClassName = '',
}) => {
  const { isBrutalist } = useTheme();

  const cardBase = isBrutalist
    ? 'bg-[var(--bg-surface)] border-[3px] border-[var(--border-subtle)] shadow-none overflow-hidden'
    : 'bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden';

  const headerBase = isBrutalist
    ? 'px-6 py-4 border-b-[3px] border-[var(--border-subtle)] flex items-center justify-between'
    : 'px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between';

  const iconBox = isBrutalist
    ? 'w-10 h-10 bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] flex items-center justify-center shrink-0 border-[2px] border-[var(--brutalist-black)]'
    : 'w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-xs';

  const titleStyle = isBrutalist
    ? 'text-base font-black text-[var(--text-main)] uppercase tracking-wide'
    : 'text-base font-semibold text-slate-800 dark:text-slate-100';

  const subtitleStyle = isBrutalist
    ? 'text-xs text-[var(--text-muted)] mt-0.5 uppercase tracking-wider font-semibold'
    : 'text-xs text-slate-500 dark:text-slate-400 mt-0.5';

  return (
    <div className={`${cardBase} ${className}`}>
      {(title || subtitle || action || Icon) && (
        <div className={headerBase}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={iconBox}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className={titleStyle}>{title}</h3>}
              {subtitle && <p className={subtitleStyle}>{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
};
