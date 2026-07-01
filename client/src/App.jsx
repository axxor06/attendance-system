import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';

// Auth pages load eagerly - small, and the first thing every visitor sees.
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';

// Role-specific sections are lazy-loaded: a given person only ever uses one
// role's pages, so there's no reason to ship HOD/Faculty/Student bundles to
// everyone up front. Cuts the main bundle size considerably.
const HodDashboardPage = lazy(() => import('./pages/hod/HodDashboardPage.jsx'));
const DepartmentsPage = lazy(() => import('./pages/hod/DepartmentsPage.jsx'));
const ClassesPage = lazy(() => import('./pages/hod/ClassesPage.jsx'));
const SubjectsPage = lazy(() => import('./pages/hod/SubjectsPage.jsx'));
const PeoplePage = lazy(() => import('./pages/hod/PeoplePage.jsx'));
const PeriodsPage = lazy(() => import('./pages/hod/PeriodsPage.jsx'));
const HodReportsPage = lazy(() => import('./pages/hod/HodReportsPage.jsx'));

const FacultyDashboardPage = lazy(() => import('./pages/faculty/FacultyDashboardPage.jsx'));
const TakeAttendancePage = lazy(() => import('./pages/faculty/TakeAttendancePage.jsx'));
const FacultySubjectsPage = lazy(() => import('./pages/faculty/FacultySubjectsPage.jsx'));
const FacultyReportsPage = lazy(() => import('./pages/faculty/FacultyReportsPage.jsx'));

const StudentDashboardPage = lazy(() => import('./pages/student/StudentDashboardPage.jsx'));
const StudentAttendancePage = lazy(() => import('./pages/student/StudentAttendancePage.jsx'));
const StudentNotificationsPage = lazy(() => import('./pages/student/StudentNotificationsPage.jsx'));

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

function RouteFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: '#1B1B3A',
            color: '#FAF7F2',
            fontSize: '14px',
          },
        }}
      />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* HOD */}
          <Route
            path="/hod"
            element={
              <ProtectedRoute allowedRoles={['hod']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HodDashboardPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="people" element={<PeoplePage />} />
            <Route path="periods" element={<PeriodsPage />} />
            <Route path="reports" element={<HodReportsPage />} />
          </Route>

          {/* Faculty */}
          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<FacultyDashboardPage />} />
            <Route path="take-attendance" element={<TakeAttendancePage />} />
            <Route path="subjects" element={<FacultySubjectsPage />} />
            <Route path="reports" element={<FacultyReportsPage />} />
          </Route>

          {/* Student */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboardPage />} />
            <Route path="attendance" element={<StudentAttendancePage />} />
            <Route path="notifications" element={<StudentNotificationsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
