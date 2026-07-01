import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi } from '../../api/misc.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SkeletonTable } from '../../components/common/Skeleton.jsx';

const TYPE_VARIANT = {
  low_attendance: 'absent',
  attendance_marked: 'present',
  password_changed: 'amber',
  otp_sent: 'neutral',
  account_created: 'present',
  general: 'neutral',
};

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    const { data } = await notificationApi.list({ limit: 50 });
    setNotifications(data.data.notifications);
    setIsLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleMarkAllRead() {
    await notificationApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-slate">Updates about your attendance and account</p>
        </div>
        <Button size="sm" variant="outline" icon={CheckCheck} onClick={handleMarkAllRead}>
          Mark all read
        </Button>
      </div>

      {isLoading ? (
        <SkeletonTable cols={1} rows={6} />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" message="New notifications will appear here." />
      ) : (
        <Card className="divide-y divide-ink/5">
          {notifications.map((n) => (
            <div key={n._id} className={`flex gap-3 px-5 py-4 ${n.isRead ? 'opacity-60' : ''}`}>
              <div className="flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge variant={TYPE_VARIANT[n.type] || 'neutral'}>{n.type.replace(/_/g, ' ')}</Badge>
                  {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-amber" />}
                </div>
                <p className="text-sm font-medium text-ink">{n.title}</p>
                <p className="mt-0.5 text-sm text-slate">{n.message}</p>
                <p className="mt-1.5 text-xs text-slate/70">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
