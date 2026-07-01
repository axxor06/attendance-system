export default function SearchResultsPanel({ results, onClose }) {
  if (!results) {
    return (
      <div className="absolute left-0 top-12 z-40 w-full rounded-2xl border border-ink/10 bg-white p-4 text-sm text-slate shadow-xl">
        Searching...
      </div>
    );
  }

  const { students = [], faculty = [], departments = [], subjects = [] } = results;
  const hasAny = students.length || faculty.length || departments.length || subjects.length;

  return (
    <div className="absolute left-0 top-12 z-40 max-h-96 w-full overflow-y-auto rounded-2xl border border-ink/10 bg-white shadow-xl animate-fade-in-up">
      {!hasAny && <div className="px-4 py-6 text-center text-sm text-slate">No matches found.</div>}

      {students.length > 0 && (
        <ResultSection title="Students">
          {students.map((s) => (
            <ResultRow
              key={s._id}
              title={s.name}
              subtitle={`${s.registerNumber || ''} ${s.class?.name ? `· ${s.class.name}` : ''}`}
              onClick={onClose}
            />
          ))}
        </ResultSection>
      )}

      {faculty.length > 0 && (
        <ResultSection title="Faculty">
          {faculty.map((f) => (
            <ResultRow
              key={f._id}
              title={f.name}
              subtitle={`${f.employeeId || ''} ${f.department?.name ? `· ${f.department.name}` : ''}`}
              onClick={onClose}
            />
          ))}
        </ResultSection>
      )}

      {departments.length > 0 && (
        <ResultSection title="Departments">
          {departments.map((d) => (
            <ResultRow key={d._id} title={d.name} subtitle={d.code} onClick={onClose} />
          ))}
        </ResultSection>
      )}

      {subjects.length > 0 && (
        <ResultSection title="Subjects">
          {subjects.map((s) => (
            <ResultRow
              key={s._id}
              title={s.name}
              subtitle={`${s.code} ${s.class?.name ? `· ${s.class.name}` : ''}`}
              onClick={onClose}
            />
          ))}
        </ResultSection>
      )}
    </div>
  );
}

function ResultSection({ title, children }) {
  return (
    <div className="border-b border-ink/5 py-2 last:border-0">
      <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate">{title}</p>
      {children}
    </div>
  );
}

function ResultRow({ title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-4 py-2 text-left hover:bg-ink/5"
    >
      <p className="text-sm font-medium text-ink">{title}</p>
      {subtitle && <p className="text-xs text-slate">{subtitle}</p>}
    </button>
  );
}
