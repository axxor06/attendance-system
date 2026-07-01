import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { attendanceApi } from '../../api/attendance.js';
import { reportApi } from '../../api/misc.js';
import { dashboardApi } from '../../api/misc.js';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SkeletonTable } from '../../components/common/Skeleton.jsx';
import SubjectAttendanceChart from '../../components/charts/SubjectAttendanceChart.jsx';

export default function StudentAttendancePage() {
  const [history, setHistory] = useState([]);
  const [subjectWise, setSubjectWise] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    Promise.all([
      attendanceApi.history({ limit: 100 }),
      dashboardApi.student(),
    ]).then(([histRes, dashRes]) => {
      setHistory(histRes.data.data.records);
      setSubjectWise(dashRes.data.data.subjectWise);
      setIsLoading(false);
    });
  }, []);

  async function handleDownload(format) {
    setDownloading(format);
    try {
      await reportApi.downloadStudentReport(undefined, format);
    } catch {
      toast.error('Could not generate report.');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">My Attendance</h1>
          <p className="mt-1 text-sm text-slate">Full history and subject-wise breakdown</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={FileText}
            isLoading={downloading === 'pdf'}
            onClick={() => handleDownload('pdf')}
          >
            PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={FileSpreadsheet}
            isLoading={downloading === 'excel'}
            onClick={() => handleDownload('excel')}
          >
            Excel
          </Button>
        </div>
      </div>

      {!isLoading && subjectWise.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 font-display text-base font-semibold text-ink">Subject-wise attendance</h2>
          <SubjectAttendanceChart data={subjectWise} />
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-ink/8 px-5 py-4">
          <h2 className="font-display text-base font-semibold text-ink">Full history</h2>
        </div>
        {isLoading ? (
          <SkeletonTable cols={4} />
        ) : history.length === 0 ? (
          <EmptyState title="No attendance records yet" message="Your attendance history will appear here once classes begin." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/8 bg-ink/3 text-left text-xs font-semibold uppercase tracking-wide text-slate">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {history.map((r) => (
                <tr key={r._id}>
                  <td className="px-5 py-3 text-ink/80">{format(new Date(r.date), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-3 font-medium text-ink">{r.subject?.name}</td>
                  <td className="px-5 py-3 text-ink/70">{r.periodName}</td>
                  <td className="px-5 py-3"><Badge variant={r.status}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
