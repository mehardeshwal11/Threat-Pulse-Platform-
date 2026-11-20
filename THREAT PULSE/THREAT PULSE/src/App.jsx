import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { Activity, ExternalLink, Shield } from 'lucide-react';
import { API_BASE } from './lib/api';

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-black">
      {/* Top Navbar */}
      <nav className="bg-gray-950/90 backdrop-blur-md border-b border-yellow-500/20 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <span className="text-lg font-extrabold text-white group-hover:text-yellow-400 transition-colors tracking-tight">
                    THREAT PULSE
                  </span>
                  <span className="text-[9px] block font-mono text-gray-500 tracking-wider uppercase">
                    Threat Intelligence Engine
                  </span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-yellow-500/30 transition-colors"
              >
                Dashboard
              </Link>
              <a
                href={`${API_BASE}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
              >
                <span>API Docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Dashboard />
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-yellow-500/15 py-8 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-gray-300 mb-1">Threat Pulse • Real-Time Threat Intelligence Platform</p>
          <p className="text-gray-500">Multi-Source Ingestion • Automated Threat Scoring • Reactive Telemetry</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardLayout />} />
      </Routes>
    </Router>
  );
}
