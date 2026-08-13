import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  helperText,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1.5 w-full">
      <label
        htmlFor={selectId}
        className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
      >
        {label} {props.required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative rounded-xl shadow-2xs">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <select
          id={selectId}
          className={`w-full text-sm rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${
            icon ? 'pl-9' : 'px-3.5'
          } py-2.5 ${
            error
              ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
              : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
};
