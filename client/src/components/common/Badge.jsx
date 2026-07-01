import clsx from 'clsx';

const variants = {
  present: 'bg-sage-light text-sage',
  late: 'bg-amber-light/40 text-amber',
  absent: 'bg-clay-light text-clay',
  excused: 'bg-ink/8 text-ink/70',
  neutral: 'bg-ink/8 text-ink/60',
  amber: 'bg-amber-light/40 text-amber',
};

export default function Badge({ children, variant = 'neutral', className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize',
        variants[variant] || variants.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
