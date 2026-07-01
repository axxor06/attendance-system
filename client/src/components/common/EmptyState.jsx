export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 bg-white/50 px-6 py-14 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-ink/40">
          <Icon size={22} />
        </div>
      )}
      <div>
        <p className="font-display text-base font-semibold text-ink">{title}</p>
        {message && <p className="mt-1 text-sm text-slate">{message}</p>}
      </div>
      {action}
    </div>
  );
}
