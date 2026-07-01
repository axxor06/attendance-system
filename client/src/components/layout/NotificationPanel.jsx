import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { notificationApi } from '../../api/misc.js';
import Badge from '../common/Badge.jsx';

const TYPE_VARIANT = {
  low_attendance: 'absent',
  attendance_marked: 'present',
  password_changed: 'amber',
  otp_sent: 'neutral',
  account_created: 'present',
  general: 'neutral',
};

export default function NotificationPanel({ onClose, onCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    notificationApi.list({ limit: 10 }).then(({ data }) => {
      setNotifications(data.data.notifications);
      setIsLoading(false);
    });
  }, []);

  async function handleMarkAllRead() {
    await notificationApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onCountChange(0);
  }

  async function handleMarkRead(id) {
    await notificationApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    onCountChange((c) => Math.max(0, c - 1));
  }

  return (
    <div className="absolute right-0 top-12 z-40 w-80 rounded-2xl border border-ink/10 bg-white shadow-xl animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3">
        <p className="font-display text-sm font-semibold text-ink">Notifications</p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-xs font-medium text-ink/60 hover:text-ink"
          >
            <CheckCheck size={13} /> Mark all read
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink"
            aria-label="Close notifications"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-6 text-center text-sm text-slate">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Bell size={22} className="text-ink/20" />
            <p className="text-sm text-slate">You're all caught up.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`flex gap-2.5 border-b border-ink/5 px-4 py-3 last:border-0 ${
                n.isRead ? 'opacity-60' : ''
              }`}
            >
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant={TYPE_VARIANT[n.type] || 'neutral'}>{n.type.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="text-sm font-medium text-ink">{n.title}</p>
                <p className="mt-0.5 text-xs text-slate">{n.message}</p>
                <p className="mt-1 text-[11px] text-slate/70">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n._id)}
                  className="self-start rounded-lg p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink"
                  aria-label="Mark as read"
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
