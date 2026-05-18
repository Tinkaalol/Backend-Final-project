import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/format';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leadingIcon, invalid, ...rest },
  ref,
) {
  return (
    <div className="relative w-full">
      {leadingIcon ? (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-400">
          {leadingIcon}
        </span>
      ) : null}
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border bg-white text-sm text-ink-900 placeholder:text-ink-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-500 focus-visible:ring-offset-1 disabled:bg-ink-50 disabled:text-ink-400',
          leadingIcon ? 'pl-9 pr-3' : 'px-3',
          invalid ? 'border-rose-400' : 'border-ink-200 hover:border-ink-300',
          className,
        )}
        {...rest}
      />
    </div>
  );
});

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
}

export function Label({ htmlFor, children, required }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium uppercase tracking-wide text-ink-500"
    >
      {children}
      {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
    </label>
  );
}

interface FieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function Field({ label, required, error, hint, htmlFor, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      {label ? <Label htmlFor={htmlFor} required={required}>{label}</Label> : null}
      {children}
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}
