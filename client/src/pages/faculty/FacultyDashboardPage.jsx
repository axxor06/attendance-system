import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { BookOpen, ClipboardCheck, CalendarCheck } from 'lucide-react';
import { dashboardApi } from '../../api/misc.js';
import { attendanceApi } from '../../api/attendance.js';
import StatCard from '../../components/dashboard/StatCard.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Button from '../../components/common/Button.jsx';
import { SkeletonCard } from '../../components/common/Skeleton.jsx';

export default function FacultyDashboardPage() {
  const [data, setData] = useState(null);
  const [pending, setPending] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.faculty(), attendanceApi.pending()]).then(([dashRes, pendingRes]) => {
      setData(dashRes.data.data);
      setPending(pendingRes.data.data.pending);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const { assignedSubjectsCount, subjects, todayMarkedCount, recentAttendance } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-slate">Your subjects and today's attendance status</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Assigned Subjects" value={assignedSubjectsCount} icon={BookOpen} accent="ink" />
        <StatCard label="Marked Today" value={todayMarkedCount} icon={CalendarCheck} accent="sage" />
        <StatCard label="Attendance Pending" value={pending.length} icon={ClipboardCheck} accent="amber" />
      </div>

      {pending.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Pending for today</h2>
            <Badge variant="amber">{pending.length}</Badge>
          </div>
          <div className="flex flex-col gap-2">
            {pending.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-amber-light/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{p.subjectName}</p>
                  <p className="text-xs text-slate">{p.className} · {p.periodName}</p>
                </div>
                <Link to={`/faculty/take-attendance?subjectId=${p.subjectId}&periodOrder=${p.periodOrder}`}>
                  <Button size="sm" variant="amber">Mark now</Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-display text-base font-semibold text-ink">My subjects</h2>
          {subjects.length === 0 ? (
            <EmptyState icon={BookOpen} title="No subjects assigned yet" message="Your HOD will assign subjects to you." />
          ) : (
            <div className="flex flex-col gap-2.5">
              {subjects.map((s) => (
                <div key={s._id} className="flex items-center justify-between rounded-xl border border-ink/8 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{s.name}</p>
                    <p className="font-mono text-xs text-slate">{s.code} · {s.class?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-base font-semibold text-ink">Recent attendance marked</h2>
          {recentAttendance.length === 0 ? (
            <EmptyState title="No records yet" message="Attendance you mark will appear here." />
          ) : (
            <div className="divide-y divide-ink/5">
              {recentAttendance.map((r) => (
                <div key={r._id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{r.student?.name}</p>
                    <p className="truncate text-xs text-slate">{r.subject?.name} · {r.periodName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={r.status}>{r.status}</Badge>
                    <span className="text-xs text-slate">{formatDistanceToNow(new Date(r.markedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
