import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * DatePickerInput — cross-browser DD/MM/YYYY date selector.
 *
 * Props:
 *   label      – field label string
 *   name       – used for the hidden input & label
 *   value      – ISO date string "YYYY-MM-DD"
 *   onChange   – synthetic change handler: receives a fake event { target: { name, value } }
 *   required   – boolean
 *   helperText – optional helper string beneath the field
 */
export const DatePickerInput = ({
  label,
  name,
  value = '',
  onChange,
  required = false,
  helperText,
}) => {
  const { isBrutalist } = useTheme();

  // Parse current ISO value
  const [year, month, day] = useMemo(() => {
    if (!value || !value.includes('-')) return ['', '', ''];
    const parts = value.split('-');
    return [parts[0] || '', parts[1] || '', parts[2] || ''];
  }, [value]);

  // Build year options: current year ± 5 years
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).reverse(),
    [currentYear]
  );

  // Dynamic days in month based on selected month & year
  const maxDays = useMemo(() => {
    if (!month) return 31;
    const y = year ? parseInt(year, 10) : currentYear;
    const m = parseInt(month, 10);
    return new Date(y, m, 0).getDate();
  }, [year, month, currentYear]);

  // Days 01 to maxDays
  const days = useMemo(
    () =>
      Array.from({ length: maxDays }, (_, i) =>
        String(i + 1).padStart(2, '0')
      ),
    [maxDays]
  );

  // Months 01-12 with numeric MM and short name
  const months = [
    { value: '01', label: '01 - Jan' },
    { value: '02', label: '02 - Feb' },
    { value: '03', label: '03 - Mar' },
    { value: '04', label: '04 - Apr' },
    { value: '05', label: '05 - May' },
    { value: '06', label: '06 - Jun' },
    { value: '07', label: '07 - Jul' },
    { value: '08', label: '08 - Aug' },
    { value: '09', label: '09 - Sep' },
    { value: '10', label: '10 - Oct' },
    { value: '11', label: '11 - Nov' },
    { value: '12', label: '12 - Dec' },
  ];

  /** Fire a synthetic onChange with the reconstructed YYYY-MM-DD value */
  const fireChange = (newDay, newMonth, newYear) => {
    if (!newDay || !newMonth || !newYear) return;
    // Cap day to valid max for that month/year
    const dInt = parseInt(newDay, 10);
    const mInt = parseInt(newMonth, 10);
    const yInt = parseInt(newYear, 10);
    const validMax = new Date(yInt, mInt, 0).getDate();
    const clampedDay = dInt > validMax ? String(validMax).padStart(2, '0') : newDay;

    const iso = `${newYear}-${newMonth}-${clampedDay}`;
    onChange({ target: { name, value: iso } });
  };

  const setToday = () => {
    const today = new Date();
    const y = String(today.getFullYear());
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onChange({ target: { name, value: `${y}-${m}-${d}` } });
  };

  // Shared select style
  const baseSelect = isBrutalist
    ? 'px-2 py-2 border-[3px] bg-[var(--bg-surface)] text-[var(--text-main)] text-sm font-semibold transition-colors duration-100 focus:outline-none focus:border-[var(--brutalist-red)] border-[var(--border-subtle)] hover:border-[var(--brutalist-yellow)] rounded-none cursor-pointer'
    : 'px-2 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-950 focus:border-teal-500 dark:focus:border-teal-400 hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer';

  const labelStyle = isBrutalist
    ? 'block text-xs font-black text-[var(--text-main)] mb-1 uppercase tracking-wider'
    : 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1';

  return (
    <div className="w-full">
      {label && (
        <label className={labelStyle}>
          {label}{' '}
          {required && (
            <span className={isBrutalist ? 'text-[var(--brutalist-red)]' : 'text-rose-500'}>
              *
            </span>
          )}
        </label>
      )}

      {/* DD / MM / YYYY dropdowns */}
      <div className="flex items-center gap-1.5">
        {/* Day */}
        <select
          value={day}
          onChange={(e) => fireChange(e.target.value, month, year)}
          required={required}
          aria-label="Day"
          className={`${baseSelect} w-[4.5rem]`}
        >
          <option value="">DD</option>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <span className="text-slate-500 dark:text-slate-400 font-bold text-sm select-none">/</span>

        {/* Month */}
        <select
          value={month}
          onChange={(e) => fireChange(day, e.target.value, year)}
          required={required}
          aria-label="Month"
          className={`${baseSelect} w-[5.5rem]`}
        >
          <option value="">MM</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <span className="text-slate-500 dark:text-slate-400 font-bold text-sm select-none">/</span>

        {/* Year */}
        <select
          value={year}
          onChange={(e) => fireChange(day, month, e.target.value)}
          required={required}
          aria-label="Year"
          className={`${baseSelect} min-w-[5.5rem]`}
        >
          <option value="">YYYY</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>

        {/* Quick Today button */}
        <button
          type="button"
          onClick={setToday}
          className={
            isBrutalist
              ? 'px-3 py-2 text-xs font-black uppercase tracking-wider border-2 border-black bg-[var(--brutalist-yellow)] text-black hover:opacity-90 active:translate-y-0.5 whitespace-nowrap'
              : 'px-3 py-2.5 text-xs font-semibold rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors whitespace-nowrap'
          }
          title="Set to today's date"
        >
          Today
        </button>
      </div>

      {helperText && (
        <p className={`mt-1 text-xs ${isBrutalist ? 'text-[var(--text-muted)] font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};
