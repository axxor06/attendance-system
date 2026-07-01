import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Check, X, Clock3, FileQuestion, Save } from 'lucide-react';
import { subjectApi } from '../../api/academicsExtra.js';
import { periodApi } from '../../api/academicsExtra.js';
import { attendanceApi } from '../../api/attendance.js';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Select from '../../components/common/Select.jsx';
import Input from '../../components/common/Input.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SkeletonTable } from '../../components/common/Skeleton.jsx';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', icon: Check, activeClass: 'bg-sage text-white' },
  { value: 'absent', label: 'Absent', icon: X, activeClass: 'bg-clay text-white' },
  { value: 'late', label: 'Late', icon: Clock3, activeClass: 'bg-amber text-ink' },
  { value: 'excused', label: 'Excused', icon: FileQuestion, activeClass: 'bg-ink/70 text-white' },
];

function todayIso() {
  return format(new Date(), 'yyyy-MM-dd');
}

function getDayName(dateStr) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(dateStr).getDay()];
}

export default function TakeAttendancePage() {
  const [searchParams] = useSearchParams();

  const [subjects, setSubjects] = useState([]);
  const [dayPeriods, setDayPeriods] = useState([]);
  const [date, setDate] = useState(todayIso());
  const [subjectId, setSubjectId] = useState(searchParams.get('subjectId') || '');
  const [periodOrder, setPeriodOrder] = useState(searchParams.get('periodOrder') || '');

  const [roster, setRoster] = useState(null);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    subjectApi.mySubjects().then(({ data }) => setSubjects(data.data.subjects));
  }, []);

  useEffect(() => {
    if (!date) return;
    const dayName = getDayName(date);
    periodApi.getByDay(dayName)
      .then(({ data }) => setDayPeriods(data.data.template.periods.filter((p) => p.kind === 'class')))
      .catch(() => setDayPeriods([]));
  }, [date]);

  const loadRoster = useCallback(async () => {
    if (!subjectId || !date || !periodOrder) return;
    setIsLoadingRoster(true);
    setRoster(null);
    try {
      const { data } = await attendanceApi.sessionRoster({ subjectId, date, periodOrder });
      setRoster(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load session roster');
    } finally {
      setIsLoadingRoster(false);
    }
  }, [subjectId, date, periodOrder]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  function setStatus(studentId, status) {
    setRoster((prev) => ({
      ...prev,
      roster: prev.roster.map((r) => (r.studentId === studentId ? { ...r, status } : r)),
    }));
  }

  function markAllPresent() {
    setRoster((prev) => ({
      ...prev,
      roster: prev.roster.map((r) => ({ ...r, status: 'present' })),
    }));
  }

  async function handleSave() {
    const entries = roster.roster
      .filter((r) => r.status)
      .map((r) => ({ studentId: r.studentId, status: r.status, remarks: r.remarks }));

    if (entries.length === 0) {
      toast.error('Mark at least one student before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await attendanceApi.mark({ subjectId, date, periodOrder: Number(periodOrder), entries });
      toast.success(`Attendance saved for ${entries.length} student(s)`);
      loadRoster();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save attendance');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Take Attendance</h1>
        <p className="mt-1 text-sm text-slate">Mark attendance period-wise, independent for each subject</p>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayIso()} />
          <Select label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name} - {s.class?.name}</option>
            ))}
          </Select>
          <Select label="Period" value={periodOrder} onChange={(e) => setPeriodOrder(e.target.value)} disabled={dayPeriods.length === 0}>
            <option value="">{dayPeriods.length === 0 ? 'No periods configured' : 'Select period'}</option>
            {dayPeriods.map((p) => (
              <option key={p.order} value={p.order}>{p.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      {isLoadingRoster ? (
        <SkeletonTable cols={2} rows={6} />
      ) : !roster ? (
        <EmptyState
          title="Select a subject, date, and period"
          message="The student roster for that session will appear here."
        />
      ) : roster.roster.length === 0 ? (
        <EmptyState title="No students in this class" message="This class has no students assigned yet." />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
            <div>
              <p className="font-display text-base font-semibold text-ink">{roster.subject.name}</p>
              <p className="text-xs text-slate">{roster.periodName} · {format(new Date(date), 'EEEE, MMM d')} · {roster.roster.length} students</p>
            </div>
            <Button size="sm" variant="outline" onClick={markAllPresent}>Mark all present</Button>
          </div>

          <div className="divide-y divide-ink/5">
            {roster.roster.map((r) => (
              <div key={r.studentId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{r.name}</p>
                  <p className="text-xs text-slate">{r.email}</p>
                </div>
                <div className="flex gap-1.5">
                  {STATUS_OPTIONS.map(({ value, label, icon: Icon, activeClass }) => (
                    <button
                      key={value}
                      onClick={() => setStatus(r.studentId, value)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        r.status === value ? activeClass : 'bg-ink/5 text-ink/50 hover:bg-ink/10'
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t border-ink/8 px-5 py-4">
            <Button icon={Save} onClick={handleSave} isLoading={isSaving}>Save attendance</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
