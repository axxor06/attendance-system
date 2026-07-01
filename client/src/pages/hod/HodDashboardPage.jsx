import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Users, GraduationCap, CalendarCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '../../api/misc.js';
import StatCard from '../../components/dashboard/StatCard.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SkeletonCard } from '../../components/common/Skeleton.jsx';
import AttendanceTrendChart from '../../components/charts/AttendanceTrendChart.jsx';

export default function HodDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi.hod().then(({ data: res }) => {
      setData(res.data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const { totals, todayAttendance, monthlyAttendance, lowAttendanceStudents, lowAttendanceCount, recentActivity, attendanceTrend } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-slate">An overview of attendance across the institution</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={totals.totalStudents} icon={GraduationCap} accent="ink" />
        <StatCard label="Total Faculty" value={totals.totalFaculty} icon={Users} accent="amber" />
        <StatCard
          label="Today's Attendance"
          value={`${todayAttendance.percentage}%`}
          sublabel={`${todayAttendance.present}/${todayAttendance.total} marked present`}
          icon={CalendarCheck}
          accent="sage"
        />
        <StatCard
          label="Monthly Attendance"
          value={`${monthlyAttendance.percentage}%`}
          sublabel={`${monthlyAttendance.present}/${monthlyAttendance.total} this month`}
          icon={TrendingUp}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-display text-base font-semibold text-ink">Attendance trend</h2>
          <p className="mb-2 text-xs text-slate">Last 14 days, institution-wide</p>
          {attendanceTrend.length === 0 ? (
            <EmptyState title="No attendance data yet" message="Trends will appear once faculty start marking attendance." />
          ) : (
            <AttendanceTrendChart data={attendanceTrend} />
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Low attendance</h2>
            <Badge variant="absent">{lowAttendanceCount}</Badge>
          </div>
          {lowAttendanceStudents.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="All clear" message="No students below the threshold." />
          ) : (
            <div className="flex flex-col gap-3">
              {lowAttendanceStudents.map((s) => (
                <div key={s.studentId} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                    <p className="truncate text-xs text-slate">{s.registerNumber} {s.className ? `· ${s.className}` : ''}</p>
                  </div>
                  <Badge variant="absent" className="shrink-0">{s.percentage}%</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-display text-base font-semibold text-ink">Recent activity</h2>
        {recentActivity.length === 0 ? (
          <EmptyState title="No activity yet" message="Actions taken across the system will show up here." />
        ) : (
          <div className="divide-y divide-ink/5">
            {recentActivity.map((a) => (
              <div key={a._id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">
                    <span className="font-medium">{a.actor?.name || 'System'}</span> {a.description}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate">
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
