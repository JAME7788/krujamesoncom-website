import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import Loading from './components/Loading';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Code-splitting: โหลดเฉพาะหน้าที่เปิดใช้งาน → first paint เร็วขึ้น
const Home = React.lazy(() => import('./pages/Home'));
const Courses = React.lazy(() => import('./pages/Courses'));
const Curriculum = React.lazy(() => import('./pages/Curriculum'));
const IndicatorDetail = React.lazy(() => import('./pages/IndicatorDetail'));
const UnitDetail = React.lazy(() => import('./pages/UnitDetail'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Quiz = React.lazy(() => import('./pages/Quiz'));
const Login = React.lazy(() => import('./pages/Login'));
const Lesson = React.lazy(() => import('./pages/Lesson'));
const TeacherDashboard = React.lazy(() => import('./pages/TeacherDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Resources = React.lazy(() => import('./pages/Resources'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const ReportCard = React.lazy(() => import('./pages/ReportCard'));
const Games = React.lazy(() => import('./pages/games/Games'));
const MousePractice = React.lazy(() => import('./pages/games/MousePractice'));
const KeyboardPractice = React.lazy(() => import('./pages/games/KeyboardPractice'));
const AlgorithmSorter = React.lazy(() => import('./pages/games/AlgorithmSorter'));
const BinaryGame = React.lazy(() => import('./pages/games/BinaryGame'));
const MemoryMatch = React.lazy(() => import('./pages/games/MemoryMatch'));
const PatternGame = React.lazy(() => import('./pages/games/PatternGame'));
const CodingMaze = React.lazy(() => import('./pages/games/CodingMaze'));
const SnakeGame = React.lazy(() => import('./pages/games/SnakeGame'));
const BugCatcher = React.lazy(() => import('./pages/games/BugCatcher'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading fullScreen text="กำลังตรวจสอบการเข้าใช้งาน..." />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <ScrollToTop />
            <Layout>
              <Suspense fallback={<Loading text="กำลังโหลดหน้า..." />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
                  <Route path="/curriculum" element={<ProtectedRoute><Curriculum /></ProtectedRoute>} />
                  <Route path="/curriculum/:gradeId/:idx" element={<ProtectedRoute><IndicatorDetail /></ProtectedRoute>} />
                  <Route path="/curriculum/:gradeId/unit/:unitNo" element={<ProtectedRoute><UnitDetail /></ProtectedRoute>} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/scores" element={<TeacherDashboard />} />
                  <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/report-card" element={<ProtectedRoute><ReportCard /></ProtectedRoute>} />
                  <Route path="/quiz/:id" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                  <Route path="/lesson/:id" element={<ProtectedRoute><Lesson /></ProtectedRoute>} />
                  <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
                  <Route path="/games/mouse-practice" element={<ProtectedRoute><MousePractice /></ProtectedRoute>} />
                  <Route path="/games/keyboard-practice" element={<ProtectedRoute><KeyboardPractice /></ProtectedRoute>} />
                  <Route path="/games/algorithm-sorter" element={<ProtectedRoute><AlgorithmSorter /></ProtectedRoute>} />
                  <Route path="/games/binary" element={<ProtectedRoute><BinaryGame /></ProtectedRoute>} />
                  <Route path="/games/memory" element={<ProtectedRoute><MemoryMatch /></ProtectedRoute>} />
                  <Route path="/games/pattern" element={<ProtectedRoute><PatternGame /></ProtectedRoute>} />
                  <Route path="/games/coding-maze" element={<ProtectedRoute><CodingMaze /></ProtectedRoute>} />
                  <Route path="/games/snake" element={<ProtectedRoute><SnakeGame /></ProtectedRoute>} />
                  <Route path="/games/bug-catcher" element={<ProtectedRoute><BugCatcher /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
