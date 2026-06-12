/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Page, UserRole } from '../types';
import { 
  LogIn, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Users, 
  FileSpreadsheet, 
  AlertTriangle,
  GraduationCap
} from 'lucide-react';

interface LandingPageProps {
  setCurrentPage: (page: Page) => void;
  setActiveTab: (tab: 'dashboard' | 'attendance' | 'reports' | 'profile') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setCurrentPage, setActiveTab }) => {
  const { loginWithGoogle, user, simulateLocalLogin, isLocalMode } = useAuth();
  const [useMock, setUseMock] = useState(isLocalMode);
  const [mockEmail, setMockEmail] = useState('');
  const [mockRole, setMockRole] = useState<UserRole>('STAFF');

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // AuthProvider useEffect will handle redirect if logged in,
      // but let's double check path in onClick
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const finalEmail = mockEmail.trim() || ((mockRole === 'hr' || mockRole === 'HR_ADMIN') ? 'sopawan.n@pnu.ac.th' : 'amanda.c@pnu.ac.th');
    simulateLocalLogin(finalEmail, mockRole);
    setActiveTab('dashboard');
    if (mockRole === 'hr' || mockRole === 'HR_ADMIN') {
      setCurrentPage(Page.HR_DASHBOARD);
    } else {
      setCurrentPage(Page.STAFF_DASHBOARD);
    }
  };

  const loginAsSpecificMock = (email: string, role: UserRole) => {
    simulateLocalLogin(email, role);
    setActiveTab('dashboard');
    if (role === 'hr' || role === 'HR_ADMIN') {
      setCurrentPage(Page.HR_DASHBOARD);
    } else {
      setCurrentPage(Page.STAFF_DASHBOARD);
    }
  };

  // If user is already logged in, show a quick "Go to Dashboard" button
  const handleGoToDashboard = () => {
    setActiveTab('dashboard');
    if (user?.role === 'hr' || user?.role === 'admin' || user?.role === 'HR_ADMIN') {
      setCurrentPage(Page.HR_DASHBOARD);
    } else {
      setCurrentPage(Page.STAFF_DASHBOARD);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-amber-200" id="landing-page">
      
      {/* Header Border Strip */}
      <div className="h-2 bg-gradient-to-r from-slate-900 via-amber-500 to-slate-900 w-full"></div>

      {/* Hero Section */}
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-12">
          
          {/* Logo Placeholder and System Title */}
          <div className="text-center space-y-6">
            
            {/* University Crest Placeholder */}
            <div className="mx-auto h-24 w-24 rounded-full bg-slate-900 text-amber-400 border-4 border-amber-500 flex flex-col items-center justify-center shadow-md select-none">
              <GraduationCap className="w-10 h-10" />
              <span className="text-[10px] font-mono tracking-wider">L.A.</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-mono font-medium">
                Phranakhon Rajabhat University • Faculty of Liberal Arts
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-sans font-bold tracking-tight text-slate-900 max-w-2xl mx-auto leading-tight" id="app-title">
                Faculty of Liberal Arts Attendance Monitoring System
              </h2>
            </div>

            <p className="max-w-xl mx-auto text-base text-slate-600 font-sans leading-relaxed">
              Provides real-time faculty clock-in validation, digital leave scheduling, RFID kiosk integration simulation, and robust regulatory compliance reporting for HR evaluation.
            </p>
          </div>

          {/* Action Area (Google Login and Simulator) */}
          <div className="max-w-sm mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-100 space-y-6">
            
            {user ? (
              <div className="space-y-4 text-center">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-800 text-sm">
                  Logged in as <strong className="font-semibold">{user.name}</strong> ({user.role.toUpperCase()})
                </div>
                <button
                  id="landing-goto-dashboard"
                  onClick={handleGoToDashboard}
                  className="w-full py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 focus:outline-none transition-all flex items-center justify-center space-x-2 shadow"
                >
                  <span>Go to Management Dashboard</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <button
                    id="btn-google-login"
                    onClick={handleGoogleLogin}
                    className="w-full py-3.5 px-4 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none transition-all flex items-center justify-center space-x-3 shadow-md"
                  >
                    <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.71 0 3.28.614 4.53 1.642l2.428-2.428C17.657 1.83 15.085 1 12.24 1 6.586 1 2 5.586 2 11.24s4.586 10.24 10.24 10.24c5.9 0 9.8-4.143 9.8-10 0-.614-.07-1.129-.186-1.571H12.24z"/>
                    </svg>
                    <span>Sign In with University Google</span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2 font-mono">
                    Using secure, federated OAuth Verification
                  </p>
                </div>

                {/* Local Mode Simulator Toggle */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 font-sans uppercase tracking-wider">Demo / Testing Sandboxed Area</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={useMock} 
                        onChange={(e) => setUseMock(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {useMock && (
                    <form onSubmit={handleSimulateLogin} className="space-y-3 animation-fade-in">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-slate-500">Email Address (Optional)</label>
                        <input
                          type="email"
                          value={mockEmail}
                          onChange={(e) => setMockEmail(e.target.value)}
                          placeholder="e.g. sopawan.n@pnu.ac.th"
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-slate-500">Select Mock Role</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMockRole('STAFF')}
                            className={`py-1 text-xs font-medium rounded border ${
                              mockRole === 'STAFF' || mockRole === 'staff'
                                ? 'bg-amber-50 border-amber-500 text-amber-800 font-semibold shadow-sm' 
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            Staff Member (Faculty)
                          </button>
                          <button
                            type="button"
                            onClick={() => setMockRole('HR_ADMIN')}
                            className={`py-1 text-xs font-medium rounded border ${
                              mockRole === 'HR_ADMIN' || mockRole === 'hr'
                                ? 'bg-amber-50 border-amber-500 text-amber-800 font-semibold shadow-sm' 
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            HR / Dean Admin
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full mt-2 py-2 px-3 border border-slate-900 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 shadow"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Launch Simulation Session</span>
                      </button>

                      {/* Immediate shortcuts */}
                      <div className="pt-2 flex flex-col space-y-1 text-[10px] text-slate-400 text-center">
                        <span className="font-mono">Quick Access Mock Presets:</span>
                        <div className="flex justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => loginAsSpecificMock('sopawan.n@pnu.ac.th', 'HR_ADMIN')}
                            className="text-amber-600 hover:underline hover:text-amber-700 font-medium"
                          >
                            HR (Dean’s Office)
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => loginAsSpecificMock('amanda.c@pnu.ac.th', 'STAFF')}
                            className="text-amber-600 hover:underline hover:text-amber-700 font-medium"
                          >
                            Staff (Dr. Amanda)
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Three-column feature summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto pt-4 border-t border-slate-200">
            
            <div className="space-y-2 select-none">
              <div className="flex items-center space-x-2 text-slate-900">
                <Clock className="w-5 h-5 text-amber-500" />
                <h4 className="font-sans font-semibold text-sm uppercase tracking-wider text-slate-800">
                  Instant Verification
                </h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clock in and out using RFID kiosk emulators or GPS-supported locations. The system immediately calculates status parameters (on-time, late, early exit) securely.
              </p>
            </div>

            <div className="space-y-2 select-none">
              <div className="flex items-center space-x-2 text-slate-900">
                <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                <h4 className="font-sans font-semibold text-sm uppercase tracking-wider text-slate-800">
                  Compliance Analytics
                </h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Generate official faculty timesheets. HR personnel can view live maps of sign-ins, audit compliance stats, and export attendance logs cleanly.
              </p>
            </div>

            <div className="space-y-2 select-none">
              <div className="flex items-center space-x-2 text-slate-900">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h4 className="font-sans font-semibold text-sm uppercase tracking-wider text-slate-800">
                  Secure OAuth Layer
                </h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Integrated tightly with standard university directory and Cloud Firestore. Strict ABAC rules lock records to verified owners and authorized reviewers.
              </p>
            </div>

          </div>

          <div className="text-center">
            {isLocalMode && (
              <div className="inline-flex items-center space-x-2 bg-amber-50 text-amber-800 text-xs px-3 py-1.5 rounded-full border border-amber-200 shadow-sm" id="local-mode-banner">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>Running in isolated Local Sandbox mode. Authenticate via simulation controls above.</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Corporate University Footer */}
      <footer className="bg-slate-950 text-slate-500 text-center py-6 text-xs border-t border-slate-900">
        <p className="font-sans">
          © {new Date().getFullYear()} Faculty of Liberal Arts, Phranakhon Rajabhat University. All Rights Reserved.
        </p>
        <p className="text-[10px] text-slate-600 mt-1 font-mono">
          Security policy: Restricted entry. Subject to standard cyber audits. Developed for academic compliance.
        </p>
      </footer>

    </div>
  );
};
