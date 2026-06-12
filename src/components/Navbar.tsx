/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Page, UserRole } from '../types';
import { 
  Menu, 
  X, 
  Clock, 
  User, 
  FileText, 
  LogOut, 
  ShieldAlert, 
  BookOpen, 
  Laptop, 
  ExternalLink 
} from 'lucide-react';

interface NavbarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  activeTab: 'dashboard' | 'attendance' | 'reports' | 'profile' | 'employees';
  setActiveTab: (tab: 'dashboard' | 'attendance' | 'reports' | 'profile' | 'employees') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentPage, 
  setCurrentPage, 
  activeTab, 
  setActiveTab 
}) => {
  const { user, logout, isLocalMode, updateUserContext } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleNavClick = (tab: 'dashboard' | 'attendance' | 'reports' | 'profile' | 'employees') => {
    setActiveTab(tab);
    setIsOpen(false);
    
    // Ensure we are showing the correct dashboard page for the user's role
    if (tab === 'dashboard') {
      if (user.role === 'hr' || user.role === 'admin' || user.role === 'HR_ADMIN') {
        setCurrentPage(Page.HR_DASHBOARD);
      } else {
        setCurrentPage(Page.STAFF_DASHBOARD);
      }
    } else {
      // For attendance, reports, and profile tabs, keep the user on their dashboard but swap tab content
      if (user.role === 'hr' || user.role === 'admin' || user.role === 'HR_ADMIN') {
        setCurrentPage(Page.HR_DASHBOARD);
      } else {
        setCurrentPage(Page.STAFF_DASHBOARD);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentPage(Page.LANDING);
  };

  const toggleSimulationRole = async () => {
    const nextRole: UserRole = (user.role === 'hr' || user.role === 'HR_ADMIN' || user.role === 'admin') ? 'STAFF' : 'HR_ADMIN';
    const nextPosition = nextRole === 'HR_ADMIN' ? 'HR Administrator' : 'Lecturer';
    const nextDept = nextRole === 'HR_ADMIN' ? 'Office of the Dean' : 'English & Linguistics';
    await updateUserContext({ 
      role: nextRole,
      position: nextPosition,
      department: nextDept
    });
    
    // Redirect to correct page
    if (nextRole === 'HR_ADMIN') {
      setCurrentPage(Page.HR_DASHBOARD);
    } else {
      setCurrentPage(Page.STAFF_DASHBOARD);
    }
  };

  return (
    <nav className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-50" id="fla-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="bg-amber-500 text-slate-950 p-2 rounded font-sans font-bold flex items-center justify-center w-10 h-10 shadow-inner">
              <span className="text-lg">LA</span>
            </div>
            <div>
              <h1 className="font-sans font-bold text-sm sm:text-base tracking-tight leading-tight">
                Faculty of Liberal Arts
              </h1>
              <p className="text-[10px] text-amber-500 font-mono tracking-wider uppercase leading-none">
                PNU Attendance System
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <button
              id="nav-btn-dashboard"
              onClick={() => handleNavClick('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              id="nav-btn-attendance"
              onClick={() => handleNavClick('attendance')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                activeTab === 'attendance'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Attendance
            </button>
            <button
              id="nav-btn-reports"
              onClick={() => handleNavClick('reports')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                activeTab === 'reports'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Reports
            </button>
            <button
              id="nav-btn-profile"
              onClick={() => handleNavClick('profile')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                activeTab === 'profile'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Profile
            </button>
            {(user.role === 'hr' || user.role === 'admin' || user.role === 'HR_ADMIN') && (
              <button
                id="nav-btn-employees"
                onClick={() => handleNavClick('employees')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  activeTab === 'employees'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Employees
              </button>
            )}
          </div>

          {/* User badge and Logout button */}
          <div className="hidden md:flex items-center space-x-4">
            {isLocalMode && (
              <button
                id="role-switch-pill"
                onClick={toggleSimulationRole}
                title="Click to toggle between Staff and HR roles for mock testing"
                className="flex items-center space-x-1.5 bg-slate-800 ring-1 ring-slate-700 hover:ring-amber-500 px-2.5 py-1 rounded text-xs text-amber-400 font-mono transition-all"
              >
                <Laptop className="w-3.5 h-3.5 text-amber-500" />
                <span>Demo: {user.role.toUpperCase()}</span>
                <span className="text-[9px] bg-slate-900 px-1 py-0.2 select-none text-slate-400 rounded">Swap</span>
              </button>
            )}

            <div className="flex items-center space-x-2 text-right border-l border-slate-800 pl-3">
              <div className="text-xs">
                <p className="font-medium text-slate-200">{user.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user.role} • {user.department}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 ring-1 ring-amber-500 flex items-center justify-center overflow-hidden font-sans font-bold text-xs text-amber-500">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
            </div>

            <button
              id="btn-logout"
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition-colors p-1.5 hover:bg-slate-800 rounded-full"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            {isLocalMode && (
              <button
                onClick={toggleSimulationRole}
                className="bg-slate-800 ring-1 ring-slate-700 px-2 py-1 rounded text-[10px] text-amber-400 font-mono"
              >
                Swap: {user.role.toUpperCase()}
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-2 pt-2 pb-4 space-y-1">
          <div className="px-3 py-2 border-b border-slate-800 mb-2 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role} • {user.department}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center scroll-m-0">
              {user.name.charAt(0)}
            </div>
          </div>
          
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
              activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleNavClick('attendance')}
            className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
              activeTab === 'attendance' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>Attendance Check</span>
          </button>
          <button
            onClick={() => handleNavClick('reports')}
            className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
              activeTab === 'reports' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>Reports & Leave</span>
          </button>
          <button
            onClick={() => handleNavClick('profile')}
            className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
              activeTab === 'profile' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>Profile Settings</span>
          </button>
          
          {(user.role === 'hr' || user.role === 'admin' || user.role === 'HR_ADMIN') && (
            <button
              onClick={() => handleNavClick('employees')}
              className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
                activeTab === 'employees' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>Employee Management</span>
            </button>
          )}
          
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-slate-800 flex items-center space-x-2 border-t border-slate-800 mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </nav>
  );
};
