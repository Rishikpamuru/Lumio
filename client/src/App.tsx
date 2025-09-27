import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Home } from './pages/Home';
import { Classes } from './pages/Classes';
import { ClassDetail } from './pages/ClassDetail';
import { Assignments } from './pages/Assignments';
import { Grades } from './pages/Grades';
import { ClassGrades } from './pages/ClassGrades';
import { AssignmentGrades } from './pages/AssignmentGrades';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { GradeCalculatorPage } from './pages/GradeCalculatorPage';
import { Login } from './pages/auth/Login';
import { useAuthStore } from './state/authStore';

const App: React.FC = () => {
  const { user, hydrate } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    console.log('App useEffect - hydrating auth');
    hydrate();
    setIsReady(true);
  }, [hydrate]);
  
  console.log('App render - isReady:', isReady, 'user:', user);
  
  // Don't render anything until we've checked localStorage
  if (!isReady) {
    return <div>Loading auth...</div>;
  }
  
  const authed = !!user;
  console.log('App render - User:', user, 'Authed:', authed);
  return (
    <div className="app-shell">
      {authed && <Sidebar />}
      <main className="main-content">
        <Routes>
          {!authed && <Route path="/*" element={<Login />} />}
          {authed && (
            <>
              <Route path="/" element={<Home />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/classes/:id" element={<ClassDetail />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/grades" element={<Grades />} />
              <Route path="/grades/class/:classId" element={<ClassGrades />} />
              <Route path="/grades/assignment/:assignmentId" element={<AssignmentGrades />} />
              <Route path="/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/grade-calculator" element={<GradeCalculatorPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
};

export default App;
