export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen bg-paper">
      {/* Left: form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-[480px] lg:px-12 lg:flex-shrink-0">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink font-display text-base font-bold text-amber">
              A
            </div>
            <p className="font-display text-lg font-semibold text-ink">Attendance Register</p>
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>

      {/* Right: signature visual - the period-timeline motif */}
      <div className="relative hidden flex-1 overflow-hidden bg-ink lg:block">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />
        <div className="relative flex h-full flex-col items-center justify-center px-16">
          <p className="mb-8 font-display text-3xl font-medium leading-tight text-paper/90 text-center max-w-md">
            Every period, every subject, recorded independently.
          </p>
          <div className="flex items-end gap-2">
            {[
              { label: 'P1', h: 40, status: 'present' },
              { label: 'P2', h: 70, status: 'present' },
              { label: 'P3', h: 30, status: 'absent' },
              { label: 'P4', h: 55, status: 'present' },
              { label: 'P5', h: 20, status: 'break' },
              { label: 'P6', h: 65, status: 'present' },
              { label: 'P7', h: 45, status: 'late' },
            ].map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className="w-7 rounded-t-md transition-all"
                  style={{
                    height: `${p.h}px`,
                    background:
                      p.status === 'present'
                        ? '#5B8C5A'
                        : p.status === 'absent'
                          ? '#C75450'
                          : p.status === 'late'
                            ? '#E8A23D'
                            : 'rgba(255,255,255,0.15)',
                  }}
                />
                <span className="font-mono text-[10px] text-paper/50">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
