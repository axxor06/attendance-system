import clsx from 'clsx';

const variants = {
  primary: 'bg-ink text-paper hover:bg-ink-light active:scale-[0.98]',
  amber: 'bg-amber text-ink hover:bg-amber-light active:scale-[0.98]',
  outline: 'border border-ink/20 text-ink hover:bg-ink/5 active:scale-[0.98]',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'bg-clay text-white hover:bg-clay/90 active:scale-[0.98]',
  success: 'bg-sage text-white hover:bg-sage/90 active:scale-[0.98]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  isLoading = false,
  disabled,
  icon: Icon,
  ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        Icon && <Icon size={16} strokeWidth={2} />
      )}
      {children}
    </button>
  );
}
