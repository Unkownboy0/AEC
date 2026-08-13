import React from 'react';

export interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
  error?: string;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  helperText,
  error,
  className = '',
  id,
  rows = 3,
  ...props
}) => {
  const areaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1.5 w-full">
      <label
        htmlFor={areaId}
        className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
      >
        {label} {props.required && <span className="text-rose-500">*</span>}
      </label>
      <textarea
        id={areaId}
        rows={rows}
        className={`w-full text-sm rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all px-3.5 py-2.5 ${
          error
            ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
            : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
};
