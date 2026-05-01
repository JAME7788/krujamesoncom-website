import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Curriculum from './pages/Curriculum';
import IndicatorDetail from './pages/IndicatorDetail';
import UnitDetail from './pages/UnitDetail';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import Lesson from './pages/Lesson';
import TeacherDashboard from './pages/TeacherDashboard';
import Resources from './pages/Resources';
import { AuthProvider, useAuth } from './context/AuthContext';

// ส่วนป้องกันหน้าที่ต้องล็อคอินก่อน
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen">กำลังโหลด...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/curriculum" element={<ProtectedRoute><Curriculum /></ProtectedRoute>} />
            <Route path="/curriculum/:gradeId/:idx" element={<ProtectedRoute><IndicatorDetail /></ProtectedRoute>} />
            <Route path="/curriculum/:gradeId/unit/:unitNo" element={<ProtectedRoute><UnitDetail /></ProtectedRoute>} />
            <Route path="/admin/scores" element={<TeacherDashboard />} />
            <Route path="/resources" element={<Resources />} />
            
            {/* หน้าที่ต้องล็อคอินก่อนถึงจะเข้าได้ */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/quiz/:id" element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            } />
            <Route path="/lesson/:id" element={
              <ProtectedRoute>
                <Lesson />
              </ProtectedRoute>
            } />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
