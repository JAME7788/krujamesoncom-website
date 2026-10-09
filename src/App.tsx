import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import Loading from './components/Loading';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPromptOverlay from './components/LoginPromptOverlay';
import AdminGate from './components/AdminGate';
import { gamesCatalog } from './data/gamesCatalog';

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
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const ResearchPage = React.lazy(() => import('./pages/ResearchPage'));
const Resources = React.lazy(() => import('./pages/Resources'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const ReportCard = React.lazy(() => import('./pages/ReportCard'));
const Games = React.lazy(() => import('./pages/games/Games'));
const MousePractice = React.lazy(() => import('./pages/games/MousePractice'));
const KeyboardPractice = React.lazy(() => import('./pages/games/KeyboardPractice'));
const AlgorithmSorter = React.lazy(() => import('./pages/games/AlgorithmSorter'));
const BinaryGame = React.lazy(() => import('./pages/games/BinaryGame'));
const PixelArtGame = React.lazy(() => import('./pages/games/PixelArtGame'));
const ColorCodePixelGame = React.lazy(() => import('./pages/games/ColorCodePixelGame'));
const LogicGatesGame = React.lazy(() => import('./pages/games/LogicGatesGame'));
const FileOrganizerGame = React.lazy(() => import('./pages/games/FileOrganizerGame'));
const AlgorithmRunner3D = React.lazy(() => import('./pages/games/AlgorithmRunner3D'));
const CodingStudioGame = React.lazy(() => import('./pages/games/CodingStudioGame'));
const CircuitLabGame = React.lazy(() => import('./pages/games/CircuitLabGame'));
const CTBoardGame = React.lazy(() => import('./pages/games/CTBoardGame'));
const TycoonGame = React.lazy(() => import('./pages/games/TycoonGame'));
const DigitalCityQuestGame = React.lazy(() => import('./pages/games/DigitalCityQuestGame'));
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
const CyberShieldGame = React.lazy(() => import('./pages/games/CyberShieldGame'));
const SortingDashGame = React.lazy(() => import('./pages/games/SortingDashGame'));
const BombCollectorGame = React.lazy(() => import('./pages/games/BombCollectorGame'));
const ObstacleDodgeGame = React.lazy(() => import('./pages/games/ObstacleDodgeGame'));
const SituationReactionGame = React.lazy(() => import('./pages/games/SituationReactionGame'));
const PCBuilderGame = React.lazy(() => import('./pages/games/PCBuilderGame'));
const StroopColorGame = React.lazy(() => import('./pages/games/StroopColorGame'));
const SpaceTreasureGame = React.lazy(() => import('./pages/games/SpaceTreasureGame'));
const CyberCopGame = React.lazy(() => import('./pages/games/CyberCopGame'));
const FlowchartBingoGame = React.lazy(() => import('./pages/games/FlowchartBingoGame'));
const GameLearningJourney = React.lazy(() => import('./components/GameLearningJourney'));

const LearningGameRoute = ({ gameId, children }: { gameId: string; children: React.ReactNode }) => {
  const game = gamesCatalog.find((item) => item.id === gameId);
  return (
    <LoginPromptOverlay>
      {game ? <GameLearningJourney game={game}>{children}</GameLearningJourney> : children}
    </LoginPromptOverlay>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const localQaMode = import.meta.env.DEV
    && new URLSearchParams(window.location.search).has('qa');
  if (loading) return <Loading fullScreen text="กำลังตรวจสอบการเข้าใช้งาน..." />;
  if (!user && localQaMode) return <>{children}</>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PageBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <ScrollToTop />
            <Layout>
              <PageBoundary>
                <Suspense fallback={<Loading text="กำลังโหลดหน้า..." />}>
                  <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
                  <Route path="/curriculum" element={<ProtectedRoute><Curriculum /></ProtectedRoute>} />
                  <Route path="/curriculum/:gradeId/:idx" element={<ProtectedRoute><IndicatorDetail /></ProtectedRoute>} />
                  <Route path="/curriculum/:gradeId/unit/:unitNo" element={<ProtectedRoute><UnitDetail /></ProtectedRoute>} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/scores" element={<Navigate to="/admin?tab=gradebook" replace />} />
                  <Route path="/research" element={<ResearchPage />} />
                  <Route path="/pa" element={<Navigate to="/research" replace />} />
                  <Route path="/resources" element={<LoginPromptOverlay><Resources /></LoginPromptOverlay>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/report-card" element={<ProtectedRoute><ReportCard /></ProtectedRoute>} />
                  <Route path="/quiz/:id" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                  <Route path="/lesson/:id" element={<ProtectedRoute><Lesson /></ProtectedRoute>} />
                  <Route path="/games" element={<LoginPromptOverlay><Games /></LoginPromptOverlay>} />
                  <Route path="/games/mouse-practice" element={<LearningGameRoute gameId="mouse"><MousePractice /></LearningGameRoute>} />
                  <Route path="/games/keyboard-practice" element={<LearningGameRoute gameId="keyboard"><KeyboardPractice /></LearningGameRoute>} />
                  <Route path="/games/algorithm-sorter" element={<LearningGameRoute gameId="algorithm"><AlgorithmSorter /></LearningGameRoute>} />
                  <Route path="/games/binary" element={<LearningGameRoute gameId="binary"><BinaryGame /></LearningGameRoute>} />
                  <Route path="/games/memory" element={<LearningGameRoute gameId="memory"><MemoryMatch /></LearningGameRoute>} />
                  <Route path="/games/pattern" element={<LearningGameRoute gameId="pattern"><PatternGame /></LearningGameRoute>} />
                  <Route path="/games/coding-maze" element={<LearningGameRoute gameId="maze"><CodingMaze /></LearningGameRoute>} />
                  <Route path="/games/snake" element={<LearningGameRoute gameId="snake"><SnakeGame /></LearningGameRoute>} />
                  <Route path="/games/bug-catcher" element={<LearningGameRoute gameId="bug"><BugCatcher /></LearningGameRoute>} />
                  <Route path="/games/quick-answer-computing" element={<LearningGameRoute gameId="quick-answer"><QuickAnswerComputing /></LearningGameRoute>} />
                  <Route path="/games/device-match" element={<LearningGameRoute gameId="device-match"><DeviceMatch /></LearningGameRoute>} />
                  <Route path="/games/step-sort" element={<LearningGameRoute gameId="step-sort"><StepSort /></LearningGameRoute>} />
                  <Route path="/games/safety" element={<LearningGameRoute gameId="safety"><SafetyGame /></LearningGameRoute>} />
                  <Route path="/games/pixel-art" element={<LearningGameRoute gameId="pixel-art"><PixelArtGame /></LearningGameRoute>} />
                  <Route path="/games/color-code-pixel" element={<LearningGameRoute gameId="color-code-pixel"><ColorCodePixelGame /></LearningGameRoute>} />
                  <Route path="/games/logic-gates" element={<LearningGameRoute gameId="logic-gates"><LogicGatesGame /></LearningGameRoute>} />
                  <Route path="/games/file-organizer" element={<LearningGameRoute gameId="file-organizer"><FileOrganizerGame /></LearningGameRoute>} />
                  <Route path="/games/algorithm-runner-3d" element={<LearningGameRoute gameId="algorithm-runner-3d"><AlgorithmRunner3D /></LearningGameRoute>} />
                  <Route path="/games/coding-studio" element={<LearningGameRoute gameId="coding-studio"><CodingStudioGame /></LearningGameRoute>} />
                  <Route path="/games/circuit-lab" element={<LearningGameRoute gameId="circuit-lab"><CircuitLabGame /></LearningGameRoute>} />
                  <Route path="/games/ct-board" element={<LearningGameRoute gameId="ct-board"><CTBoardGame /></LearningGameRoute>} />
                  <Route path="/games/tycoon" element={<LearningGameRoute gameId="tycoon"><TycoonGame /></LearningGameRoute>} />
                  <Route path="/games/digital-city-quest" element={<LearningGameRoute gameId="digital-city-quest"><DigitalCityQuestGame /></LearningGameRoute>} />
                  <Route path="/games/robot-maker" element={<LearningGameRoute gameId="robot-maker"><RobotMakerGame /></LearningGameRoute>} />
                  <Route path="/games/tech-system" element={<LearningGameRoute gameId="tech-system"><TechSystemGame /></LearningGameRoute>} />
                  <Route path="/games/search-smart" element={<LearningGameRoute gameId="search-smart"><SearchSmartGame /></LearningGameRoute>} />
                  <Route path="/games/cyber-shield" element={<LearningGameRoute gameId="cyber-shield"><CyberShieldGame /></LearningGameRoute>} />
                  <Route path="/games/sorting-dash" element={<LearningGameRoute gameId="sorting-dash"><SortingDashGame /></LearningGameRoute>} />
                  <Route path="/games/bomb-collector" element={<LearningGameRoute gameId="bomb-collector"><BombCollectorGame /></LearningGameRoute>} />
                  <Route path="/games/obstacle-dodge" element={<LearningGameRoute gameId="obstacle-dodge"><ObstacleDodgeGame /></LearningGameRoute>} />
                  <Route path="/games/situation-reaction" element={<LearningGameRoute gameId="situation-reaction"><SituationReactionGame /></LearningGameRoute>} />
                  <Route path="/games/pc-builder" element={<LearningGameRoute gameId="pc-builder"><PCBuilderGame /></LearningGameRoute>} />
                  <Route path="/games/stroop-color" element={<LearningGameRoute gameId="stroop-color"><StroopColorGame /></LearningGameRoute>} />
                  <Route path="/games/space-treasure" element={<LearningGameRoute gameId="space-treasure"><SpaceTreasureGame /></LearningGameRoute>} />
                  <Route path="/games/cyber-cop" element={<LearningGameRoute gameId="cyber-cop"><CyberCopGame /></LearningGameRoute>} />
                  <Route path="/games/flowchart-bingo" element={<LearningGameRoute gameId="flowchart-bingo"><FlowchartBingoGame /></LearningGameRoute>} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/parent/:studentId" element={<ParentPortal />} />
                  <Route path="/live" element={<LiveQuizPlay />} />
                  <Route path="/live/host" element={<AdminGate><LiveQuizHost /></AdminGate>} />
                  <Route path="/homework" element={<ProtectedRoute><HomeworkStudent /></ProtectedRoute>} />
                  <Route path="/world" element={<ProtectedRoute><VirtualClassroom /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </PageBoundary>
          </Layout>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
