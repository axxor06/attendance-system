import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { subjectApi } from '../../api/academicsExtra.js';
import { classApi } from '../../api/academics.js';
import { reportApi } from '../../api/misc.js';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Select from '../../components/common/Select.jsx';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function HodReportsPage() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState('');
  const [downloadingSubject, setDownloadingSubject] = useState(null);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [downloadingMonthly, setDownloadingMonthly] = useState(null);

  useEffect(() => {
    Promise.all([subjectApi.list(), classApi.list()]).then(([subRes, classRes]) => {
      setSubjects(subRes.data.data.subjects);
      setClasses(classRes.data.data.classes);
    });
  }, []);

  async function handleSubjectDownload(format) {
    if (!selectedSubject) {
      toast.error('Select a subject first.');
      return;
    }
    setDownloadingSubject(format);
    try {
      await reportApi.downloadSubjectReport(selectedSubject, format);
    } catch {
      toast.error('Could not generate report.');
    } finally {
      setDownloadingSubject(null);
    }
  }

  async function handleMonthlyDownload(format) {
    if (!selectedClass) {
      toast.error('Select a class first.');
      return;
    }
    setDownloadingMonthly(format);
    try {
      await reportApi.downloadClassMonthlyReport(selectedClass, { format, year: selectedYear, month: selectedMonth });
    } catch {
      toast.error('Could not generate report.');
    } finally {
      setDownloadingMonthly(null);
    }
  }

  const years = Array.from({ length: 5 }).map((_, i) => new Date().getFullYear() - i);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Reports</h1>
        <p className="mt-1 text-sm text-slate">Export attendance reports as PDF or Excel</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-base font-semibold text-ink">Subject report</h2>
          <p className="mb-4 mt-1 text-sm text-slate">Every student's attendance for a single subject</p>

          <Select
            label="Subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.code}) - {s.class?.name}</option>
            ))}
          </Select>

          <div className="mt-4 flex gap-2.5">
            <Button
              variant="outline"
              icon={FileText}
              isLoading={downloadingSubject === 'pdf'}
              onClick={() => handleSubjectDownload('pdf')}
              className="flex-1"
            >
              PDF
            </Button>
            <Button
              variant="outline"
              icon={FileSpreadsheet}
              isLoading={downloadingSubject === 'excel'}
              onClick={() => handleSubjectDownload('excel')}
              className="flex-1"
            >
              Excel
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-base font-semibold text-ink">Monthly class report</h2>
          <p className="mb-4 mt-1 text-sm text-slate">Every student in a class for a given month</p>

          <Select
            label="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Select class</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Select label="Month" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </Select>
            <Select label="Year" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>

          <div className="mt-4 flex gap-2.5">
            <Button
              variant="outline"
              icon={FileText}
              isLoading={downloadingMonthly === 'pdf'}
              onClick={() => handleMonthlyDownload('pdf')}
              className="flex-1"
            >
              PDF
            </Button>
            <Button
              variant="outline"
              icon={FileSpreadsheet}
              isLoading={downloadingMonthly === 'excel'}
              onClick={() => handleMonthlyDownload('excel')}
              className="flex-1"
            >
              Excel
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
