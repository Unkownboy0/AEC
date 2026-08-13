import React from 'react';
import { clsx } from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   TEXTAREA — CampusOS Design System Primitive
   
   Multi-line text input with label, helper text, error state.
   ═══════════════════════════════════════════════════════════════════ */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, id, required, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = error ? `${textareaId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-caption font-medium text-foreground">
            {label}
            {required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={clsx(
            'w-full min-h-[80px] px-3 py-2 bg-surface border text-body font-normal text-foreground',
            'placeholder:text-muted-foreground rounded resize-y',
            'transition-colors duration-fast',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted',
            error ? 'border-danger focus:ring-danger' : 'border-border hover:border-border-strong',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-caption-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-caption-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
