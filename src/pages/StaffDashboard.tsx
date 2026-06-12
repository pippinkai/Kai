/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../lib/dataService';
import { AttendanceRecord, LeaveRequest, AttendanceStatus, LeaveType } from '../types';
import { AttendanceManagementModule } from '../components/AttendanceManagementModule';
import { 
  Clock, 
  MapPin, 
  FileText, 
  Calendar, 
  UserCheck, 
  AlertCircle, 
  CheckCircle,
  FileSpreadsheet,
  PlusCircle,
  XCircle,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Clock8,
  LogOut
} from 'lucide-react';

interface StaffDashboardProps {
  activeTab: 'dashboard' | 'attendance' | 'reports' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'attendance' | 'reports' | 'profile') => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ activeTab, setActiveTab }) => {
  const { user, updateUserContext, isLocalMode } = useAuth();
  
  // Dashboard states
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [time, setTime] = useState(new Date());

  // Check In form form states
  const [checkInLoc, setCheckInLoc] = useState('Liberal Arts Building A');
  const [remarks, setRemarks] = useState('');
  
  // Check Out states
  const [checkOutLoc, setCheckOutLoc] = useState('Liberal Arts Building A');
  const [workNotes, setWorkNotes] = useState('');

  // Leave Form states
  const [leaveType, setLeaveType] = useState<LeaveType>('sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveMessage, setLeaveMessage] = useState('');

  // Profile Edit states
  const [editName, setEditName] = useState(user?.name || '');
  const [editDept, setEditDept] = useState(user?.department || '');
  const [editPos, setEditPos] = useState(user?.position || '');
  const [profileMessage, setProfileMessage] = useState('');

  // Filter states for attendance history
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [attendanceSubMode, setAttendanceSubMode] = useState<'gate' | 'official'>('gate');

  // Trigger clock tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync data when tab loads
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const today = await dataService.getAttendanceToday(user.uid);
    const hist = await dataService.getUserAttendanceHistory(user.uid);
    const lvs = await dataService.getUserLeaveRequests(user.uid);
    setTodayRecord(today);
    setHistory(hist);
    setLeaves(lvs);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Define late threshold (e.g. 08:30:00)
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    let status: 'present' | 'late' = 'present';
    if (currentHour > 8 || (currentHour === 8 && currentMinute > 30)) {
      status = 'late';
    }

    const rec = await dataService.checkIn(
      user.uid,
      user.name,
      user.email,
      checkInLoc,
      remarks,
      status
    );
    setTodayRecord(rec);
    loadData();
    setRemarks('');
  };

  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await dataService.checkOut(user.uid, checkOutLoc, workNotes);
    setTodayRecord(null); // Will reset check in state
    loadData();
    setWorkNotes('');
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!startDate || !endDate || !leaveReason) {
      setLeaveMessage('Please complete all fields.');
      return;
    }

    await dataService.createLeaveRequest(
      user.uid,
      user.name,
      user.email,
      leaveType,
      startDate,
      endDate,
      leaveReason
    );

    setLeaveMessage('Leave request submitted successfully. Awaiting HR review.');
    setStartDate('');
    setEndDate('');
    setLeaveReason('');
    loadData();

    // Clear alert message after 4s
    setTimeout(() => setLeaveMessage(''), 4000);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!editName) {
      setProfileMessage('Name cannot be empty.');
      return;
    }

    await updateUserContext({
      name: editName,
      department: editDept,
      position: editPos
    });
    setProfileMessage('University profile catalog updated successfully.');
    loadData();
    setTimeout(() => setProfileMessage(''), 4000);
  };

  if (!user) return null;

  // Statistics calculation
  const totalDaysLog = history.length;
  const lateCount = history.filter(h => h.status === 'late').length;
  const onTimeCount = history.filter(h => h.status === 'present').length;
  const onLeaveCount = history.filter(h => h.status === 'on-leave').length;
  const onTimePercentage = totalDaysLog > 0 ? Math.round((onTimeCount / totalDaysLog) * 100) : 100;

  // Filtered History
  const filteredHistory = history.filter(record => {
    const matchesDate = dateFilter ? record.date.includes(dateFilter) : true;
    const matchesStatus = statusFilter !== 'all' ? record.status === statusFilter : true;
    return matchesDate && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="staff-dashboard">
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Block */}
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white grid grid-cols-1 md:grid-cols-2 gap-6 items-center shadow-md mb-8">
          <div>
            <span className="bg-amber-500/20 text-amber-400 font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded border border-amber-500/30">
              FACULTY CREDENTIALS AUTHORIZED
            </span>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight mt-3 text-white">
              Sawasdee, {user.name}
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 font-sans leading-relaxed">
              Welcome to the Faculty of Liberal Arts Portal. Check your schedule, record log events, or submit leave requests below.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
              <span className="bg-slate-800 px-2 py-1 rounded">Dept: {user.department}</span>
              <span className="bg-slate-800 px-2 py-1 rounded">Pos: {user.position}</span>
              <span className="bg-slate-800 px-2 py-1 rounded">Level: {user.role.toUpperCase()}</span>
            </div>
          </div>

          <div className="bg-slate-850/60 p-5 rounded-xl border border-slate-800 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-amber-500 font-mono tracking-wider uppercase">Live Portal Clock</span>
            <div className="text-3xl sm:text-4xl font-sans font-extrabold text-slate-100 tracking-tight mt-1 flex items-center space-x-1">
              <Clock8 className="w-8 h-8 text-amber-500 animate-pulse mr-2" />
              <span>{time.toLocaleTimeString()}</span>
            </div>
            <span className="text-xs text-slate-400 mt-1.5 font-sans">
              {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* -------------------- TAB 1: GENERAL OVERVIEW -------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in" id="tab-overview">
            
            {/* Quick Statistics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-900 rounded-lg">
                  <UserCheck className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Attendance Rate</p>
                  <p className="text-xl font-bold text-slate-900">{onTimePercentage}%</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-amber-50 text-amber-900 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Present Days</p>
                  <p className="text-xl font-bold text-slate-900">{onTimeCount + lateCount} Days</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-rose-50 text-rose-900 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Late Arrivals</p>
                  <p className="text-xl font-bold text-slate-900">{lateCount} Days</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-sky-50 text-sky-900 rounded-lg">
                  <Calendar className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Active Leaves</p>
                  <p className="text-xl font-bold text-slate-900">{leaves.filter(l => l.status === 'approved').length} Approved</p>
                </div>
              </div>

            </div>

            {/* Core Action: Check In / Out Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-sans font-bold text-slate-900 text-lg">Daily Attendance Gate</h3>
                    <p className="text-slate-500 text-xs">Record check-in and check-out logs for daily compliance.</p>
                  </div>
                  <div>
                    {todayRecord ? (
                      <span className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 border border-emerald-100">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                        <span>Checked In ({todayRecord.checkIn.substring(0, 5)})</span>
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                        Ready To Log
                      </span>
                    )}
                  </div>
                </div>

                {/* Today Attendance state render */}
                {!todayRecord ? (
                  <form onSubmit={handleCheckIn} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 font-mono uppercase tracking-wider">Locational Terminal</label>
                        <select
                          id="check-in-location-select"
                          value={checkInLoc}
                          onChange={(e) => setCheckInLoc(e.target.value)}
                          className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="Liberal Arts Building A">Liberal Arts Building A (RFID Reader)</option>
                          <option value="Liberal Arts Lecture Hall 304">Lecture Hall Space (304 RFID)</option>
                          <option value="Office of the Dean Reception">Office of the Dean Desk</option>
                          <option value="Language Laboratory Hub">Language Laboratory Hub (Building B)</option>
                          <option value="Offsite Research / Approved Seminar">Offsite / Authorized Travel</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 font-mono uppercase tracking-wider">Activity/Remarks Note</label>
                        <input
                          type="text"
                          id="remarks-input"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="e.g. Conduct teaching ENG101, admin work"
                          className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        id="btn-confirm-checkin"
                        className="w-full py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors flex items-center justify-center space-x-2 shadow"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Perform Check-In Authentication</span>
                      </button>
                      <p className="text-[10px] text-center text-slate-400 mt-2 font-mono">
                        Standard faculty threshold: 08:30 AM (late metrics are calculated automatically)
                      </p>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCheckOut} className="space-y-4">
                    <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100 flex items-start space-x-3 text-xs text-amber-900">
                      <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <strong className="font-semibold block">Signed In Successfully</strong>
                        Logged in at <span className="font-mono">{todayRecord.checkIn}</span> today from <span className="font-semibold">{todayRecord.checkInLocation}</span>. Please complete your duties and register your checkout before leaving the campus.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 font-mono uppercase tracking-wider">Departure Terminal</label>
                        <select
                          id="check-out-location-select"
                          value={checkOutLoc}
                          onChange={(e) => setCheckOutLoc(e.target.value)}
                          className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="Liberal Arts Building A">Liberal Arts Building A (RFID Reader)</option>
                          <option value="Office of the Dean Reception">Office of the Dean Desk</option>
                          <option value="Language Laboratory Hub">Language Laboratory Hub (Building B)</option>
                          <option value="Offsite Research / Approved Seminar">Offsite Checkout</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 font-mono uppercase tracking-wider">Duties Completed / Work summary</label>
                        <input
                          type="text"
                          id="worknotes-input"
                          value={workNotes}
                          onChange={(e) => setWorkNotes(e.target.value)}
                          placeholder="e.g. Completed lecture sessions, grading finalized"
                          className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          required
                        />
                      </div>

                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        id="btn-confirm-checkout"
                        className="w-full py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2 shadow-md"
                      >
                        <LogOut className="w-4 h-4 text-amber-500" />
                        <span>Perform Check-Out Verification</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Status and Active Leaf status list */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                <h3 className="font-sans font-bold text-slate-900 text-base">Recent Leaves & Actions</h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {leaves.length === 0 ? (
                    <div className="py-4 text-center text-slate-400">
                      No leaves requested this semester
                    </div>
                  ) : (
                    leaves.slice(0, 3).map(leaf => (
                      <div key={leaf.id} className="py-3 flex justify-between items-start">
                        <div>
                          <p className="font-semibold capitalize text-slate-800">{leaf.leaveType} Leave</p>
                          <p className="text-slate-400 text-[10px] font-mono mt-0.5">{leaf.startDate} to {leaf.endDate}</p>
                        </div>
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            leaf.status === 'approved' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                              : leaf.status === 'rejected'
                              ? 'bg-rose-50 text-rose-800 border-rose-100'
                              : 'bg-amber-50 text-amber-800 border-amber-100'
                          }`}>
                            {leaf.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  id="tab-btn-goToReports"
                  onClick={() => setActiveTab('reports')}
                  className="w-full mt-2 py-2 px-3 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors rounded text-xs font-semibold flex items-center justify-center space-x-1"
                >
                  <span>Apply for Leaves or Reports</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        )}

        {/* -------------------- TAB 2: ATTENDANCE HISTORY & LOGS -------------------- */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-fade-in" id="tab-attendance">
            
            {/* Tab Navigation Toggle */}
            <div className="flex border-b border-slate-200 gap-1" id="subtabs-attendance-nav">
              <button
                type="button"
                id="btn-subtab-gate"
                onClick={() => setAttendanceSubMode('gate')}
                className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  attendanceSubMode === 'gate'
                    ? 'border-amber-500 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Daily RFID Gate Timesheets
              </button>
              <button
                type="button"
                id="btn-subtab-official"
                onClick={() => setAttendanceSubMode('official')}
                className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  attendanceSubMode === 'official'
                    ? 'border-amber-500 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Official Session Attendance & Scores
              </button>
            </div>

            {attendanceSubMode === 'official' ? (
              <AttendanceManagementModule isAdmin={false} userEmail={user.email} />
            ) : (
              <>
                {/* Header */}
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-xl">Faculty Timesheet History</h3>
                  <p className="text-slate-500 text-xs">Review or audit your past clock-in arrivals and physical departure parameters.</p>
                </div>

                {/* Filter Panel */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider font-mono">Filter Logs</span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="all">All Arrival Statuses</option>
                      <option value="present">Present (On-Time)</option>
                      <option value="late">Late Arrival</option>
                      <option value="on-leave">On Approved Leave</option>
                    </select>

                    <button
                      onClick={() => { setDateFilter(''); setStatusFilter('all'); }}
                      className="text-[11px] font-mono hover:underline text-amber-600"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">Date</th>
                          <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">In</th>
                          <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider tracking-widest font-mono">Out</th>
                          <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">Terminal Loc</th>
                          <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">Parameters</th>
                          <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">Work Notes / Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100 text-xs text-slate-700">
                        {filteredHistory.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-sans">
                              No attendance records matching active filters.
                            </td>
                          </tr>
                        ) : (
                          filteredHistory.map((rec) => (
                            <tr key={rec.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 font-mono">
                                {rec.date}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-mono text-emerald-600 font-semibold">
                                {rec.checkIn}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-500">
                                {rec.checkOut || <span className="text-amber-500 font-sans font-medium">Ongoing...</span>}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{rec.checkInLocation}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                                  rec.status === 'present'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : rec.status === 'late'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-slate-50 text-slate-800 border-slate-200'
                                }`}>
                                  {rec.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="line-clamp-2 text-slate-500 max-w-xs leading-normal">
                                  {rec.workNotes || rec.remarks || <span className="text-slate-300 italic">No notes</span>}
                                </p>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

          </div>
        )}

        {/* -------------------- TAB 3: LEAVES & REPORTS SUMMARY -------------------- */}
        {activeTab === 'reports' && (
          <div className="space-y-8 animate-fade-in" id="tab-reports">
            
            {/* Header */}
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-xl font-bold">Leave Requests & Timesheets</h3>
              <p className="text-slate-500 text-xs">Request authorized leave schedules or check active submission approval records.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form to Request Leave */}
              <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h4 className="font-sans font-bold text-slate-900 text-base">Request Absences / Leave</h4>
                
                {leaveMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg font-medium">
                    {leaveMessage}
                  </div>
                )}

                <form onSubmit={handleLeaveSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500">Leave Categorization</label>
                    <select
                      id="leave-type-select"
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none"
                    >
                      <option value="sick">Sick Leave (Medical certificate)</option>
                      <option value="vacation">Vacation Leave</option>
                      <option value="business">Business Leave</option>
                      <option value="maternity">Maternity/Paternity Leave</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500">Starting Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500">Concluding Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500">Reason / Description</label>
                    <textarea
                      required
                      rows={3}
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="Specify details, class cover plans etc."
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-leave-request"
                    className="w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors flex items-center justify-center space-x-1 bg-amber"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Submit Leave Request</span>
                  </button>
                </form>
              </div>

              {/* Leave Requests Listing */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Printable Timesheet Summary Cover */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                  <div className="space-y-1 max-w-sm">
                    <strong className="text-slate-800 font-semibold block text-sm">Download Timesheet Records</strong>
                    <span className="text-slate-500 inline-block">
                      Compile all verified sign-in/out records into standard university-certified format for audit.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      alert('Generating document... Initializing print dialogue for ' + user.name + '.');
                      window.print();
                    }}
                    id="btn-print-timesheet"
                    className="px-4 py-2 border border-slate-900 bg-slate-950 text-white rounded hover:bg-slate-900 transition-colors font-semibold flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                    <span>Print PDF Sheet</span>
                  </button>
                </div>

                {/* Submissions Detail */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="font-sans font-bold text-slate-900 text-base">Your Active Submissions History</h4>
                  
                  <div className="space-y-3">
                    {leaves.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center italic">No submissions made yet.</p>
                    ) : (
                      leaves.map(req => (
                        <div key={req.id} className="p-4 rounded-lg bg-slate-50/50 border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs leading-relaxed">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold uppercase text-slate-800">{req.leaveType} Leave</span>
                              <span className="text-slate-400">|</span>
                              <span className="text-slate-500 font-mono">Ref ID: {req.id}</span>
                            </div>
                            <p className="text-slate-600 font-semibold font-mono">Dates: {req.startDate} to {req.endDate}</p>
                            <p className="text-slate-500 max-w-md"><strong className="text-slate-600">Reason:</strong> {req.reason}</p>
                            {req.reviewedBy && (
                              <p className="text-[10px] text-slate-400 block font-sans">
                                Reviewed by {req.reviewedBy} at {new Date(req.reviewedAt || '').toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          <div className="sm:text-right">
                            <span className={`px-2.5 py-1 rounded text-[11px] font-bold border uppercase block text-center ${
                              req.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-250 font-semibold'
                                : req.status === 'rejected'
                                ? 'bg-rose-50 text-rose-800 border-rose-250 font-semibold'
                                : 'bg-amber-50 text-amber-800 border-amber-250 font-semibold'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* -------------------- TAB 4: PROFILE SETTINGS -------------------- */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 animate-fade-in" id="tab-profile">
            
            {/* Header */}
            <div className="border-b border-slate-100 pb-5 mb-5 flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-amber-500 flex items-center justify-center font-sans font-bold text-xl text-amber-500 shadow overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-lg">{user.name}</h3>
                <p className="text-slate-500 text-xs">University ID: {user.uid} • {user.email}</p>
              </div>
            </div>

            {profileMessage && (
              <div className="mb-5 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg font-medium">
                {profileMessage}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
              
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 font-mono uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  required
                  id="profile-name-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 font-mono uppercase tracking-wider block">Faculty Department</label>
                  <select
                    id="profile-department-select"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="English & Linguistics">Department of English & Linguistics</option>
                    <option value="Thai Language & Culture">Department of Thai Language & Culture</option>
                    <option value="History & Philosophy">Department of History & Philosophy</option>
                    <option value="Sociology & Anthropology">Department of Sociology & Anthropology</option>
                    <option value="Office of the Dean">Office of the Dean</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 font-mono uppercase tracking-wider block">Academic Position</label>
                  <input
                    type="text"
                    required
                    id="profile-position-input"
                    value={editPos}
                    onChange={(e) => setEditPos(e.target.value)}
                    placeholder="e.g. Lecturer, Asst. Prof."
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

              </div>

              <div className="border-t border-slate-100 pt-5 mt-5 flex justify-end space-x-3">
                <button
                  type="submit"
                  id="btn-save-profile"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold"
                >
                  Save Profile Configuration
                </button>
              </div>

            </form>

          </div>
        )}

      </div>

      {/* Footer banner */}
      <div className="bg-slate-105 py-4 border-t border-slate-200 text-center text-[11px] text-slate-400 font-sans">
        Faculty of Liberal Arts Attendance Monitor Dashboard • Thailand Higher Education Compliance
      </div>
    </div>
  );
};
