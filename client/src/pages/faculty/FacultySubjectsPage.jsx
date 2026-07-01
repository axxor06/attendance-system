import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { subjectApi } from '../../api/academicsExtra.js';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SkeletonCard } from '../../components/common/Skeleton.jsx';

export default function FacultySubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    subjectApi.mySubjects().then(({ data }) => {
      setSubjects(data.data.subjects);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">My Subjects</h1>
        <p className="mt-1 text-sm text-slate">Subjects assigned to you</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects assigned" message="Your HOD will assign subjects to you." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Card key={s._id} className="p-5">
              <p className="font-display text-base font-semibold text-ink">{s.name}</p>
              <p className="font-mono text-xs text-slate">{s.code}</p>
              <p className="mt-2 text-sm text-ink/70">{s.class?.name}</p>
              <Link to={`/faculty/take-attendance?subjectId=${s._id}`}>
                <Button size="sm" variant="outline" className="mt-4 w-full">Take attendance</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
