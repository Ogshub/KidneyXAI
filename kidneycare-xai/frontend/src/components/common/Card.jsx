import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  action,
  icon: Icon,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}>
      {(title || subtitle || action || Icon) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="text-base font-semibold text-slate-800">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
};
