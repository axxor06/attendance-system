import clsx from 'clsx';

export default function Card({ children, className, glass = false, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border shadow-sm transition-shadow',
        glass
          ? 'bg-white/60 backdrop-blur-xl border-white/40 shadow-lg'
          : 'bg-white border-ink/8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
