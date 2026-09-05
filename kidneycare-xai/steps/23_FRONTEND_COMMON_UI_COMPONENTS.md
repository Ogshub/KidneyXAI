# Step 23: Frontend — Reusable UI Components (Atomic Design System)

## 1. Overview & Objective
In this step, we build the reusable UI component library in `frontend/src/components/common/`:
1. `Button.jsx`: Flexible button supporting 5 variants (`primary`, `secondary`, `outline`, `danger`, `ghost`), 3 sizes (`sm`, `md`, `lg`), loading spinner states, and Lucide icon injection.
2. `Input.jsx` & `Select.jsx`: Accessible form controls with label indicators, required asterisks, error states with validation messages, and helper text.
3. `Card.jsx`: Glassmorphic container with title, subtitle, icon header slot, and custom action button slots.
4. `Feedback.jsx`: Clinical status badges (`Low`, `Moderate`, `High`, `Critical`), dismissable alerts, and loading spinners.
5. `index.js`: Re-export barrel for clean imports.

---

## 2. Prerequisites
- Completed `21_FRONTEND_VITE_SETUP_AND_TAILWIND_DESIGN_SYSTEM.md`

---

## 3. Why This Is Created Now
1. **DRY & Visual Consistency**: Instead of writing repeated Tailwind button and input classes across 11 pages, encapsulating them guarantees identical padding, hover states, border-radii, and focus rings everywhere.
2. **Accessible Form Handling**: `Input` links `htmlFor` with `id` and renders red error states (`border-rose-400 focus:ring-rose-200`) seamlessly when Spring Boot validation errors return.

---

## 4. Component Implementations

### 4.1 `Button.jsx`
Path: `frontend/src/components/common/Button.jsx`
```jsx
import React from 'react';

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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow focus:ring-teal-500 border border-transparent',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 border border-slate-200',
    outline: 'border border-slate-300 hover:border-teal-500 hover:text-teal-600 text-slate-700 bg-white focus:ring-teal-500',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500 border border-transparent',
    ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent',
  };

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
    </button>
  );
};
```

---

### 4.2 `Input.jsx`
Path: `frontend/src/components/common/Input.jsx`
```jsx
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
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        required={required}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100 hover:border-slate-400'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
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
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100 hover:border-slate-400'
        } ${className}`}
        {...props}
      >
        {children ||
          options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};
```

---

### 4.3 `Card.jsx`
Path: `frontend/src/components/common/Card.jsx`
```jsx
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
```

---

### 4.4 `Feedback.jsx`
Path: `frontend/src/components/common/Feedback.jsx`
```jsx
import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
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

export const Alert = ({ type = 'info', title, children, className = '', onClose }) => {
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
        <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 text-sm font-bold ml-2 p-0.5">
          ✕
        </button>
      )}
    </div>
  );
};

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${sizes[size]} border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin`}></div>
    </div>
  );
};
```

---

### 4.5 `src/components/common/index.js`
Path: `frontend/src/components/common/index.js`
```javascript
export * from './Button';
export * from './Input';
export * from './Card';
export * from './Feedback';
```

---

## 5. Verification
Compile check:
```powershell
cd kidneycare-xai/frontend
npm run lint
```

---

## 6. Next Step Dependency
Proceed to **`24_FRONTEND_LAYOUT_AND_ROUTE_GUARDS.md`** to construct the global application layout (`Navbar`, `Footer`, `Layout`) and security route guard (`ProtectedRoute`).
