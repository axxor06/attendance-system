import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Building2,
  Layers,
  BookOpen,
  Users,
  CalendarClock,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV = {
  hod: [
    { to: '/hod', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/hod/departments', label: 'Departments', icon: Building2 },
    { to: '/hod/classes', label: 'Classes & Semesters', icon: Layers },
    { to: '/hod/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/hod/people', label: 'Faculty & Students', icon: Users },
    { to: '/hod/periods', label: 'Period Timetable', icon: CalendarClock },
    { to: '/hod/reports', label: 'Reports', icon: FileBarChart },
  ],
  faculty: [
    { to: '/faculty', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/faculty/take-attendance', label: 'Take Attendance', icon: ClipboardCheck },
    { to: '/faculty/subjects', label: 'My Subjects', icon: BookOpen },
    { to: '/faculty/reports', label: 'Reports', icon: FileBarChart },
  ],
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/attendance', label: 'My Attendance', icon: GraduationCap },
    { to: '/student/notifications', label: 'Notifications', icon: Bell },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const items = NAV[user?.role] || [];

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-ink/8 bg-white/70 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink font-display text-base font-bold text-amber">
          A
        </div>
        <div>
          <p className="font-display text-base font-semibold leading-tight text-ink">Attendance</p>
          <p className="text-[11px] uppercase tracking-wide text-slate">Register</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === `/${user?.role}`}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-ink text-paper'
                  : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
              )
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink/8 px-6 py-4">
        <p className="text-[11px] text-slate">Signed in as</p>
        <p className="text-sm font-medium capitalize text-ink">{user?.role}</p>
      </div>
    </aside>
  );
}
