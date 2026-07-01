import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';
import {
  LayoutDashboard, Building2, Layers, BookOpen, Users,
  CalendarClock, ClipboardCheck, FileBarChart, GraduationCap, Bell,
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

export default function MobileNav({ isOpen, onClose }) {
  const { user } = useAuth();
  const items = NAV[user?.role] || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-72 bg-white p-5 shadow-2xl animate-fade-in-up">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-display text-sm font-bold text-amber">
              A
            </div>
            <p className="font-display text-base font-semibold text-ink">Attendance</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink/50 hover:bg-ink/5">
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === `/${user?.role}`}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium',
                  isActive ? 'bg-ink text-paper' : 'text-ink/70 hover:bg-ink/5'
                )
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
