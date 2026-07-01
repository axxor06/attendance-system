import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { subjectApi } from '../../api/academicsExtra.js';
import { reportApi } from '../../api/misc.js';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Select from '../../components/common/Select.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export default function FacultyReportsPage() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    subjectApi.mySubjects().then(({ data }) => setSubjects(data.data.subjects));
  }, []);

  async function handleDownload(format) {
    if (!selectedSubject) {
      toast.error('Select a subject first.');
      return;
    }
    setDownloading(format);
    try {
      await reportApi.downloadSubjectReport(selectedSubject, format);
    } catch {
      toast.error('Could not generate report.');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Reports</h1>
        <p className="mt-1 text-sm text-slate">Export attendance reports for your subjects</p>
      </div>

      {subjects.length === 0 ? (
        <EmptyState title="No subjects assigned yet" message="Reports will be available once you're assigned subjects." />
      ) : (
        <Card className="max-w-md p-5">
          <Select
            label="Subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name} - {s.class?.name}</option>
            ))}
          </Select>

          <div className="mt-4 flex gap-2.5">
            <Button
              variant="outline"
              icon={FileText}
              isLoading={downloading === 'pdf'}
              onClick={() => handleDownload('pdf')}
              className="flex-1"
            >
              PDF
            </Button>
            <Button
              variant="outline"
              icon={FileSpreadsheet}
              isLoading={downloading === 'excel'}
              onClick={() => handleDownload('excel')}
              className="flex-1"
            >
              Excel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
