import clsx from 'clsx';
import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, hint, className, id, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink/80">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={clsx(
          'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate/60',
          'transition-colors focus:border-ink/40 focus:outline-none',
          error ? 'border-clay' : 'border-ink/15',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-clay">{error}</span>}
      {hint && !error && <span className="text-xs text-slate">{hint}</span>}
    </div>
  );
});

export default Input;
