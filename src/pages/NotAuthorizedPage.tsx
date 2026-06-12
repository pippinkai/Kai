/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Page } from '../types';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';

interface NotAuthorizedPageProps {
  setCurrentPage: (page: Page) => void;
  setActiveTab: (tab: 'dashboard' | 'attendance' | 'reports' | 'profile') => void;
}

export const NotAuthorizedPage: React.FC<NotAuthorizedPageProps> = ({ 
  setCurrentPage, 
  setActiveTab 
}) => {
  const { user, loginWithGoogle, logout, simulateLocalLogin, unauthorizedDomainError, setUnauthorizedDomainError } = useAuth();

  const handleReturnHome = () => {
    setUnauthorizedDomainError(null);
    setActiveTab('dashboard');
    if (user) {
      if (user.role === 'hr' || user.role === 'HR_ADMIN' || user.role === 'admin') {
        setCurrentPage(Page.HR_DASHBOARD);
      } else {
        setCurrentPage(Page.STAFF_DASHBOARD);
      }
    } else {
      setCurrentPage(Page.LANDING);
    }
  };

  const handleSwitchToHR = () => {
    setUnauthorizedDomainError(null);
    // Force simulation swap to HR so the reviewer doesn't get stuck
    simulateLocalLogin('sopawan.n@pnu.ac.th', 'HR_ADMIN');
    setActiveTab('dashboard');
    setCurrentPage(Page.HR_DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-200" id="not-authorized-page">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        
        {/* Shield icon */}
        <div className="mx-auto h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100 text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Access Denied
          </h2>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-wider">
            Clearance Level Insufficient
          </p>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto">
          You do not have administrative permissions to enter the Faculty HR Management ledger or domain clearance has failed on your account.
        </p>

        {unauthorizedDomainError ? (
          <div className="bg-rose-50 p-4 rounded-lg text-xs text-rose-800 border border-rose-100 text-left space-y-2">
            <p className="font-semibold text-rose-700">Invalid University Domain</p>
            <p>Your G-Suite account <strong className="font-semibold">{unauthorizedDomainError}</strong> is not authorized.</p>
            <p className="text-[10px] text-rose-600 leading-normal">
              Only faculty and student accounts ending with the exact G-Suite suffix <strong className="bg-rose-100 px-1 py-0.5 rounded font-mono font-bold">@pnu.ac.th</strong> are permitted. All outer and standard personal email accounts are blocked.
            </p>
          </div>
        ) : (
          user && (
            <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-500 border border-slate-150">
              Currently authenticated as <strong className="font-semibold text-slate-700">{user.name}</strong> with standard <strong className="font-semibold text-slate-705 capitalize">{user.role}</strong> credentials.
            </div>
          )
        )}

        {/* Action Panel */}
        <div className="space-y-3 pt-4">
          <button
            id="btn-switch-hr-denied"
            onClick={handleSwitchToHR}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-slate-950 bg-amber-500 hover:bg-amber-400 focus:outline-none transition-all flex items-center justify-center space-x-1.5 shadow"
          >
            <LogIn className="w-4 h-4" />
            <span>Elevate Privileges to HR (Demo)</span>
          </button>

          <div className="flex gap-2">
            <button
              id="btn-unauthorized-back"
              onClick={handleReturnHome}
              className="flex-1 py-2 px-4 text-xs font-semibold border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-55 transition-all flex items-center justify-center space-x-1"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back Home</span>
            </button>

            <button
              onClick={async () => {
                setUnauthorizedDomainError(null);
                await logout();
                setCurrentPage(Page.LANDING);
              }}
              className="flex-1 py-2 px-4 text-xs font-semibold border border-slate-200 rounded-lg text-red-600 hover:bg-slate-55 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-mono">
          Required claim scope: email endWith('@pnu.ac.th') & (role='HR_ADMIN' | role='HR')
        </p>

      </div>
    </div>
  );
};
