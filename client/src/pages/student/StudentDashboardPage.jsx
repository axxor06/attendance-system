import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';
import { dashboardApi } from '../../api/misc.js';
import StatCard from '../../components/dashboard/StatCard.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SkeletonCard } from '../../components/common/Skeleton.jsx';
import SubjectAttendanceChart from '../../components/charts/SubjectAttendanceChart.jsx';
import MonthlyAttendanceChart from '../../components/charts/MonthlyAttendanceChart.jsx';

function percentageAccent(pct) {
  if (pct < 75) return 'clay';
  if (pct < 85) return 'amber';
  return 'sage';
}

export default function StudentDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi.student().then(({ data: res }) => {
      setData(res.data);
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

  const { overall, subjectWise, monthly, recentHistory, lowAttendanceWarning } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">My Dashboard</h1>
        <p className="mt-1 text-sm text-slate">Your attendance overview</p>
      </div>

      {lowAttendanceWarning && (
        <div className="flex items-center gap-3 rounded-2xl bg-clay-light px-5 py-4">
          <AlertTriangle size={20} className="shrink-0 text-clay" />
          <p className="text-sm text-clay">
            Your overall attendance is below 75%. Please attend upcoming classes to avoid academic issues.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Overall Attendance"
          value={`${overall.percentage}%`}
          sublabel={`${overall.present}/${overall.total} classes attended`}
          icon={TrendingUp}
          accent={percentageAccent(overall.percentage)}
        />
        <StatCard label="Subjects" value={subjectWise.length} icon={BookOpen} accent="ink" />
        <StatCard
          label="Status"
          value={overall.percentage >= 75 ? 'Good standing' : 'Needs attention'}
          icon={AlertTriangle}
          accent={overall.percentage >= 75 ? 'sage' : 'clay'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-display text-base font-semibold text-ink">Subject-wise attendance</h2>
          {subjectWise.length === 0 ? (
            <EmptyState title="No attendance recorded yet" message="Your subject breakdown will appear here once classes begin." />
          ) : (
            <SubjectAttendanceChart data={subjectWise} />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-base font-semibold text-ink">Monthly trend</h2>
          {monthly.length === 0 ? (
            <EmptyState title="No monthly data yet" message="Trends appear after a few weeks of attendance." />
          ) : (
            <MonthlyAttendanceChart data={monthly} />
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-display text-base font-semibold text-ink">Recent history</h2>
        {recentHistory.length === 0 ? (
          <EmptyState title="No history yet" message="Your attendance records will show up here." />
        ) : (
          <div className="divide-y divide-ink/5">
            {recentHistory.map((r) => (
              <div key={r._id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{r.subject?.name}</p>
                  <p className="text-xs text-slate">{format(new Date(r.date), 'MMM d, yyyy')} · {r.periodName}</p>
                </div>
                <Badge variant={r.status}>{r.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
