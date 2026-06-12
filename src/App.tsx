/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Page } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { StaffDashboard } from './pages/StaffDashboard';
import { HRDashboard } from './pages/HRDashboard';
import { NotAuthorizedPage } from './pages/NotAuthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { BookOpen } from 'lucide-react';

function AttendanceAppContent() {
  const { user, loading, isLocalMode, unauthorizedDomainError, setUnauthorizedDomainError } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'reports' | 'profile' | 'employees'>('dashboard');

  // Handle immediate routing changes on auth state load
  useEffect(() => {
    if (!loading) {
      if (user) {
        if (currentPage === Page.LANDING || currentPage === Page.LOGIN || currentPage === Page.NOT_AUTHORIZED) {
          if (user.role === 'hr' || user.role === 'admin' || user.role === 'HR_ADMIN') {
            setCurrentPage(Page.HR_DASHBOARD);
          } else {
            setCurrentPage(Page.STAFF_DASHBOARD);
          }
        }
      } else {
        // Not logged in: only allow LANDING, LOGIN, NOT_AUTHORIZED or NOT_FOUND
        if (unauthorizedDomainError) {
          setCurrentPage(Page.NOT_AUTHORIZED);
        } else if (currentPage !== Page.LANDING && currentPage !== Page.LOGIN && currentPage !== Page.NOT_FOUND && currentPage !== Page.NOT_AUTHORIZED) {
          setCurrentPage(Page.LANDING);
        }
      }
    }
  }, [user, loading, unauthorizedDomainError]);

  // Handle URL hashtag navigation fallback if requested
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#/login') {
        setUnauthorizedDomainError(null);
        setCurrentPage(Page.LOGIN);
      }
      else if (hash === '#/') {
        setUnauthorizedDomainError(null);
        setCurrentPage(Page.LANDING);
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, [setUnauthorizedDomainError]);

  // Prevent routing breaches: if user plays with buttons, guarantee permission tags
  useEffect(() => {
    if (user && currentPage === Page.HR_DASHBOARD && user.role !== 'hr' && user.role !== 'admin' && user.role !== 'HR_ADMIN') {
      setCurrentPage(Page.NOT_AUTHORIZED);
    }
  }, [currentPage, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center" id="app-loading-screen">
        <div className="text-center space-y-4">
          <div className="relative mx-auto h-12 w-12 text-slate-900 flex items-center justify-center">
            <span className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-800 font-sans tracking-tight">Authenticating credentials...</h4>
            <p className="text-[10px] text-slate-400 font-mono">FACULTY COMPLIANCE PLATFORM</p>
          </div>
        </div>
      </div>
    );
  }

  // Router matching
  const renderPage = () => {
    switch (currentPage) {
      case Page.LANDING:
        return <LandingPage setCurrentPage={setCurrentPage} setActiveTab={setActiveTab} />;
      case Page.LOGIN:
        return <LoginPage setCurrentPage={setCurrentPage} setActiveTab={setActiveTab} />;
      case Page.STAFF_DASHBOARD:
        return <StaffDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      case Page.HR_DASHBOARD:
        return <HRDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      case Page.NOT_AUTHORIZED:
        return <NotAuthorizedPage setCurrentPage={setCurrentPage} setActiveTab={setActiveTab} />;
      case Page.NOT_FOUND:
        default:
          return <NotFoundPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Dynamic Top Navigation for authenticated sessions */}
      {user && (
        <Navbar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
      )}

      {/* Main page content layout with subtle animation wrappers */}
      <main className="flex-grow">
        {renderPage()}
      </main>

      {/* System state overlay */}
      {isLocalMode && user && (
        <div className="fixed bottom-4 right-4 z-50 bg-amber-50 text-amber-800 text-[10px] font-mono font-semibold px-3 py-2 rounded-lg border border-amber-200 shadow-md max-w-xs flex flex-col space-y-1">
          <div className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
            <span>Local Evaluation Active</span>
          </div>
          <p className="text-slate-500 font-sans text-[9px] leading-tight">
            Role switching is available in the top menu to quickly audit both interfaces.
          </p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AttendanceAppContent />
    </AuthProvider>
  );
}
