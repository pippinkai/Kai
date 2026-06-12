/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { Employee, AttendanceRecordNew, NewAttendanceStatus, OverrideLog } from '../types';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  SlidersHorizontal,
  PlusCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Building,
  Check,
  Sliders
} from 'lucide-react';

interface AttendanceManagementModuleProps {
  isAdmin: boolean;
  userEmail: string;
}

export const AttendanceManagementModule: React.FC<AttendanceManagementModuleProps> = ({ isAdmin, userEmail }) => {
  // Roster & Configuration State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecordNew[]>([]);
  const [currentUserEmployee, setCurrentUserEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all'); // 'YYYY-MM'
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState('');
  
  // Form fields
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<NewAttendanceStatus>('Present');
  const [formWorkingHours, setFormWorkingHours] = useState<number>(8);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Manual Override & Audit History States
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'audit'>('ledger');
  const [overrideLogs, setOverrideLogs] = useState<OverrideLog[]>([]);
  const [overrideReason, setOverrideReason] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Initial Data Sync
  useEffect(() => {
    loadData();
  }, [userEmail, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Employees
      const emps = await dataService.getAllEmployees();
      setEmployees(emps);

      // Check if logged-in user maps to physical employee roster
      const match = emps.find(e => e.email.toLowerCase() === userEmail.toLowerCase());
      if (match) {
        setCurrentUserEmployee(match);
      }

      // 2. Fetch Records: If HR, fetch all. If Staff, fetch own matched employee only.
      if (isAdmin) {
        const records = await dataService.getAllAttendanceRecords();
        setAllRecords(records);
        
        const logs = await dataService.getAllOverrideLogs();
        setOverrideLogs(logs);
      } else if (match) {
        const records = await dataService.getEmployeeAttendanceRecords(match.employeeId);
        setAllRecords(records);
        
        const logs = await dataService.getAllOverrideLogs();
        setOverrideLogs(logs.filter(l => l.employeeId === match.employeeId));
      } else {
        setAllRecords([]);
        setOverrideLogs([]);
      }
    } catch (err) {
      console.error('Error loading attendance module:', err);
    } finally {
      setLoading(false);
    }
  };

  // Status-informed dynamic hour triggers
  useEffect(() => {
    if (!isEditing) {
      if (formStatus === 'Present') {
        setFormWorkingHours(8);
      } else {
        setFormWorkingHours(0);
      }
    }
  }, [formStatus, isEditing]);

  // CRUD Operations
  const handleOpenAddForm = () => {
    setFormEmployeeId(currentUserEmployee?.employeeId || (employees.length > 0 ? employees[0].employeeId : ''));
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStatus('Present');
    setFormWorkingHours(8);
    setFormError('');
    setFormSuccess('');
    setIsEditing(false);
    setEditingRecordId('');
    setOverrideReason('');
    setShowForm(true);
  };

  const handleOpenEditForm = (rec: AttendanceRecordNew) => {
    setFormEmployeeId(rec.employeeId);
    setFormDate(rec.attendanceDate);
    setFormStatus(rec.status);
    setFormWorkingHours(rec.workingHours);
    setFormError('');
    setFormSuccess('');
    setIsEditing(true);
    setEditingRecordId(rec.attendanceId);
    setOverrideReason('');
    setShowForm(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formEmployeeId) {
      setFormError('Please select a faculty member.');
      return;
    }
    if (!formDate) {
      setFormError('Please specify an evaluation date.');
      return;
    }
    if (formWorkingHours < 0 || formWorkingHours > 24) {
      setFormError('Working Hours must be between 0 and 24.');
      return;
    }

    const matchedEmp = employees.find(emp => emp.employeeId === formEmployeeId);
    if (!matchedEmp) {
      setFormError('The selected employee profile cannot be verified.');
      return;
    }

    try {
      // Create new or update
      const newRecordId = isEditing ? editingRecordId : 'att_' + Math.random().toString(36).substring(2, 9);
      const recordToSave: AttendanceRecordNew = {
        attendanceId: newRecordId,
        employeeId: formEmployeeId,
        attendanceDate: formDate,
        status: formStatus,
        workingHours: Number(formWorkingHours),
        score: 0, // Automatically calculated by service
        createdAt: isEditing ? (allRecords.find(r => r.attendanceId === editingRecordId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isEditing) {
        if (!overrideReason || overrideReason.trim() === '') {
          setFormError('Manual override reason is strictly required to audit this edit.');
          return;
        }
        await dataService.overrideAttendanceRecord(recordToSave, overrideReason, userEmail || 'HR_ADMIN');
        setFormSuccess('Attendance record override saved and audit log generated successfully.');
      } else {
        await dataService.saveAttendanceRecord(recordToSave);
        setFormSuccess('New attendance record recorded successfully.');
      }
      
      // Reload UI state
      await loadData();
      
      // Auto close after brief display
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess('');
      }, 1550);

    } catch (err: any) {
      setFormError(err.message || 'An error occurred during database sync.');
    }
  };

  const handleDeleteRecord = async (attendanceId: string, employeeId: string) => {
    if (!window.confirm('Are you select to permanently delete this official attendance record? This will recompute the scorecard rating.')) {
      return;
    }
    try {
      await dataService.deleteAttendanceRecord(attendanceId, employeeId);
      await loadData();
    } catch (err) {
      alert('Delete operation failed to synchronize.');
    }
  };

  // Helper selectors and groupings
  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.employeeId === id);
    return emp ? emp.fullName : 'Unknown Employee';
  };

  const getEmployeeDept = (id: string) => {
    const emp = employees.find(e => e.employeeId === id);
    return emp ? emp.department : 'Liberal Arts';
  };

  // Filtering Logic
  const filteredRecords = allRecords.filter(rec => {
    // 1. Employee Email/Name searchQuery (Only relevant for HR view)
    let matchesSearch = true;
    if (isAdmin && searchQuery) {
      const name = getEmployeeName(rec.employeeId).toLowerCase();
      const dept = getEmployeeDept(rec.employeeId).toLowerCase();
      const query = searchQuery.toLowerCase();
      matchesSearch = name.includes(query) || dept.includes(query) || rec.employeeId.toLowerCase().includes(query);
    }

    // 2. Department filter
    let matchesDept = true;
    if (deptFilter !== 'all') {
      matchesDept = getEmployeeDept(rec.employeeId) === deptFilter;
    }

    // 3. Status filter
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = rec.status === statusFilter;
    }

    // 4. Month Filter
    let matchesMonth = true;
    if (monthFilter !== 'all') {
      matchesMonth = rec.attendanceDate.startsWith(monthFilter);
    }

    return matchesSearch && matchesDept && matchesStatus && matchesMonth;
  });

  // Calculate stats for displays
  const getStats = (recordsToAnalyze: AttendanceRecordNew[]) => {
    const total = recordsToAnalyze.length;
    const presentCount = recordsToAnalyze.filter(r => r.status === 'Present').length;
    const absentCount = recordsToAnalyze.filter(r => r.status === 'Absent').length;
    const leaveCount = recordsToAnalyze.filter(r => r.status === 'Leave').length;
    const sickCount = recordsToAnalyze.filter(r => r.status === 'Sick').length;
    const holidayCount = recordsToAnalyze.filter(r => r.status === 'Holiday').length;
    const totalHours = recordsToAnalyze.reduce((sum, r) => sum + r.workingHours, 0);

    return { total, presentCount, absentCount, leaveCount, sickCount, holidayCount, totalHours };
  };

  const activeStats = getStats(filteredRecords);
  const overallStats = getStats(allRecords);

  // Score metrics:
  // If staff member, show their active score directly based on their plannedSessions.
  // If HR admin, show averages or scores per employee.
  const latestScore = allRecords.length > 0 ? (isAdmin ? 0 : [...allRecords].sort((a,b) => b.attendanceDate.localeCompare(a.attendanceDate))[0]?.score || 0) : 0;

  // Monthly Breakdown array
  // Groups ALL records by Month year
  const getMonthlyBreakdown = (recordsToGroup: AttendanceRecordNew[]) => {
    const groups: { [key: string]: AttendanceRecordNew[] } = {};
    recordsToGroup.forEach(r => {
      const month = r.attendanceDate.substring(0, 7); // 'YYYY-MM'
      if (!groups[month]) groups[month] = [];
      groups[month].push(r);
    });

    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(month => {
      const recs = groups[month];
      const stats = getStats(recs);
      return {
        month, // '2026-06'
        records: recs,
        ...stats
      };
    });
  };

  const monthlyBreakdown = getMonthlyBreakdown(filteredRecords);

  // Annual Breakdown
  const getAnnualBreakdown = (recordsToGroup: AttendanceRecordNew[]) => {
    const groups: { [key: string]: AttendanceRecordNew[] } = {};
    recordsToGroup.forEach(r => {
      const year = r.attendanceDate.substring(0, 4); // 'YYYY'
      if (!groups[year]) groups[year] = [];
      groups[year].push(r);
    });

    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(year => {
      const recs = groups[year];
      const stats = getStats(recs);
      return {
        year,
        records: recs,
        ...stats
      };
    });
  };

  const annualBreakdown = getAnnualBreakdown(filteredRecords);

  // List of uniqueMonths for filter dropdown
  const uniqueMonths = Array.from(new Set(allRecords.map(r => r.attendanceDate.substring(0, 7)))).sort((a: string, b: string) => b.localeCompare(a));

  // Pagination bounds
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // Color mappings
  const getStatusBadgeClass = (status: NewAttendanceStatus) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Absent':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Leave':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Sick':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Holiday':
        return 'bg-violet-50 text-violet-800 border-violet-200';
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center" id="loading-module">
        <span className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin inline-block"></span>
        <p className="text-xs text-slate-400 mt-2 font-mono">Synchronizing Official Session Records...</p>
      </div>
    );
  }

  // Warning when Staff member cannot find their matched Employee Profile
  if (!isAdmin && !currentUserEmployee) {
    return (
      <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200 max-w-2xl mx-auto space-y-4 my-8" id="profile-unlinked-warning">
        <div className="flex items-start space-x-3 text-amber-800">
          <AlertCircle className="w-5 h-5 mt-0.5 text-amber-600 flex-shrink-0" />
          <div className="text-xs space-y-1.5 leading-relaxed">
            <strong className="text-sm font-sans font-bold block text-slate-900">Faculty HR Roster Assignment Pending</strong>
            <p>
              Your active authorization credentials (<strong>{userEmail}</strong>) were verified, but you have not yet been assigned to an Employee profile in the system's human resource catalog list.
            </p>
            <p>
              Please contact an HR Administrator (such as <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">sopawan.n@pnu.ac.th</span>) and provide your full academic name and department to complete your mapping catalog.
            </p>
            <div className="p-3 bg-white rounded-lg border border-amber-100 mt-2 font-mono text-[10.5px]">
              <span className="text-slate-400 font-bold">REASON FOR SYSTEM BLOCK:</span>
              <br />
              Academic compliance targets (scorecards, planned sessions ratio) cannot be assessed for profiles untethered to the active employee inventory database structure.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-800" id="official-attendance-module">
      
      {/* 1. Header & Actions Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-sans font-extrabold tracking-tight text-slate-950 flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
            <span>Official Attendance & Scorecard Ledger</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 leading-normal">
            {isAdmin 
              ? 'Authorized administrative oversight: compile attendance scores, maintain official session status parameters.'
              : `Review metrics and official score targets for ${currentUserEmployee?.fullName}. Assigned target: ${currentUserEmployee?.plannedSessions} planned sessions.`
            }
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-add-session-attendance"
            onClick={handleOpenAddForm}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record Official Session Log</span>
          </button>
        )}
      </div>

      {/* Module Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-1" id="attendance-inner-tabs-nav">
        <button
          type="button"
          id="tab-btn-ledger"
          onClick={() => { setActiveSubTab('ledger'); setSelectedHistoryId(null); }}
          className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'ledger'
              ? 'border-amber-500 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Overview & Scoresheets
        </button>
        <button
          type="button"
          id="tab-btn-audit"
          onClick={() => setActiveSubTab('audit')}
          className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeSubTab === 'audit'
              ? 'border-amber-500 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Change History Audit Trail ({overrideLogs.length})</span>
          {overrideLogs.length > 0 && (
            <span className="bg-amber-100 text-amber-805 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
              Logs
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'ledger' && (
        <>

      {/* 2. Live Scorecard / Highlights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Score Card */}
        <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-amber-400 font-mono tracking-widest uppercase block mb-1">
                {isAdmin ? 'System-Wide Planned Total' : 'Roster Active Rating'}
              </span>
              <h3 className="text-2xl font-sans font-bold tracking-tight text-slate-100">
                {isAdmin ? 'Academic Session Ratio' : 'Your Attendance Score'}
              </h3>
            </div>
            <div className="p-2 bg-slate-900 ring-1 ring-slate-800 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline space-x-2">
            {isAdmin ? (
              <div className="text-3xl font-mono font-extrabold text-amber-400">
                {employees.reduce((sum, e) => sum + e.plannedSessions, 0)} <span className="text-xs text-slate-400 font-sans">Sessions</span>
              </div>
            ) : (
              <div className="flex items-baseline space-x-1.5">
                <span className="text-4xl font-mono font-extrabold text-amber-400">{latestScore || 0}%</span>
                <span className="text-xs text-slate-400 font-sans">/ 100 maxPoints</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-900 pt-3 mt-3 text-[10.5px] text-slate-400 leading-normal font-sans">
            {isAdmin 
              ? `Total employee catalog currently: ${employees.length} active faculties`
              : `Ratio calculated against your profile standard: ${currentUserEmployee?.plannedSessions} planned sessions.`
            }
          </div>
        </div>

        {/* Totals Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block mb-1">Activity Catalog</span>
              <h3 className="text-lg font-sans font-bold tracking-tight text-slate-900">Recorded Sessions</h3>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
              <Calendar className="w-5 h-5 text-slate-600" />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1 mt-3 text-center">
            <div className="bg-emerald-50 rounded p-1.5 border border-emerald-100">
              <span className="text-xs font-mono font-bold text-emerald-800">{activeStats.presentCount}</span>
              <p className="text-[8px] text-slate-400 uppercase font-semibold mt-0.5">Pres</p>
            </div>
            <div className="bg-rose-50 rounded p-1.5 border border-rose-100">
              <span className="text-xs font-mono font-bold text-rose-800">{activeStats.absentCount}</span>
              <p className="text-[8px] text-slate-500 uppercase font-semibold mt-0.5">Abs</p>
            </div>
            <div className="bg-sky-50 rounded p-1.5 border border-sky-100">
              <span className="text-xs font-mono font-bold text-sky-800">{activeStats.leaveCount}</span>
              <p className="text-[8px] text-slate-500 uppercase font-semibold mt-0.5">Lve</p>
            </div>
            <div className="bg-amber-50 rounded p-1.5 border border-amber-100">
              <span className="text-xs font-mono font-bold text-amber-800">{activeStats.sickCount}</span>
              <p className="text-[8px] text-slate-500 uppercase font-semibold mt-0.5">Sck</p>
            </div>
            <div className="bg-violet-50 rounded p-1.5 border border-violet-100">
              <span className="text-xs font-mono font-bold text-violet-800">{activeStats.holidayCount}</span>
              <p className="text-[8px] text-slate-500 uppercase font-semibold mt-0.5">Hol</p>
            </div>
          </div>

          <div className="text-[10.5px] text-slate-400 mt-3 border-t border-slate-100 pt-3 flex justify-between">
            <span>Overall log files: <strong>{activeStats.total} entries</strong></span>
            <span>Accrued hours: <strong>{activeStats.totalHours}H</strong></span>
          </div>
        </div>

        {/* Scoring formula notice box */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block mb-1">Standard Formula</span>
              <h3 className="text-base font-sans font-bold tracking-tight text-slate-950">Scoring Engine</h3>
            </div>
            <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-mono text-slate-600 leading-normal space-y-1">
            <span className="font-bold text-slate-800 block text-[11px]">Formula Parameters</span>
            <p>score = MIN((actualAttendance / plannedSessions) * 100, 100)</p>
            <p className="text-slate-400">• actualAttendance = Count (Present days)</p>
            <p className="text-slate-400">• maxPoints = 100 points</p>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            Recalculations occur dynamically in real-time on record save.
          </div>
        </div>

      </div>

      {/* 3. Add/Edit Form Overlay */}
      {showForm && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 max-w-xl mx-auto" id="attendance-session-form">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-sans font-bold text-slate-900 text-base flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>{isEditing ? 'Audit Official Session Attendance' : 'Record Official Session log'}</span>
            </h3>
            <button
              id="btn-close-attendance-form"
              onClick={() => setShowForm(false)}
              className="text-xs hover:underline font-mono text-slate-400 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveRecord} className="space-y-4">
            
            {/* Faculty selection input */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Faculty Member / Roster Profile</label>
              <select
                id="form-emp-select"
                disabled={isEditing || !isAdmin}
                value={formEmployeeId}
                onChange={(e) => setFormEmployeeId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
              >
                <option value="">-- Choose Faculty Member --</option>
                {employees.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName} ({emp.employeeId}) — {emp.department} • Sessions (Planned: {emp.plannedSessions})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Session Date</label>
                <input
                  type="date"
                  required
                  id="form-date-input"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Official Session Status</label>
                <select
                  id="form-status-select"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as NewAttendanceStatus)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Present">Present (Adds to actual score)</option>
                  <option value="Absent">Absent (Not present)</option>
                  <option value="Leave">Leave (Approved Leave deviation)</option>
                  <option value="Sick">Sick (Medical deviation)</option>
                  <option value="Holiday">Holiday (Designated non-session day)</option>
                </select>
              </div>

            </div>

            {/* Working Hours */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Session Duration (Hrs / Attendance Value)</label>
              <input
                type="number"
                min="0"
                max="24"
                required
                id="form-hours-input"
                value={formWorkingHours}
                onChange={(e) => setFormWorkingHours(Number(e.target.value))}
                placeholder="Default: 8 for Present, 0 for others"
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:ring-1 focus:ring-amber-500"
              />
              <p className="text-[10px] text-slate-400 font-mono">
                Used to compile academic teaching/working hour statistics. Standard value is 8.0 hours.
              </p>
            </div>

            {isEditing && (
              <div className="space-y-2 bg-amber-50/50 p-4 rounded-xl border border-amber-100" id="override-fields">
                <label className="text-[11px] font-mono text-amber-900 uppercase tracking-wider block font-bold flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Administrative Override Audit</span>
                </label>
                <div className="text-[11.5px] text-slate-600 font-sans leading-normal mb-2 pt-1 border-t border-amber-100/50">
                  <span className="font-bold text-slate-800 mr-2">Original value:</span>
                  <span className="bg-amber-100 text-amber-900 font-mono px-2 py-0.5 rounded text-[10px] font-bold">
                    {(() => {
                      const prev = allRecords.find(r => r.attendanceId === editingRecordId);
                      return prev ? `Status: ${prev.status} (${prev.workingHours} hrs)` : 'N/A';
                    })()}
                  </span>
                </div>
                <div className="space-y-1 mt-2">
                  <span className="text-[10.5px] font-bold font-sans text-slate-700 block">Override Reason (MANDATORY)</span>
                  <textarea
                    required
                    id="override-reason-textarea"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Provide a detailed official description explaining why this attendance status score is corrected..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-amber-500 bg-white"
                    rows={3}
                  />
                </div>
                <p className="text-[9px] text-slate-400 leading-normal font-sans">
                  * Submission of an override automatically writes a persistent audit trail. Actions are logs-tracked and cannot be altered once archived.
                </p>
              </div>
            )}

            <button
              type="submit"
              id="form-submit-btn"
              className="w-full py-3 bg-slate-900 border border-slate-800 hover:border-amber-500 text-amber-400 hover:text-amber-300 font-semibold text-xs rounded-lg tracking-wider flex items-center justify-center space-x-2 shadow transition-all uppercase"
            >
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{isEditing ? 'Apply Changes & Recalculate Rating' : 'Save Record & Compute Active Scorecard'}</span>
            </button>

          </form>
        </div>
      )}

      {/* 4. Search & Filter controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        <div className="flex items-center space-x-2 text-slate-700 w-full md:w-auto">
          <Sliders className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Filter Scoresheets</span>
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto justify-end">
          
          {/* Query string for HR only */}
          {isAdmin && (
            <div className="relative text-xs w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search faculty name, ID, or dept..."
                className="w-full text-xs pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-amber-500 bg-slate-50"
              />
            </div>
          )}

          {/* Department filter (Only active or editable for HR, static info for staff) */}
          {isAdmin && (
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
            >
              <option value="all">All Departments</option>
              <option value="English & Linguistics">English & Linguistics</option>
              <option value="Thai Language & Culture">Thai Language & Culture</option>
              <option value="History & Philosophy">History & Philosophy</option>
              <option value="Sociology & Anthropology">Sociology & Anthropology</option>
              <option value="Office of the Dean">Office of the Dean</option>
            </select>
          )}

          {/* Month selective */}
          <select
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="all">All Months</option>
            {uniqueMonths.map(m => (
              <option key={m} value={m}>{new Date(m + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>
            ))}
          </select>

          {/* Status value */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
            <option value="Sick">Sick</option>
            <option value="Holiday">Holiday</option>
          </select>

          {(searchQuery || deptFilter !== 'all' || statusFilter !== 'all' || monthFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDeptFilter('all');
                setStatusFilter('all');
                setMonthFilter('all');
                setCurrentPage(1);
              }}
              className="text-[11px] font-mono hover:underline text-amber-600 block pl-2"
            >
              Clear
            </button>
          )}

        </div>
      </div>

      {/* 5. summaries and historic grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 5a. Monthly summary (Left Column, col-span-1) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="font-sans font-bold text-slate-900 text-sm tracking-tight uppercase font-mono">Monthly Summaries</h3>
            <p className="text-[11px] text-slate-400">Total hours and sessions breakdown by calendar month</p>
          </div>

          {monthlyBreakdown.length === 0 ? (
            <div className="bg-white p-6 text-center text-xs text-slate-400 border border-slate-200 rounded-xl">
              No monthly activity logs available
            </div>
          ) : (
            monthlyBreakdown.map(mb => {
              const dateStr = mb.month + '-02';
              const nameLabel = new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              return (
                <div key={mb.month} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                    <span className="font-sans font-extrabold text-slate-950 text-xs">{nameLabel}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{mb.total} Sessions</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1.5">
                    <div className="bg-slate-50 rounded p-1 border border-slate-100">
                      <span className="font-mono font-bold block text-slate-700">{mb.totalHours}H</span>
                      <span className="text-[8px] text-slate-400 uppercase">Hours</span>
                    </div>
                    <div className="bg-emerald-50 rounded p-1 border border-emerald-100">
                      <span className="font-mono font-bold block text-emerald-800">{mb.presentCount}</span>
                      <span className="text-[8px] text-slate-400 uppercase">Pres</span>
                    </div>
                    <div className="bg-rose-50/50 rounded p-1 border border-rose-100">
                      <span className="font-mono font-bold block text-rose-800">{mb.absentCount}</span>
                      <span className="text-[8px] text-slate-400 uppercase">Abs</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {mb.sickCount > 0 && <span className="bg-amber-50 text-amber-800 border border-amber-100 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono">Sick: {mb.sickCount}d</span>}
                    {mb.leaveCount > 0 && <span className="bg-sky-50 text-sky-850 border border-sky-100 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono">Leave: {mb.leaveCount}d</span>}
                    {mb.holidayCount > 0 && <span className="bg-violet-50 text-violet-800 border border-violet-100 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono">Hol: {mb.holidayCount}d</span>}
                  </div>
                </div>
              );
            })
          )}

          {/* 5b. Annual aggregate (also in Left Column) */}
          <div className="pt-4">
            <div className="border-b border-slate-200 pb-2 mb-2">
              <h3 className="font-sans font-bold text-slate-900 text-sm tracking-tight uppercase font-mono">Annual Metrics Tracker</h3>
              <p className="text-[11px] text-slate-400">Aggregations categorized by fiscal/academic year</p>
            </div>

            {annualBreakdown.length === 0 ? (
              <div className="bg-white p-4 text-center text-xs text-slate-400 border border-slate-200 rounded-xl">
                No annual sessions recorded
              </div>
            ) : (
              annualBreakdown.map(ab => (
                <div key={ab.year} className="bg-slate-950 text-slate-300 p-4 rounded-xl border border-slate-800 shadow-sm space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                    <span className="text-white font-sans font-extrabold text-xs">Calendar Year {ab.year}</span>
                    <span className="bg-amber-500/20 text-amber-400 font-mono text-[9px] px-1.5 py-0.2 rounded border border-amber-500/30 font-bold uppercase">YEAR PROGRESSION</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] text-slate-400">
                    <div>
                      <span className="text-white font-mono font-bold block">{ab.total}</span>
                      <span>Logs</span>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-mono font-bold block">{ab.presentCount}</span>
                      <span>Present</span>
                    </div>
                    <div>
                      <span className="text-amber-400 font-mono font-bold block">{ab.sickCount + ab.leaveCount}</span>
                      <span>Excused</span>
                    </div>
                    <div>
                      <span className="text-rose-400 font-mono font-bold block">{ab.absentCount}</span>
                      <span>Absent</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* 5c. History Log List and Operations (Right Column, col-span-2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-sm tracking-tight uppercase font-mono">Attendance Log History</h3>
              <p className="text-[11px] text-slate-400">Auditable, session-by-session clock file transcripts</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{filteredRecords.length} items parsed</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-900 text-white font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3.5 text-left font-semibold">Date</th>
                  {isAdmin && <th scope="col" className="px-4 py-3.5 text-left font-semibold">Faculty Member</th>}
                  <th scope="col" className="px-4 py-3.5 text-center font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3.5 text-center font-semibold">Hours</th>
                  <th scope="col" className="px-4 py-3.5 text-center font-semibold">Mod History</th>
                  <th scope="col" className="px-4 py-3.5 text-center font-semibold">Log Score</th>
                  {isAdmin && <th scope="col" className="px-4 py-3.5 text-right font-semibold">Audit Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700 text-xs font-sans">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 4} className="px-4 py-12 text-center text-slate-400">
                      No matching attendance records in the human resource database ledger.
                    </td>
                  </tr>
                ) : (
                  currentItems.map(rec => (
                    <tr key={rec.attendanceId} className="hover:bg-slate-50 transition-colors">
                      {/* Date */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {rec.attendanceDate}
                      </td>

                      {/* Faculty info (Only for Admin view) */}
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="leading-tight">
                            <span className="font-sans font-extrabold text-slate-900 block max-w-[150px] truncate">{getEmployeeName(rec.employeeId)}</span>
                            <span className="text-[9px] text-slate-400 block font-mono">ID: {rec.employeeId} • Dept: {getEmployeeDept(rec.employeeId)}</span>
                          </div>
                        </td>
                      )}

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${getStatusBadgeClass(rec.status)}`}>
                          {rec.status}
                        </span>
                      </td>

                      {/* Working Hours */}
                      <td className="px-4 py-3 text-center font-mono font-semibold text-slate-800">
                        {rec.workingHours} hrs
                      </td>

                      {/* Mod History (Pill toggler to filter history trail) */}
                      <td className="px-4 py-3 text-center">
                        {overrideLogs.some(l => l.attendanceId === rec.attendanceId) ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHistoryId(rec.attendanceId);
                              setActiveSubTab('audit');
                            }}
                            className="inline-flex items-center space-x-1.5 text-amber-700 bg-amber-50 hover:bg-amber-150 border border-amber-200 rounded px-2 py-0.5 text-[9.5px] font-bold cursor-pointer font-mono"
                            title="View Change Overrides list"
                          >
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Overridden</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-350 italic font-mono">-</span>
                        )}
                      </td>

                      {/* Cumulative Score */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-extrabold text-amber-600 block">{rec.score}%</span>
                          <span className="text-[8px] text-slate-400 uppercase font-semibold font-sans">Cumulative</span>
                        </div>
                      </td>

                      {/* Actions (Only Admin) */}
                      {isAdmin && (
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            id={`btn-edit-rec-${rec.attendanceId}`}
                            onClick={() => handleOpenEditForm(rec)}
                            className="p-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 rounded transition-all inline-block"
                            title="Edit Record"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-delete-rec-${rec.attendanceId}`}
                            onClick={() => handleDeleteRecord(rec.attendanceId, rec.employeeId)}
                            className="p-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-605 hover:text-rose-800 rounded transition-all inline-block"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        </td>
                      )}

                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between font-mono text-[10.5px]">
                <span className="text-slate-500">
                  Showing entries <strong>{indexOfFirstItem + 1}</strong> to <strong>{Math.min(indexOfLastItem, filteredRecords.length)}</strong> of <strong>{filteredRecords.length}</strong>
                </span>

                <div className="flex space-x-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-1 border border-slate-200 bg-white rounded hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <span className="px-2 py-1 bg-slate-200 rounded text-slate-800 font-bold">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-1 border border-slate-200 bg-white rounded hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Quick instructions/compliance notes */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-[10px] text-slate-505 leading-normal space-y-1 font-sans">
            <span className="font-bold text-slate-800 block text-[11px]">Academic Compliance Guidelines</span>
            <p className="text-slate-500">
              * Official session scores are audited and filed monthly with the Faculty of Liberal Arts Board.
              <br />
              * Present records accrue score increments relative to planned sessions, capped at 100%. Excuse codes (Leave, Sick) preserve historical scoreboards but do not add points.
            </p>
          </div>

        </div>

      </div>
    </>
  )}

      {activeSubTab === 'audit' && (
        <div className="space-y-6 animate-fade-in text-slate-800" id="override-logs-panel">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-base font-sans font-bold text-slate-950 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Manual Override Audit Schema Logs</span>
              </h3>
              <p className="text-slate-500 text-xs">Search, review, and audit chronological attendance overrides corrected by system HR administrators.</p>
            </div>
            
            {(auditSearch || selectedHistoryId) && (
              <button
                onClick={() => { setAuditSearch(''); setSelectedHistoryId(null); }}
                className="text-xs px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded font-mono font-bold cursor-pointer"
              >
                Clear Active Filters
              </button>
            )}
          </div>

          {/* Active record specific filter banner */}
          {selectedHistoryId && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex justify-between items-center text-xs text-amber-900 animate-slide-down">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>
                  Filtering audits for Session ID: <strong className="font-mono bg-amber-100 px-1 py-0.5 rounded text-slate-800 font-extrabold">{selectedHistoryId}</strong> ({getEmployeeName(allRecords.find(r => r.attendanceId === selectedHistoryId)?.employeeId || '')})
                </span>
              </div>
              <button
                onClick={() => setSelectedHistoryId(null)}
                className="text-amber-800 hover:text-amber-950 underline font-mono font-bold cursor-pointer"
              >
                See All Trails
              </button>
            </div>
          )}

          {/* Audit Query Filter Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative text-xs w-full flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail by reason, employee, ID, oldValue, or administrator..."
                className="w-full text-xs pl-9 pr-4 py-3 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-amber-500 bg-slate-50"
              />
            </div>
          </div>

          {/* Audit Trail List/Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-950 text-white font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3.5 text-left font-semibold">Timestamp</th>
                  <th scope="col" className="px-4 py-3.5 text-left font-semibold">Faculty Member</th>
                  <th scope="col" className="px-4 py-3.5 text-left font-semibold">Previous State</th>
                  <th scope="col" className="px-4 py-3.5 text-left font-semibold">New Override State</th>
                  <th scope="col" className="px-4 py-3.5 text-left font-semibold">Authorized Action Reason</th>
                  <th scope="col" className="px-4 py-3.5 text-right font-semibold">Edited By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700 bg-white leading-normal">
                {(() => {
                  const filteredAuditLogs = overrideLogs.filter(log => {
                    const employeeName = getEmployeeName(log.employeeId).toLowerCase();
                    const query = auditSearch.toLowerCase();
                    
                    const matchesQuery = !auditSearch || 
                      log.reason.toLowerCase().includes(query) ||
                      log.editedBy.toLowerCase().includes(query) ||
                      log.employeeId.toLowerCase().includes(query) ||
                      employeeName.includes(query) ||
                      log.oldValue.toLowerCase().includes(query) ||
                      log.newValue.toLowerCase().includes(query);

                    const matchesHistoryId = !selectedHistoryId || log.attendanceId === selectedHistoryId;

                    return matchesQuery && matchesHistoryId;
                  });

                  if (filteredAuditLogs.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-sans">
                          No manual override audit logs match the specified parameters.
                        </td>
                      </tr>
                    );
                  }

                  return filteredAuditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      {/* Timestamp */}
                      <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-500">
                        {new Date(log.editedAt).toLocaleDateString()}
                        <span className="block text-[10px] text-slate-400">{new Date(log.editedAt).toLocaleTimeString()}</span>
                      </td>

                      {/* Faculty info */}
                      <td className="px-4 py-4">
                        <div className="font-sans font-extrabold text-slate-900 leading-tight">
                          {getEmployeeName(log.employeeId)}
                        </div>
                        <span className="font-mono text-[9.5px] text-slate-400 block mt-0.5">ID: {log.employeeId}</span>
                      </td>

                      {/* Previous Value */}
                      <td className="px-4 py-4 font-mono text-rose-800">
                        <span className="inline-block bg-rose-50 border border-rose-200 rounded px-2 py-0.5 font-semibold text-[10px]">
                          {log.oldValue}
                        </span>
                      </td>

                      {/* New Override Value */}
                      <td className="px-4 py-4 font-mono text-emerald-800">
                        <span className="inline-block bg-emerald-50 border border-emerald-250 rounded px-2 py-0.5 font-bold text-[10px]">
                          {log.newValue}
                        </span>
                      </td>

                      {/* Authorized Action Reason */}
                      <td className="px-4 py-4 max-w-sm">
                        <span className="font-sans font-semibold text-slate-800 block text-[11px] leading-relaxed break-words whitespace-pre-wrap">
                          {log.reason}
                        </span>
                        <span className="block text-[9.5px] text-slate-400 mt-1 font-mono">Reference Record ID: {log.attendanceId}</span>
                      </td>

                      {/* Edited By */}
                      <td className="px-4 py-4 text-right whitespace-nowrap font-mono text-slate-650 font-extrabold">
                        {log.editedBy}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-[10px] text-slate-500 leading-relaxed space-y-1 font-sans">
            <span className="font-bold text-slate-800 flex items-center space-x-1 font-mono text-[11px] uppercase tracking-wider">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Compliance Notice: Zero-Trust Auditing Policy</span>
            </span>
            <p>
              Under regulatory personnel procedures, all manual edits, status score correction loops, and override notes are cataloged synchronously at the point of action. Altering log records after commit is forbidden.
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
