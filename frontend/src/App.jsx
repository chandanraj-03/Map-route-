import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';

import Navbar from './components/Navigation/Navbar';
import Dashboard from './pages/Dashboard';
import RoutePlanner from './pages/RoutePlanner';
import WeeklyPlanner from './pages/WeeklyPlanner';
import DriverPerformance from './pages/DriverPerformance';
import DriverManagement from './pages/DriverManagement';
import StoreManagement from './pages/StoreManagement';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import ModelMonitoring from './pages/ModelMonitoring';
import AuditLogs from './pages/AuditLogs';
import LandingPage from './pages/LandingPage';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSy_mock_key_for_build';

function ProtectedRoute({ children, authToken }) {
  const location = useLocation();
  if (!authToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function MainLayout({ children }) {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-100 font-sans">
      <Navbar />
      <main className="flex-1 relative bg-slate-50 overflow-hidden flex flex-col shadow-inner">
        {children}
      </main>
    </div>
  );
}

function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('auth_token'));

  useEffect(() => {
    // Sync state with localstorage if it changes
    setAuthToken(localStorage.getItem('auth_token'));
  }, []);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login setAuthToken={setAuthToken} />} />
          
          {/* Protected Routes wrapped in MainLayout */}
          <Route path="/dashboard" element={<ProtectedRoute authToken={authToken}><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/route" element={<ProtectedRoute authToken={authToken}><MainLayout><RoutePlanner /></MainLayout></ProtectedRoute>} />
          <Route path="/weekly" element={<ProtectedRoute authToken={authToken}><MainLayout><WeeklyPlanner /></MainLayout></ProtectedRoute>} />
          <Route path="/performance" element={<ProtectedRoute authToken={authToken}><MainLayout><DriverPerformance /></MainLayout></ProtectedRoute>} />
          <Route path="/drivers" element={<ProtectedRoute authToken={authToken}><MainLayout><DriverManagement /></MainLayout></ProtectedRoute>} />
          <Route path="/stores" element={<ProtectedRoute authToken={authToken}><MainLayout><StoreManagement /></MainLayout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute authToken={authToken}><MainLayout><Analytics /></MainLayout></ProtectedRoute>} />
          <Route path="/models" element={<ProtectedRoute authToken={authToken}><MainLayout><ModelMonitoring /></MainLayout></ProtectedRoute>} />
          <Route path="/audit" element={<ProtectedRoute authToken={authToken}><MainLayout><AuditLogs /></MainLayout></ProtectedRoute>} />
        </Routes>
      </Router>
    </APIProvider>
  );
}

export default App;
