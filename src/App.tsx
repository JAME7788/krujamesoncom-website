import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import Loading from './components/Loading';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPromptOverlay from './components/LoginPromptOverlay';

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
const PixelArtGame = React.lazy(() => import('./pages/games/PixelArtGame'));
const LogicGatesGame = React.lazy(() => import('./pages/games/LogicGatesGame'));
const FileOrganizerGame = React.lazy(() => import('./pages/games/FileOrganizerGame'));
const AlgorithmRunner3D = React.lazy(() => import('./pages/games/AlgorithmRunner3D'));
const CodingStudioGame = React.lazy(() => import('./pages/games/CodingStudioGame'));
const CircuitLabGame = React.lazy(() => import('./pages/games/CircuitLabGame'));
const CTBoardGame = React.lazy(() => import('./pages/games/CTBoardGame'));
const RobotMakerGame = React.lazy(() => import('./pages/games/RobotMakerGame'));
const TechSystemGame = React.lazy(() => import('./pages/games/TechSystemGame'));
const SearchSmartGame = React.lazy(() => import('./pages/games/SearchSmartGame'));
const MemoryMatch = React.lazy(() => import('./pages/games/MemoryMatch'));
const PatternGame = React.lazy(() => import('./pages/games/PatternGame'));
const CodingMaze = React.lazy(() => import('./pages/games/CodingMaze'));
const SnakeGame = React.lazy(() => import('./pages/games/SnakeGame'));
const BugCatcher = React.lazy(() => import('./pages/games/BugCatcher'));
const QuickAnswerComputing = React.lazy(() => import('./pages/games/QuickAnswerComputing'));
const DeviceMatch = React.lazy(() => import('./pages/games/DeviceMatch'));
const StepSort = React.lazy(() => import('./pages/games/StepSort'));
const SafetyGame = React.lazy(() => import('./pages/games/SafetyGame'));
const Tools = React.lazy(() => import('./pages/Tools'));
const ParentPortal = React.lazy(() => import('./pages/ParentPortal'));
const LiveQuizHost = React.lazy(() => import('./pages/LiveQuizHost'));
const LiveQuizPlay = React.lazy(() => import('./pages/LiveQuizPlay'));
const HomeworkStudent = React.lazy(() => import('./pages/HomeworkStudent'));
const VirtualClassroom = React.lazy(() => import('./pages/VirtualClassroom'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const localQaMode = import.meta.env.DEV
    && new URLSearchParams(window.location.search).has('qa');
  if (loading) return <Loading fullScreen text="กำลังตรวจสอบการเข้าใช้งาน..." />;
  if (!user && localQaMode) return <>{children}</>;
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
                  <Route path="/resources" element={<LoginPromptOverlay><Resources /></LoginPromptOverlay>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/report-card" element={<ProtectedRoute><ReportCard /></ProtectedRoute>} />
                  <Route path="/quiz/:id" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                  <Route path="/lesson/:id" element={<ProtectedRoute><Lesson /></ProtectedRoute>} />
                  <Route path="/games" element={<LoginPromptOverlay><Games /></LoginPromptOverlay>} />
                  <Route path="/games/mouse-practice" element={<LoginPromptOverlay><MousePractice /></LoginPromptOverlay>} />
                  <Route path="/games/keyboard-practice" element={<LoginPromptOverlay><KeyboardPractice /></LoginPromptOverlay>} />
                  <Route path="/games/algorithm-sorter" element={<LoginPromptOverlay><AlgorithmSorter /></LoginPromptOverlay>} />
                  <Route path="/games/binary" element={<LoginPromptOverlay><BinaryGame /></LoginPromptOverlay>} />
                  <Route path="/games/memory" element={<LoginPromptOverlay><MemoryMatch /></LoginPromptOverlay>} />
                  <Route path="/games/pattern" element={<LoginPromptOverlay><PatternGame /></LoginPromptOverlay>} />
                  <Route path="/games/coding-maze" element={<LoginPromptOverlay><CodingMaze /></LoginPromptOverlay>} />
                  <Route path="/games/snake" element={<LoginPromptOverlay><SnakeGame /></LoginPromptOverlay>} />
                  <Route path="/games/bug-catcher" element={<LoginPromptOverlay><BugCatcher /></LoginPromptOverlay>} />
                  <Route path="/games/quick-answer-computing" element={<LoginPromptOverlay><QuickAnswerComputing /></LoginPromptOverlay>} />
                  <Route path="/games/device-match" element={<LoginPromptOverlay><DeviceMatch /></LoginPromptOverlay>} />
                  <Route path="/games/step-sort" element={<LoginPromptOverlay><StepSort /></LoginPromptOverlay>} />
                  <Route path="/games/safety" element={<LoginPromptOverlay><SafetyGame /></LoginPromptOverlay>} />
                  <Route path="/games/pixel-art" element={<LoginPromptOverlay><PixelArtGame /></LoginPromptOverlay>} />
                  <Route path="/games/logic-gates" element={<LoginPromptOverlay><LogicGatesGame /></LoginPromptOverlay>} />
                  <Route path="/games/file-organizer" element={<LoginPromptOverlay><FileOrganizerGame /></LoginPromptOverlay>} />
                  <Route path="/games/algorithm-runner-3d" element={<LoginPromptOverlay><AlgorithmRunner3D /></LoginPromptOverlay>} />
                  <Route path="/games/coding-studio" element={<LoginPromptOverlay><CodingStudioGame /></LoginPromptOverlay>} />
                  <Route path="/games/circuit-lab" element={<LoginPromptOverlay><CircuitLabGame /></LoginPromptOverlay>} />
                  <Route path="/games/ct-board" element={<LoginPromptOverlay><CTBoardGame /></LoginPromptOverlay>} />
                  <Route path="/games/robot-maker" element={<LoginPromptOverlay><RobotMakerGame /></LoginPromptOverlay>} />
                  <Route path="/games/tech-system" element={<LoginPromptOverlay><TechSystemGame /></LoginPromptOverlay>} />
                  <Route path="/games/search-smart" element={<LoginPromptOverlay><SearchSmartGame /></LoginPromptOverlay>} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/parent/:studentId" element={<ParentPortal />} />
                  <Route path="/live" element={<LiveQuizPlay />} />
                  <Route path="/live/host" element={<LiveQuizHost />} />
                  <Route path="/homework" element={<ProtectedRoute><HomeworkStudent /></ProtectedRoute>} />
                  <Route path="/world" element={<ProtectedRoute><VirtualClassroom /></ProtectedRoute>} />
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
