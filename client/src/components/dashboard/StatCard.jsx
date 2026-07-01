import clsx from 'clsx';
import Card from '../common/Card.jsx';

const ACCENTS = {
  ink: 'bg-ink/8 text-ink',
  amber: 'bg-amber-light/40 text-amber',
  sage: 'bg-sage-light text-sage',
  clay: 'bg-clay-light text-clay',
};

export default function StatCard({ label, value, sublabel, icon: Icon, accent = 'ink', trend }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">{value}</p>
          {sublabel && <p className="mt-1 text-xs text-slate">{sublabel}</p>}
        </div>
        {Icon && (
          <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl', ACCENTS[accent])}>
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>
      {trend && (
        <p className={clsx('mt-3 text-xs font-medium', trend.direction === 'up' ? 'text-sage' : 'text-clay')}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.label}
        </p>
      )}
    </Card>
  );
}
