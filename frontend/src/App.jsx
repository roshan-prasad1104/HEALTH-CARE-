import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import WhatsAppScanner from './pages/WhatsAppScanner';
import PrescriptionDecoder from './pages/PrescriptionDecoder';
import LabAnalyzer from './pages/LabAnalyzer';
import LearningHub from './pages/LearningHub';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import { Sparkles, HelpCircle } from 'lucide-react';

export default function App() {
  const { largeFont, darkMode } = useSelector(state => state.settings);
  const user = useSelector(state => state.auth?.user);

  // Toggle Tailwind dark mode class on <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
    }
  }, [darkMode]);

  return (
    <Routes>
      {/* Public auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Main app layout wrapper */}
      <Route path="/" element={user ? <MainApp largeFont={largeFont} /> : <Navigate to="/login" replace />}>
        {/* Child tab routes */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="scanner" element={<WhatsAppScanner />} />
        <Route path="prescription" element={<PrescriptionDecoder />} />
        <Route path="lab" element={<LabAnalyzer />} />
        <Route path="learning" element={<LearningHub />} />
        
        {/* Fallback within MainApp to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Global fallback */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

function MainApp({ largeFont }) {
  return (
    <div className={`min-h-screen flex flex-col justify-between transition-all duration-300 ${largeFont ? 'text-[17px]' : 'text-[14px]'}`} style={{ background: 'transparent' }}>
      <div>
        {/* Navigation Header */}
        <Navbar />

        {/* Content Shell */}
        <main className="pb-16 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Flagship Venture Footer */}
      <footer className="glass-panel border-t border-slate-900/60 py-6 px-4 md:px-8 text-center text-slate-300 text-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>&copy; 2026 PresCrypto. All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="#privacy" className="hover:text-slate-200 transition-colors">Privacy Shield</a>
            <a href="#hipaa" className="hover:text-slate-200 transition-colors">GDPR/HIPAA Structure</a>
            <a href="#disclaimer" className="hover:text-slate-200 transition-colors flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Medical Disclaimer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
