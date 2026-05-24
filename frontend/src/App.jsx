import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';

import Navbar from './components/Navigation/Navbar';
import Dashboard from './pages/Dashboard';
import RoutePlanner from './pages/RoutePlanner';
import WeeklyPlanner from './pages/WeeklyPlanner';
import DriverPerformance from './pages/DriverPerformance';
import DriverManagement from './pages/DriverManagement';
import StoreManagement from './pages/StoreManagement';
import Analytics from './pages/Analytics';

import ModelMonitoring from './pages/ModelMonitoring';
import AuditLogs from './pages/AuditLogs';
import LandingPage from './pages/LandingPage';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSy_mock_key_for_build';


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

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* Routes wrapped in MainLayout */}
          <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/route" element={<MainLayout><RoutePlanner /></MainLayout>} />
          <Route path="/weekly" element={<MainLayout><WeeklyPlanner /></MainLayout>} />
          <Route path="/performance" element={<MainLayout><DriverPerformance /></MainLayout>} />
          <Route path="/drivers" element={<MainLayout><DriverManagement /></MainLayout>} />
          <Route path="/stores" element={<MainLayout><StoreManagement /></MainLayout>} />
          <Route path="/analytics" element={<MainLayout><Analytics /></MainLayout>} />
          <Route path="/models" element={<MainLayout><ModelMonitoring /></MainLayout>} />
          <Route path="/audit" element={<MainLayout><AuditLogs /></MainLayout>} />
        </Routes>
      </Router>
    </APIProvider>
  );
}

export default App;
