/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../lib/dataService';
import { AttendanceRecord, LeaveRequest, UserProfile, Employee, AttendanceRecordNew } from '../types';
import { AttendanceManagementModule } from '../components/AttendanceManagementModule';
import { 
  Users, 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  FileSpreadsheet, 
  Filter, 
  Search, 
  FileText, 
  Building,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Download,
  Plus,
  Edit,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Award,
  Database
} from 'lucide-react';

import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface HRDashboardProps {
  activeTab: 'dashboard' | 'attendance' | 'reports' | 'profile' | 'employees';
  setActiveTab: (tab: 'dashboard' | 'attendance' | 'reports' | 'profile' | 'employees') => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  
  // Data State
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Real-Time Analytics and Dashboard state
  const [allAttendanceRecordsNew, setAllAttendanceRecordsNew] = useState<AttendanceRecordNew[]>([]);
  const [allEmployeesNew, setAllEmployeesNew] = useState<Employee[]>([]);
  const [activeReportSubTab, setActiveReportSubTab] = useState<'dashboard' | 'roster' | 'legacy'>('dashboard');
  const [dashboardDate, setDashboardDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterDept, setRosterDept] = useState('all');
  const [rosterSortField, setRosterSortField] = useState<'employeeId' | 'fullName' | 'department' | 'attendanceRate' | 'score'>('fullName');
  const [rosterSortOrder, setRosterSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter States
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [attendanceSubMode, setAttendanceSubMode] = useState<'gate' | 'official'>('gate');
  const [viewDate, setViewDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Analytics Report State
  const [reportDept, setReportDept] = useState('English & Linguistics');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);

  // Profile Edit states for Admin
  const [editName, setEditName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState('');

  // Employee Management States
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('all');
  const [empActiveFilter, setEmpActiveFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [empSortField, setEmpSortField] = useState<keyof Employee>('employeeId');
  const [empSortOrder, setEmpSortOrder] = useState<'asc' | 'desc'>('asc');
  const [empCurrentPage, setEmpCurrentPage] = useState(1);
  const empItemsPerPage = 5;

  // Add/Edit Form State
  const [empFormMode, setEmpFormMode] = useState<'none' | 'add' | 'edit' | 'import'>('none');
  const [editingEmployeeId, setEditingEmployeeId] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDepartment, setFormDepartment] = useState('English & Linguistics');
  const [formPlannedSessions, setFormPlannedSessions] = useState<number>(18);
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // CSV Import States
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<{
    employeeId: string;
    fullName: string;
    email: string;
    department: string;
    plannedSessions: number;
    active: boolean;
    isValid: boolean;
    errors: string[];
    isUpdate: boolean;
    rowNum: number;
  }[]>([]);
  const [importSummary, setImportSummary] = useState<{
    inserted: number;
    updated: number;
    failed: number;
    total: number;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadHRData();
  }, [refreshTrigger]);

  useEffect(() => {
    const unsubscribeAttendance = dataService.subscribeToAttendanceRecords((records) => {
      setAllAttendanceRecordsNew(records);
    }, (err) => {
      console.error("Real-time attendance record sync failed:", err);
    });

    const unsubscribeEmployees = dataService.subscribeToEmployees((emps) => {
      setAllEmployeesNew(emps);
    }, (err) => {
      console.error("Real-time employees database sync failed:", err);
    });

    return () => {
      unsubscribeAttendance();
      unsubscribeEmployees();
    };
  }, []);

  const loadHRData = async () => {
    const att = await dataService.getAllAttendance();
    const lvs = await dataService.getAllLeaveRequests();
    const usr = await dataService.getAllUsers();
    setAllAttendance(att);
    setAllLeaves(lvs);
    setAllUsers(usr);
    try {
      const emps = await dataService.getAllEmployees();
      setAllEmployees(emps);
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };

  const handleApproveLeave = async (id: string) => {
    if (!user) return;
    await dataService.reviewLeaveRequest(id, user.email, 'approved');
    setRefreshTrigger(p => p + 1);
  };

  const handleRejectLeave = async (id: string) => {
    if (!user) return;
    await dataService.reviewLeaveRequest(id, user.email, 'rejected');
    setRefreshTrigger(p => p + 1);
  };

  // Employee CRUD handlers
  const handleOpenAddForm = () => {
    setFormEmployeeId('');
    setFormFullName('');
    setFormEmail('');
    setFormDepartment('English & Linguistics');
    setFormPlannedSessions(18);
    setFormActive(true);
    setFormError('');
    setFormSuccess('');
    setEmpFormMode('add');
  };

  const handleOpenEditForm = (emp: Employee) => {
    setEditingEmployeeId(emp.employeeId);
    setFormEmployeeId(emp.employeeId);
    setFormFullName(emp.fullName);
    setFormEmail(emp.email);
    setFormDepartment(emp.department);
    setFormPlannedSessions(emp.plannedSessions);
    setFormActive(emp.active);
    setFormError('');
    setFormSuccess('');
    setEmpFormMode('edit');
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Form Validations
    const trimmedId = formEmployeeId.trim();
    const trimmedName = formFullName.trim();
    const trimmedEmail = formEmail.trim();

    if (!trimmedId) {
      setFormError('Employee ID is required.');
      return;
    }

    if (!trimmedName) {
      setFormError('Full Name is required.');
      return;
    }

    if (!trimmedEmail) {
      setFormError('Email is required.');
      return;
    }

    if (!trimmedEmail.toLowerCase().endsWith('@pnu.ac.th')) {
      setFormError('Email must end with @pnu.ac.th');
      return;
    }

    if (formPlannedSessions <= 0 || isNaN(formPlannedSessions)) {
      setFormError('Planned Sessions must be greater than 0.');
      return;
    }

    const employeeData: Employee = {
      employeeId: trimmedId,
      fullName: trimmedName,
      email: trimmedEmail,
      department: formDepartment,
      plannedSessions: Number(formPlannedSessions),
      active: formActive,
      createdAt: empFormMode === 'add' ? new Date().toISOString() : allEmployees.find(emp => emp.employeeId === editingEmployeeId)?.createdAt || new Date().toISOString()
    };

    try {
      if (empFormMode === 'add') {
        const existing = allEmployees.some(item => item.employeeId.toLowerCase() === trimmedId.toLowerCase());
        if (existing) {
          setFormError(`Employee ID "${trimmedId}" is already registered. Please provide a unique ID.`);
          return;
        }

        await dataService.createEmployee(employeeData);
        setFormSuccess('Employee created successfully!');
      } else {
        if (trimmedId.toLowerCase() !== editingEmployeeId.toLowerCase()) {
          const existing = allEmployees.some(item => item.employeeId.toLowerCase() === trimmedId.toLowerCase());
          if (existing) {
            setFormError(`Employee ID "${trimmedId}" is already registered. Please provide a unique ID.`);
            return;
          }
        }

        await dataService.updateEmployee(editingEmployeeId, employeeData);
        setFormSuccess('Employee updated successfully!');
      }

      setRefreshTrigger(p => p + 1);
      setTimeout(() => {
        setEmpFormMode('none');
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving the employee record.');
    }
  };

  const handleDeleteEmployee = async (empId: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete employee with ID: ${empId}?`);
    if (!confirmed) return;

    try {
      await dataService.deleteEmployee(empId);
      setRefreshTrigger(p => p + 1);
    } catch (err) {
      console.error("Failed to delete employee:", err);
    }
  };

  // CSV Import handlers
  const handleOpenImportMode = () => {
    setImportFile(null);
    setImportPreviewData([]);
    setImportSummary(null);
    setFormError('');
    setFormSuccess('');
    setEmpFormMode('import');
  };

  const parseCSVString = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    
    // Normalize newlines
    let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      const nextChar = normalized[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          cell += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(cell);
        cell = '';
      } else if (char === '\n' && !inQuotes) {
        row.push(cell);
        if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
          result.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
    
    if (cell || row.length > 0) {
      row.push(cell);
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
        result.push(row);
      }
    }
    
    return result;
  };

  const processCSVFile = (file: File) => {
    setImportFile(file);
    setImportSummary(null);
    setFormError('');
    setFormSuccess('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setFormError('Failed to read CSV file content or file is empty.');
        return;
      }
      
      try {
        const parsedRows = parseCSVString(text);
        if (parsedRows.length === 0) {
          setFormError('No data rows found in the CSV file.');
          return;
        }

        const headerRow = parsedRows[0];
        let idColIdx = 0;
        let nameColIdx = 1;
        let emailColIdx = 2;
        let deptColIdx = 3;
        let sessionsColIdx = 4;
        let hasHeader = false;

        const keys = headerRow.map(h => h.trim().toLowerCase());
        const hasId = keys.some(k => k.includes('employeeid') || k === 'id');
        const hasEmail = keys.some(k => k.includes('email'));
        
        if (hasId || hasEmail) {
          hasHeader = true;
          idColIdx = keys.findIndex(k => k.includes('employeeid') || k === 'id');
          if (idColIdx === -1) idColIdx = 0;
          
          nameColIdx = keys.findIndex(k => k.includes('name') || k.includes('fullname') || k.includes('full name'));
          if (nameColIdx === -1) nameColIdx = 1;

          emailColIdx = keys.findIndex(k => k.includes('email'));
          if (emailColIdx === -1) emailColIdx = 2;

          deptColIdx = keys.findIndex(k => k.includes('dept') || k.includes('department'));
          if (deptColIdx === -1) deptColIdx = 3;

          sessionsColIdx = keys.findIndex(k => k.includes('session') || k.includes('plannedsessions') || k.includes('planned'));
          if (sessionsColIdx === -1) sessionsColIdx = 4;
        }

        const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;
        
        const previews = dataRows.map((row, index) => {
          const rowNum = index + (hasHeader ? 2 : 1);
          const getVal = (colIdx: number) => (row[colIdx] || '').trim();

          const employeeId = getVal(idColIdx);
          const fullName = getVal(nameColIdx);
          const email = getVal(emailColIdx);
          const department = getVal(deptColIdx) || 'English & Linguistics';
          const rawSessions = getVal(sessionsColIdx);
          const plannedSessions = parseInt(rawSessions, 10);

          const errors: string[] = [];

          if (!employeeId) {
            errors.push('Employee ID is required.');
          }
          if (!fullName) {
            errors.push('Full Name is required.');
          }
          if (!email) {
            errors.push('Email is required.');
          } else if (!email.toLowerCase().endsWith('@pnu.ac.th')) {
            errors.push('Email must end with @pnu.ac.th');
          }
          
          if (isNaN(plannedSessions)) {
            errors.push('Planned Sessions must be numeric.');
          } else if (plannedSessions <= 0) {
            errors.push('Planned Sessions must be greater than 0.');
          }

          const isUpdate = allEmployees.some(emp => emp.employeeId.toLowerCase() === employeeId.toLowerCase());

          return {
            employeeId,
            fullName,
            email,
            department: department || 'English & Linguistics',
            plannedSessions: isNaN(plannedSessions) ? 0 : plannedSessions,
            active: true,
            isValid: errors.length === 0,
            errors,
            isUpdate,
            rowNum
          };
        });

        const seenIds = new Set<string>();
        previews.forEach((p) => {
          if (p.employeeId) {
            const key = p.employeeId.toLowerCase();
            if (seenIds.has(key)) {
              p.isValid = false;
              p.errors.push(`Duplicate Employee ID "${p.employeeId}" detected within this CSV.`);
            } else {
              seenIds.add(key);
            }
          }
        });

        setImportPreviewData(previews);
      } catch (err) {
        console.error(err);
        setFormError('Failed to parse CSV file properly.');
      }
    };
    reader.onerror = () => {
      setFormError('FileReader error occurred while decoding CSV.');
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        processCSVFile(file);
      } else {
        setFormError('Only CSV (.csv) files are supported.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processCSVFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    const validRows = importPreviewData.filter(d => d.isValid);
    if (validRows.length === 0) {
      setFormError('No valid rows found to import.');
      return;
    }

    setIsImporting(true);
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (const r of validRows) {
      const employee: Employee = {
        employeeId: r.employeeId,
        fullName: r.fullName,
        email: r.email,
        department: r.department,
        plannedSessions: r.plannedSessions,
        active: r.active,
        createdAt: new Date().toISOString()
      };

      try {
        if (r.isUpdate) {
          await dataService.updateEmployee(r.employeeId, employee);
          updated++;
        } else {
          await dataService.createEmployee(employee);
          inserted++;
        }
      } catch (err) {
        console.error(`Row fail ${r.employeeId}:`, err);
        failed++;
      }
    }

    setImportSummary({
      inserted,
      updated,
      failed,
      total: validRows.length
    });
    setIsImporting(false);
    setFormSuccess(`Import summary applied successfully.`);
    setRefreshTrigger(p => p + 1);
  };

  const handleResetImport = () => {
    setImportFile(null);
    setImportPreviewData([]);
    setImportSummary(null);
    setFormError('');
    setFormSuccess('');
    setEmpFormMode('none');
  };

  const generateDepartmentReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    setTimeout(() => {
      // Extract records belonging to chosen department
      const deptUsers = allUsers.filter(u => u.department === reportDept);
      const userEmails = deptUsers.map(u => u.email.toLowerCase());
      
      const deptAttendance = allAttendance.filter(a => 
        userEmails.includes(a.email.toLowerCase())
      );

      const totalSignIns = deptAttendance.length;
      const lateArrivals = deptAttendance.filter(a => a.status === 'late').length;
      const onTimeArrivals = deptAttendance.filter(a => a.status === 'present').length;
      const pendingLeaves = allLeaves.filter(l => 
        userEmails.includes(l.email.toLowerCase()) && l.status === 'pending'
      ).length;

      setGeneratedReport({
        department: reportDept,
        staffCount: deptUsers.length,
        totalSignIns,
        lateArrivals,
        onTimeArrivals,
        pendingLeaves,
        onTimeRate: totalSignIns > 0 ? Math.round((onTimeArrivals / totalSignIns) * 100) : 100,
        staffList: deptUsers
      });
      setIsGenerating(false);
    }, 800);
  };

  if (!user) return null;

  // Global HR metrics calculation (for today)
  const todayRecords = allAttendance.filter(a => a.date === viewDate);
  const todayPresentCount = todayRecords.filter(a => a.status === 'present').length;
  const todayLateCount = todayRecords.filter(a => a.status === 'late').length;
  const todayCheckIns = todayRecords.length;

  const totalRegisteredStaff = allUsers.filter(u => u.role === 'staff' || u.role === 'STAFF').length;
  const pendingLeavesCount = allLeaves.filter(l => l.status === 'pending').length;

  // Filtered attendance records to display
  const filteredRecords = allAttendance.filter(rec => {
    // Search query matches user name or email
    const matchesKeyword = searchQuery
      ? rec.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        rec.email.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // Status match
    const matchesStatus = statusFilter !== 'all' ? rec.status === statusFilter : true;
    
    // Dept match (we must match record email to the user profiles array)
    let matchesDept = true;
    if (deptFilter !== 'all') {
      const uProfile = allUsers.find(u => u.email.toLowerCase() === rec.email.toLowerCase());
      matchesDept = uProfile ? uProfile.department === deptFilter : false;
    }

    return matchesKeyword && matchesStatus && matchesDept;
  });

  // Real-Time Analytics computations
  const latestRecordsMap = new Map<string, AttendanceRecordNew>();
  allAttendanceRecordsNew.forEach(r => {
    if (!latestRecordsMap.has(r.employeeId)) {
      latestRecordsMap.set(r.employeeId, r);
    }
  });

  const employeeScores = allEmployeesNew.map(emp => {
    const latestRec = latestRecordsMap.get(emp.employeeId);
    return latestRec ? latestRec.score : 100;
  });

  const avgScore = employeeScores.length > 0
    ? parseFloat((employeeScores.reduce((sum, s) => sum + s, 0) / employeeScores.length).toFixed(2))
    : 100.00;

  // Present/Absent Today counts for standard New records
  const newTodayRecords = allAttendanceRecordsNew.filter(r => r.attendanceDate === dashboardDate);
  const newTodayPresent = newTodayRecords.filter(r => r.status === 'Present').length;
  const newTodayAbsent = newTodayRecords.filter(r => r.status === 'Absent').length;

  // Chart datasets
  const deptList = [
    "English & Linguistics",
    "Thai Language & Culture",
    "History & Philosophy",
    "Sociology & Anthropology",
    "Office of the Dean"
  ];

  const deptComparisonData = deptList.map(dept => {
    const deptStaff = allEmployeesNew.filter(e => e.department === dept);
    const staffIds = deptStaff.map(e => e.employeeId);
    
    const scores = deptStaff.map(emp => {
      const latestRec = latestRecordsMap.get(emp.employeeId);
      return latestRec ? latestRec.score : 100;
    });
    const avgDeptScore = scores.length > 0
      ? parseFloat((scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1))
      : 100;

    const todayDeptRecs = allAttendanceRecordsNew.filter(r => r.attendanceDate === dashboardDate && staffIds.includes(r.employeeId));
    const presentCount = todayDeptRecs.filter(r => r.status === 'Present').length;
    const absentCount = todayDeptRecs.filter(r => r.status === 'Absent').length;

    // get last word or abbreviation for a clean chart axis label
    const shortLabel = dept.split('&').map(w => w.trim().split(' ')[0]).join(' & ');

    return {
      department: shortLabel,
      fullName: dept,
      "Average Score": avgDeptScore,
      "Present": presentCount,
      "Absent": absentCount,
      "Total Staff": deptStaff.length
    };
  });

  // Trend over last 7 dates in new records
  const trendDates = Array.from(new Set(allAttendanceRecordsNew.map(r => r.attendanceDate)))
    .sort()
    .slice(-7);

  const attendanceTrendData = trendDates.map(dateStr => {
    const recsOnDate = allAttendanceRecordsNew.filter(r => r.attendanceDate === dateStr);
    const total = recsOnDate.length;
    const presentCount = recsOnDate.filter(r => r.status === 'Present').length;
    const rate = total > 0 ? parseFloat(((presentCount / total) * 100).toFixed(1)) : 100;
    
    return {
      date: dateStr,
      "Attendance Rate (%)": rate,
      PresentCount: presentCount,
      TotalSigned: total
    };
  });

  // Pie chart statuses counts on dashboardDate
  const pieAllRecs = newTodayRecords.length > 0 ? newTodayRecords : allAttendanceRecordsNew;
  const statusLabels = {
    Present: pieAllRecs.filter(r => r.status === 'Present').length,
    Absent: pieAllRecs.filter(r => r.status === 'Absent').length,
    Sick: pieAllRecs.filter(r => r.status === 'Sick').length,
    Leave: pieAllRecs.filter(r => r.status === 'Leave').length,
    Holiday: pieAllRecs.filter(r => r.status === 'Holiday').length,
  };

  const pieData = [
    { name: 'Present', value: statusLabels.Present, color: '#10B981' },
    { name: 'Absent', value: statusLabels.Absent, color: '#EF4444' },
    { name: 'Sick', value: statusLabels.Sick, color: '#F59E0B' },
    { name: 'Leave', value: statusLabels.Leave, color: '#F59E0B' },
    { name: 'Holiday', value: statusLabels.Holiday, color: '#6366F1' },
  ].filter(p => p.value > 0);

  // Computed live roster list
  const rosterRows = allEmployeesNew.map(emp => {
    const empRecs = allAttendanceRecordsNew.filter(r => r.employeeId === emp.employeeId);
    const totalDays = empRecs.length;
    const presentDays = empRecs.filter(r => r.status === 'Present').length;
    const rateVal = totalDays > 0 ? parseFloat(((presentDays / totalDays) * 100).toFixed(1)) : 0;
    
    const latestRec = empRecs.sort((a,b) => b.attendanceDate.localeCompare(a.attendanceDate))[0];
    const scoreVal = latestRec ? latestRec.score : 100;

    return {
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      department: emp.department,
      attendanceRate: rateVal,
      score: scoreVal
    };
  });

  // Filter & sort roster
  const filteredRoster = rosterRows.filter(row => {
    const matchesSearch = row.fullName.toLowerCase().includes(rosterSearch.toLowerCase()) || 
                          row.employeeId.toLowerCase().includes(rosterSearch.toLowerCase());
    const matchesDept = rosterDept === 'all' || row.department === rosterDept;
    return matchesSearch && matchesDept;
  });

  const sortedRoster = [...filteredRoster].sort((a, b) => {
    let valA = a[rosterSortField];
    let valB = b[rosterSortField];

    if (typeof valA === 'string') {
      return rosterSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return rosterSortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    }
  });

  // Export Roster list to CSV with UTF-8 BOM
  const handleExportRosterToCSV = () => {
    const csvHeaders = ["Employee ID", "Full Name", "Department", "Attendance Rate (%)", "Attendance Score"];
    const csvContentRows = [csvHeaders];

    rosterRows.forEach(row => {
      csvContentRows.push([
        row.employeeId,
        row.fullName,
        row.department,
        row.attendanceRate.toFixed(1),
        row.score.toFixed(2)
      ]);
    });

    const csvString = csvContentRows
      .map(cols => cols.map(c => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `pnu_faculty_roster_report_${dashboardDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="hr-dashboard">
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-8">
          <div>
            <span className="bg-amber-500 text-slate-950 font-mono text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded">
              HR ADMINISTRATIVE ACCESS
            </span>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight mt-3">
              Dean & HR Control Portal
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 font-sans leading-relaxed">
              Analyze daily faculty participation ratios, authorize pending sick or business travel leaves, compile department logs, and export compliant regulatory files.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
              <span className="text-[10px] text-slate-400 font-mono block">STAFF TOTAL</span>
              <span className="text-lg font-bold text-slate-100">{totalRegisteredStaff}</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
              <span className="text-[10px] text-slate-400 font-mono block">PENDING LEAVE</span>
              <span className="text-lg font-bold text-amber-500">{pendingLeavesCount}</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
              <span className="text-[10px] text-slate-400 font-mono block">DAY'S LOGS</span>
              <span className="text-lg font-bold text-emerald-400">{todayCheckIns}</span>
            </div>
          </div>
        </div>

        {/* -------------------- TAB 1: HR OVERVIEW TODAY -------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in" id="hr-tab-overview">
            
            {/* Quick Analytics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200/85 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-900 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Faculty Presence Today</p>
                  <p className="text-xl font-bold text-slate-900">
                    {Math.round(((todayPresentCount + todayLateCount) / (totalRegisteredStaff || 1)) * 100)}%
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/85 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-amber-50 text-amber-900 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Late Arrivals Today</p>
                  <p className="text-xl font-bold text-slate-900">{todayLateCount} Records</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/85 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Direct On-Time Today</p>
                  <p className="text-xl font-bold text-slate-900">{todayPresentCount} Records</p>
                </div>
              </div>

            </div>

            {/* Main view split: Pending Leaves Review and Live Arrivals Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Pending Leaves list */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-sans font-bold text-slate-900 text-lg">Leave Requests Awaiting Decisions</h3>
                  <p className="text-slate-500 text-xs">Authorize or decline submitted leaves for academics and support coordinators.</p>
                </div>

                <div className="space-y-4">
                  {allLeaves.filter(lv => lv.status === 'pending').length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs">
                      No leave requests pending HR authorization. Perfect compliance!
                    </div>
                  ) : (
                    allLeaves.filter(lv => lv.status === 'pending').map(lv => (
                      <div key={lv.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 text-sm">{lv.userName}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 uppercase font-mono">{lv.leaveType}</span>
                          </div>
                          <p className="text-slate-500 font-mono">Duration: <strong className="text-slate-700">{lv.startDate} to {lv.endDate}</strong></p>
                          <p className="text-slate-500 italic max-w-md"><strong className="text-slate-600 not-italic">Statement of Reason:</strong> "{lv.reason}"</p>
                        </div>

                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                          <button
                            id={`btn-approve-${lv.id}`}
                            onClick={() => handleApproveLeave(lv.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-505 text-white rounded text-xs font-semibold flex items-center space-x-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Authorize</span>
                          </button>
                          <button
                            id={`btn-reject-${lv.id}`}
                            onClick={() => handleRejectLeave(lv.id)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-505 text-white rounded text-xs font-semibold flex items-center space-x-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Live Feed tracker */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-sans font-bold text-slate-900 text-base">Timeline logs today</h3>
                  <div className="flex items-center space-x-2.5 mt-1.5">
                    <input
                      type="date"
                      value={viewDate}
                      onChange={(e) => setViewDate(e.target.value)}
                      className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-700 w-full"
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {todayRecords.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 italic">No attendance records submitted for this date.</p>
                  ) : (
                    todayRecords.slice(0, 5).map(record => (
                      <div key={record.id} className="py-2.5 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">{record.userName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{record.checkIn}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span className="truncate max-w-[130px]">{record.checkInLocation}</span>
                          <span className={`px-1.5 py-0.2 rounded font-bold border ${
                            record.status === 'present' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-100'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* -------------------- TAB 2: ATTENDANCE DATABASE QUERY -------------------- */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-fade-in" id="hr-tab-logs">
            
            {/* Tab Navigation Toggle */}
            <div className="flex border-b border-slate-200 gap-1" id="hr-subtabs-attendance-nav">
              <button
                type="button"
                id="hr-btn-subtab-gate"
                onClick={() => setAttendanceSubMode('gate')}
                className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  attendanceSubMode === 'gate'
                    ? 'border-amber-500 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Daily RFID Gate Logs
              </button>
              <button
                type="button"
                id="hr-btn-subtab-official"
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
              <AttendanceManagementModule isAdmin={true} userEmail={user?.email || ''} />
            ) : (
              <>
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-xl">Faculty Sign-In Archives</h3>
                  <p className="text-slate-500 text-xs">Search, filter, and audit chronological clock-in logs of the entire faculty.</p>
                </div>

                {/* Query Filters */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  
                  <div className="relative w-full md:max-w-xs">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search faculty name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-50"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="text-xs px-2.5 py-2 border border-slate-200 rounded bg-white text-slate-700"
                    >
                      <option value="all">All Departments</option>
                      <option value="English & Linguistics">English & Linguistics</option>
                      <option value="Thai Language & Culture">Thai Language & Culture</option>
                      <option value="History & Philosophy">History & Philosophy</option>
                      <option value="Sociology & Anthropology">Sociology & Anthropology</option>
                      <option value="Office of the Dean">Office of the Dean</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs px-2.5 py-2 border border-slate-200 rounded bg-white text-slate-700"
                    >
                      <option value="all">All Statuses</option>
                      <option value="present">Present (On-Time)</option>
                      <option value="late">Late Arrival</option>
                      <option value="on-leave">On Approved Leave</option>
                    </select>

                    <button
                      onClick={() => { setSearchQuery(''); setDeptFilter('all'); setStatusFilter('all'); }}
                      className="text-xs font-mono text-amber-600 hover:underline"
                    >
                      Reset
                    </button>
                  </div>

                </div>

                {/* Registry Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">Date</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">Faculty Member</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">Dept / Position</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">In / Terminal</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">Out / Departure</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100 text-xs text-slate-700">
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-sans">
                              No audit records found matching selected filtration settings.
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map(rec => {
                            const recUser = allUsers.find(u => u.email.toLowerCase() === rec.email.toLowerCase());
                            return (
                              <tr key={rec.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-500">{rec.date}</td>
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-bold text-slate-800">{rec.userName}</p>
                                    <p className="text-[10px] text-slate-400">{rec.email}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <p className="text-slate-600 font-medium">{recUser?.department || 'LA Faculty'}</p>
                                  <p className="text-[10px] text-slate-400 capitalize">{recUser?.position || 'Lecturer'}</p>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-emerald-600 font-medium">
                                  <span className="font-semibold font-mono">{rec.checkIn}</span>
                                  <span className="text-[10px] text-slate-400 block truncate max-w-xs">{rec.checkInLocation}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                  {rec.checkOut ? (
                                    <>
                                      <span className="font-semibold font-mono">{rec.checkOut}</span>
                                      <span className="text-[10px] text-slate-400 block truncate max-w-xs">{rec.checkOutLocation}</span>
                                    </>
                                  ) : (
                                    <span className="text-amber-500">On Duty</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                                    rec.status === 'present'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                      : rec.status === 'late'
                                      ? 'bg-amber-50 text-amber-800 border-amber-100'
                                      : 'bg-slate-50 text-slate-800 border-slate-200'
                                  }`}>
                                    {rec.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

          </div>
        )}        {/* -------------------- TAB 3: ANALYTICS REPORTS ENGINE -------------------- */}
        {activeTab === 'reports' && (
          <div className="space-y-8 animate-fade-in" id="hr-tab-reports">
            
            {/* Reports tab header and dynamic subtab buttons */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5 gap-4">
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-2xl tracking-tight">Intelligence & Reports Panel</h3>
                <p className="text-slate-500 text-xs mt-1">Monitor real-time faculty statistics, track historical attendance curves, and trigger clean exports.</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
                <button
                  onClick={() => setActiveReportSubTab('dashboard')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    activeReportSubTab === 'dashboard'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Live Dashboard
                </button>
                <button
                  onClick={() => setActiveReportSubTab('roster')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    activeReportSubTab === 'roster'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Export & Roster
                </button>
                <button
                  onClick={() => setActiveReportSubTab('legacy')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    activeReportSubTab === 'legacy'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Department Compiler
                </button>
              </div>
            </div>

            {/* 1. DYNAMIC SUB-TAB: LIVE DASHBOARD */}
            {activeReportSubTab === 'dashboard' && (
              <div className="space-y-8">
                
                {/* Date filter controller */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Perspective Target Date</span>
                      <span className="text-[10px] text-slate-400 font-mono">Snapshot updates instantly in real time</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        const d = new Date(dashboardDate);
                        d.setDate(d.getDate() - 1);
                        setDashboardDate(d.toISOString().split('T')[0]);
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition"
                      title="Prior Day"
                    >
                      ←
                    </button>
                    <input
                      type="date"
                      value={dashboardDate}
                      onChange={(e) => setDashboardDate(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => {
                        const d = new Date(dashboardDate);
                        d.setDate(d.getDate() + 1);
                        setDashboardDate(d.toISOString().split('T')[0]);
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition"
                      title="Next Day"
                    >
                      →
                    </button>
                  </div>
                </div>

                {/* Live stats widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Employees</span>
                      <h4 className="text-2xl font-bold text-slate-900 font-mono">{allEmployeesNew.length}</h4>
                      <span className="text-[10px] text-slate-500 block">Active Contracts</span>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                      <Users className="w-5 h-5 text-slate-600" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Present Today</span>
                      <h4 className="text-2xl font-bold text-emerald-600 font-mono">{newTodayPresent}</h4>
                      <span className="text-[10px] text-slate-500 block">Signed in on selected date</span>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Absent Today</span>
                      <h4 className="text-2xl font-bold text-rose-600 font-mono">{newTodayAbsent}</h4>
                      <span className="text-[10px] text-slate-500 block">Missing or unmarked logs</span>
                    </div>
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
                      <XCircle className="w-5 h-5 text-rose-500" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Faculty Score</span>
                      <h4 className="text-2xl font-bold text-indigo-600 font-mono">{avgScore.toFixed(2)}</h4>
                      <span className="text-[10px] text-slate-500 block">Overall system standard</span>
                    </div>
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                      <Award className="w-5 h-5 text-indigo-500" />
                    </div>
                  </div>
                </div>

                {/* Charts Layout Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Chart 1: Department Comparisons */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-sans">Departmental Comparison</h4>
                        <p className="text-[10px] text-slate-400">Average Performance Scores by Academic Unit</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono font-semibold">Live Scores</span>
                    </div>
                    <div className="w-full" style={{ minHeight: '300px' }}>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={deptComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="department" stroke="#94A3B8" tick={{ fill: '#475569', fontSize: 9 }} />
                          <YAxis domain={[0, 100]} stroke="#94A3B8" tick={{ fill: '#475569', fontSize: 9 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', border: 'none', color: '#FFF', fontSize: '11px' }}
                            labelStyle={{ fontWeight: 'bold', color: '#F59E0B' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                          <Bar name="Average Score" dataKey="Average Score" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={25} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Status breakdown of date */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-sans">Attendance Status Distribution</h4>
                        <p className="text-[10px] text-slate-400">Proportional allocation of presence and leaves on chosen date</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-semibold">{dashboardDate}</span>
                    </div>
                    <div className="w-full flex flex-col justify-center items-center" style={{ minHeight: '300px' }}>
                      {pieData.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 space-y-2">
                          <Database className="w-10 h-10 mx-auto text-slate-300" />
                          <p className="text-xs font-semibold">No Logged Records on {dashboardDate}</p>
                          <p className="text-[10px] max-w-xs leading-relaxed">No actions registered to build status proportions. Log student or instructor presence in the Gate/Faculty view.</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Chart 3: Trends over past week */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 lg:col-span-2">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-sans">7-Day Attendance Rate Trend</h4>
                        <p className="text-[10px] text-slate-400">Day-by-day aggregate tracking of presence percentage in Faculty of Liberal Arts</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-mono font-semibold">Dynamic Trend</span>
                    </div>
                    <div className="w-full" style={{ minHeight: '300px' }}>
                      {attendanceTrendData.length < 2 ? (
                        <div className="text-center py-20 text-slate-400 space-y-2">
                          <TrendingUp className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
                          <p className="text-xs font-semibold">Generating Historical Trend Line</p>
                          <p className="text-[10px] max-w-sm mx-auto leading-relaxed">Insufficient distinct historical dates to plot timeline. Log entries across multiple consecutive dates to visualize attendance shifts.</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={attendanceTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="date" stroke="#94A3B8" tick={{ fill: '#475569', fontSize: 10 }} />
                            <YAxis domain={[0, 100]} stroke="#94A3B8" tick={{ fill: '#475569', fontSize: 10 }} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', border: 'none', color: '#FFF', fontSize: '11px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                            <Line 
                              name="Attendance Rate (%)" 
                              type="monotone" 
                              dataKey="Attendance Rate (%)" 
                              stroke="#10B981" 
                              strokeWidth={3} 
                              dot={{ r: 4, stroke: '#10B981', strokeWidth: 1, fill: '#FFF' }} 
                              activeDot={{ r: 6 }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* 2. DYNAMIC SUB-TAB: EXPORT & ROSTER TABLE */}
            {activeReportSubTab === 'roster' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-6 p-6">
                
                {/* Search, Filter, and Export Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-2xl">
                    
                    {/* Search Field */}
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search roster by name or ID..."
                        value={rosterSearch}
                        onChange={(e) => setRosterSearch(e.target.value)}
                        className="w-full text-xs pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Department Dropdown */}
                    <select
                      value={rosterDept}
                      onChange={(e) => setRosterDept(e.target.value)}
                      className="text-xs px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-64"
                    >
                      <option value="all">All Departments</option>
                      <option value="English & Linguistics">English & Linguistics</option>
                      <option value="Thai Language & Culture">Thai Language & Culture</option>
                      <option value="History & Philosophy">History & Philosophy</option>
                      <option value="Sociology & Anthropology">Sociology & Anthropology</option>
                      <option value="Office of the Dean">Office of the Dean</option>
                    </select>

                  </div>

                  {/* CSV Export Action (Excel/Sheets compatible with BOM prefix) */}
                  <button
                    onClick={handleExportRosterToCSV}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 shadow-sm transition self-stretch sm:self-auto"
                    title="Export all data into Microsoft Excel & Google Sheets compliant CSV formatting with exact column widths and UTF-8 encoding headers."
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {/* Live reporting stats table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                        
                        {/* ID Column */}
                        <th 
                          onClick={() => {
                            if (rosterSortField === 'employeeId') {
                              setRosterSortOrder(rosterSortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setRosterSortField('employeeId');
                              setRosterSortOrder('asc');
                            }
                          }}
                          className="px-6 py-4 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition font-mono"
                        >
                          <div className="flex items-center space-x-1.5">
                            <span>Faculty ID</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>

                        {/* Name Column */}
                        <th 
                          onClick={() => {
                            if (rosterSortField === 'fullName') {
                              setRosterSortOrder(rosterSortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setRosterSortField('fullName');
                              setRosterSortOrder('asc');
                            }
                          }}
                          className="px-6 py-4 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition font-mono"
                        >
                          <div className="flex items-center space-x-1.5">
                            <span>Lecturer Name</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>

                        {/* Department Column */}
                        <th 
                          onClick={() => {
                            if (rosterSortField === 'department') {
                              setRosterSortOrder(rosterSortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setRosterSortField('department');
                              setRosterSortOrder('asc');
                            }
                          }}
                          className="px-6 py-4 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition font-mono"
                        >
                          <div className="flex items-center space-x-1.5">
                            <span>Department</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>

                        {/* Attendance Rate Column */}
                        <th 
                          onClick={() => {
                            if (rosterSortField === 'attendanceRate') {
                              setRosterSortOrder(rosterSortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setRosterSortField('attendanceRate');
                              setRosterSortOrder('asc');
                            }
                          }}
                          className="px-6 py-4 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition font-mono"
                        >
                          <div className="flex items-center space-x-1.5">
                            <span>Attendance Rate</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>

                        {/* Attendance Score Column */}
                        <th 
                          onClick={() => {
                            if (rosterSortField === 'score') {
                              setRosterSortOrder(rosterSortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setRosterSortField('score');
                              setRosterSortOrder('asc');
                            }
                          }}
                          className="px-6 py-4 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition font-mono text-right"
                        >
                          <div className="flex items-center space-x-1.5 justify-end">
                            <span>Performance Score</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                      {sortedRoster.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 space-y-2">
                            <Users className="w-8 h-8 mx-auto text-slate-200" />
                            <p className="font-semibold text-xs text-slate-500">No matching roster entries found</p>
                            <p className="text-[10px] text-slate-400 leading-normal">Refine your search query or department parameters to view roster cards.</p>
                          </td>
                        </tr>
                      ) : (
                        sortedRoster.map((row) => (
                          <tr key={row.employeeId} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap font-mono font-medium text-slate-500">{row.employeeId}</td>
                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-950">{row.fullName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">{row.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-slate-800">{row.attendanceRate.toFixed(1)}%</span>
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${row.attendanceRate >= 80 ? 'bg-emerald-500' : row.attendanceRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(row.attendanceRate, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                                row.score >= 85 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : row.score >= 60 
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {row.score.toFixed(2)} pts
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table meta indicator */}
                <p className="text-[10px] text-slate-400 font-mono text-center">
                  Showing {sortedRoster.length} of {rosterRows.length} total staff logs • Sorted by {rosterSortField} in {rosterSortOrder}ending sequence
                </p>

              </div>
            )}

            {/* 3. DYNAMIC SUB-TAB: LEGACY PDF DEPARTMENT COMPILER */}
            {activeReportSubTab === 'legacy' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Report generator selector */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                  <h4 className="font-sans font-bold text-slate-900 text-base">Select Report Scope</h4>
                  
                  <form onSubmit={generateDepartmentReport} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-mono text-[10px] tracking-wider uppercase block">Target Academic Unit</label>
                      <select
                        value={reportDept}
                        onChange={(e) => setReportDept(e.target.value)}
                        className="w-full text-xs px-2.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="English & Linguistics">Department of English & Linguistics</option>
                        <option value="Thai Language & Culture">Department of Thai Language & Culture</option>
                        <option value="History & Philosophy">Department of History & Philosophy</option>
                        <option value="Sociology & Anthropology">Department of Sociology & Anthropology</option>
                        <option value="Office of the Dean">Office of the Dean (Coordinators)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      id="btn-trigger-report-generation"
                      disabled={isGenerating}
                      className="w-full py-2.5 px-4 border border-slate-900 bg-slate-950 text-white rounded-lg hover:bg-slate-900 text-sm font-semibold flex items-center justify-center space-x-1"
                    >
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span>{isGenerating ? 'Compiling data...' : 'Compile Scope Report'}</span>
                    </button>
                  </form>

                  {generatedReport && (
                    <div className="pt-4 border-t border-slate-100 flex justify-center">
                      <button
                        onClick={() => { window.print(); }}
                        className="px-3 py-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center space-x-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-600" />
                        <span>Print Formatted PDF Copy</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Display Resulting compiled report */}
                <div className="lg:col-span-2">
                  
                  {!generatedReport ? (
                    <div className="bg-white p-8 rounded-xl border border-slate-205 border-dashed text-center text-slate-400 py-16">
                      <Building className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <p className="text-sm font-semibold text-slate-500">No Report Loaded</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Select an academic department from the form to compile official regulatory summaries.</p>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6" id="printable-report">
                      
                      {/* Header printed */}
                      <div className="border-b border-slate-200 pb-4 text-center sm:text-left">
                        <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">OFFICIAL REGULATORY COMPLIANCE REPORT</p>
                        <h4 className="font-sans font-bold text-slate-900 text-xl mt-1">{generatedReport.department}</h4>
                        <p className="text-xs text-slate-500">Faculty of Liberal Arts, Phranakhon Rajabhat University</p>
                      </div>

                      {/* Stats counters */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg">
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono block">STAFF ROSTER</span>
                          <span className="text-base font-bold text-slate-900">{generatedReport.staffCount} Lecturers</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono block">COMBINED WORKDAYS</span>
                          <span className="text-base font-bold text-slate-900">{generatedReport.totalSignIns} Logs</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono block">ON-TIME QUALITY</span>
                          <span className="text-base font-semibold text-emerald-600">{generatedReport.onTimeRate}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono block">LATE ARRIVALS</span>
                          <span className="text-base font-semibold text-amber-600">{generatedReport.lateArrivals} Days</span>
                        </div>
                      </div>

                      {/* Staff directory for this department */}
                      <div className="space-y-3">
                        <h5 className="font-sans font-bold text-slate-800 text-sm">Roster Directory in Scope</h5>
                        <div className="divide-y divide-slate-100 border border-slate-205 rounded-lg overflow-hidden">
                          {generatedReport.staffList.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-xs">No users assigned to this scope.</div>
                          ) : (
                            generatedReport.staffList.map((st: UserProfile) => {
                              const userHistory = allAttendance.filter(a => a.email.toLowerCase() === st.email.toLowerCase());
                              return (
                                <div key={st.uid} className="p-3 bg-white hover:bg-slate-50 flex justify-between items-center text-xs">
                                  <div>
                                    <strong className="text-slate-800 font-semibold">{st.name}</strong>
                                    <span className="text-[10px] text-slate-400 block font-mono">{st.email} • {st.position}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-semibold text-slate-705 block">{userHistory.length} Days Signed</span>
                                    <span className="text-[10px] text-slate-400">On-Time Code: {userHistory.filter(uh => uh.status === 'present').length}</span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 font-mono text-center pt-4">
                        Document Hash: LAr_r9031_38a2 • Authenticated by Federated Sign-In
                      </p>

                    </div>
                  )}

                </div>

              </div>
            )}

          </div>
        )}

        {/* -------------------- TAB 5: EMPLOYEE MANAGEMENT MODULE -------------------- */}
        {activeTab === 'employees' && (
          <div className="space-y-6 animate-fade-in" id="hr-tab-employees">
            
            {/* Header / Actions section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-xl">Faculty Employee Registry</h3>
                <p className="text-slate-500 text-xs">Maintain contract terms, planned sessions, department assignments, and active status validation.</p>
              </div>
              <div>
                {empFormMode === 'none' ? (
                  <div className="flex items-center space-x-3">
                    <button
                      id="btn-import-employee-csv"
                      onClick={handleOpenImportMode}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-250 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Import CSV</span>
                    </button>
                    <button
                      id="btn-add-employee-open"
                      onClick={handleOpenAddForm}
                      className="px-4 py-2.5 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-600 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Register New Employee</span>
                    </button>
                  </div>
                ) : (
                  <button
                    id="btn-add-employee-back"
                    onClick={handleResetImport}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 border border-slate-200 font-semibold text-xs flex items-center justify-center space-x-1"
                  >
                    <span>Back to Roster</span>
                  </button>
                )}
              </div>
            </div>

            {/* ERROR AND SUCCESS NOTIFIERS */}
            {formError && empFormMode === 'none' && (
              <div className="p-3 bg-rose-50 text-rose-800 border-l-4 border-rose-500 text-xs rounded shadow-sm">
                {formError}
              </div>
            )}
            {formSuccess && empFormMode === 'none' && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 text-xs rounded shadow-sm">
                {formSuccess}
              </div>
            )}

            {/* ADD AND EDIT FORM */}
            {(empFormMode === 'add' || empFormMode === 'edit') && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl mx-auto">
                <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
                  <h4 className="font-sans font-bold text-lg">
                    {empFormMode === 'add' ? 'Register New Faculty Employee' : 'Edit Employee Profile'}
                  </h4>
                  <p className="text-slate-400 text-xs mt-1">
                    {empFormMode === 'add' ? 'Key in detailed academic information to seed a new unique record compliance profile.' : 'Modify compliance characteristics for active records.'}
                  </p>
                </div>

                <form onSubmit={handleSaveEmployee} className="p-6 space-y-5 text-xs">
                  {formError && (
                    <div className="p-3 bg-rose-50 text-rose-800 rounded-lg border border-rose-200">
                      {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                      {formSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Employee ID */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-600 font-semibold">Employee ID (Must be unique)</label>
                      <input
                        type="text"
                        placeholder="e.g. PNU-089"
                        value={formEmployeeId}
                        onChange={(e) => setFormEmployeeId(e.target.value)}
                        disabled={empFormMode === 'edit'}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 disabled:bg-slate-100 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-600 font-semibold">Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Somchai Phromdi"
                        value={formFullName}
                        onChange={(e) => setFormFullName(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* Faculty Email */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-600 font-semibold">Faculty Email (Must end with @pnu.ac.th)</label>
                      <input
                        type="email"
                        placeholder="e.g. somchai.p@pnu.ac.th"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* Academic Department */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-600 font-semibold">Department Assignment</label>
                      <select
                        value={formDepartment}
                        onChange={(e) => setFormDepartment(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none"
                      >
                        <option value="English & Linguistics">English & Linguistics</option>
                        <option value="Thai Language & Culture">Thai Language & Culture</option>
                        <option value="History & Philosophy">History & Philosophy</option>
                        <option value="Sociology & Anthropology">Sociology & Anthropology</option>
                        <option value="Office of the Dean">Office of the Dean</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Computer Science">Computer Science</option>
                      </select>
                    </div>

                    {/* Planned Working/Teaching Sessions */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-600 font-semibold">Planned Teaching Sessions (Must be &gt; 0)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 18"
                        value={formPlannedSessions}
                        onChange={(e) => setFormPlannedSessions(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* Active Checkbox */}
                    <div className="flex items-center space-x-3 pt-5 pl-1">
                      <input
                        type="checkbox"
                        id="employee-active-checkbox"
                        checked={formActive}
                        onChange={(e) => setFormActive(e.target.checked)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-slate-300 rounded"
                      />
                      <label htmlFor="employee-active-checkbox" className="text-slate-700 font-semibold select-none">
                        Active Employee
                      </label>
                    </div>

                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setEmpFormMode('none')}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="btn-employee-save-submit"
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
                    >
                      {empFormMode === 'add' ? 'Confirm Registration' : 'Save Profiles & Apply'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* CSV IMPORT SCREEN */}
            {empFormMode === 'import' && (
              <div className="space-y-6 animate-fade-in" id="csv-import-module-view">
                {/* Import Summary View */}
                {importSummary ? (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto" id="csv-import-summary-screen">
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <h4 className="text-lg font-bold font-sans text-slate-900">CSV Import Completed</h4>
                      <p className="text-slate-500 text-xs">The employee roster data has been successfully processed and synced with Firestore persistence.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-5 text-center">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Validated Rows</p>
                        <p className="text-2xl font-bold font-mono text-slate-800" id="summary-total">{importSummary.total}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-500">Inserted</p>
                        <p className="text-2xl font-bold font-mono text-emerald-600" id="summary-inserted">+{importSummary.inserted}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-500">Updated</p>
                        <p className="text-2xl font-bold font-mono text-amber-600" id="summary-updated">~{importSummary.updated}</p>
                      </div>
                    </div>

                    {importSummary.failed > 0 && (
                      <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs flex items-start space-x-2 border border-rose-100">
                        <span className="font-bold">Notice:</span>
                        <span>{importSummary.failed} records failed the transaction write logic. Verify details.</span>
                      </div>
                    )}

                    <div className="flex items-center justify-center pt-2">
                      <button
                        onClick={handleResetImport}
                        id="btn-import-summary-close"
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition"
                      >
                        Acknowledge & Close
                      </button>
                    </div>
                  </div>
                ) : (
                  /* CSV File Selection or Preview View */
                  <div className="space-y-6">
                    {!importFile ? (
                      /* Drag and Drop Box */
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition duration-150 flex flex-col items-center justify-center min-h-[300px] bg-white ${
                          dragActive 
                            ? 'border-amber-500 bg-amber-50/20 text-amber-900' 
                            : 'border-slate-300 hover:border-slate-400 text-slate-600'
                        }`}
                        onClick={() => document.getElementById('csv-file-hidden-input')?.click()}
                      >
                        <input
                          id="csv-file-hidden-input"
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <FileSpreadsheet className="w-12 h-12 text-slate-400 mb-2" />
                        <p className="font-sans font-bold text-sm text-slate-800">
                          Drag & Drop your CSV File Here
                        </p>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          Supporting UTF-8 encoding for full Thai linguist typography matching. Click anywhere to browse.
                        </p>
                        <div className="mt-4 inline-flex items-center space-x-2 bg-slate-100 text-slate-705 px-3 py-1.5 rounded text-[11px] font-mono">
                          <span className="font-bold">Columns required:</span>
                          <span>employeeId, fullName, email, department, plannedSessions</span>
                        </div>
                        {formError && (
                          <div className="mt-4 p-2 bg-rose-50 text-rose-800 text-[11px] font-mono rounded border border-rose-100 max-w-md">
                            {formError}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* PREVIEW STAGE */
                      <div className="space-y-5 animate-fade-in text-xs text-slate-700">
                        {/* FILE INFO & CONTROLS */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded mr-1">
                              <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-sans font-bold text-slate-900 text-xs">File: {importFile.name}</h5>
                              <p className="text-[10px] text-slate-400">{(importFile.size / 1024).toFixed(2)} KB • UTF-8 Decoding Success</p>
                            </div>
                          </div>

                          {/* Status statistics strip */}
                          <div className="flex items-center space-x-6 text-[11px]" id="csv-preview-stats">
                            <div className="flex items-center space-x-1.5">
                              <span className="w-2 h-2 rounded bg-indigo-500"></span>
                              <span className="text-slate-500 font-medium">Total Rows:</span>
                              <span className="font-mono font-bold text-slate-850" id="preview-total-rows">{importPreviewData.length}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className="w-2 h-2 rounded bg-emerald-500"></span>
                              <span className="text-slate-500 font-medium font-semibold text-emerald-700">Valid Rows:</span>
                              <span className="font-mono font-bold text-emerald-600" id="preview-valid-rows">{importPreviewData.filter(x => x.isValid).length}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className="w-2 h-2 rounded bg-rose-500"></span>
                              <span className="text-slate-500 font-medium font-semibold text-rose-700">Invalid Rows:</span>
                              <span className="font-mono font-bold text-rose-600" id="preview-invalid-rows">{importPreviewData.filter(x => !x.isValid).length}</span>
                            </div>
                          </div>

                          {/* Import Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setImportFile(null)}
                              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded text-xs transition"
                            >
                              Clear File
                            </button>
                            <button
                              onClick={handleConfirmImport}
                              disabled={isImporting || importPreviewData.filter(x => x.isValid).length === 0}
                              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-xs transition flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isImporting ? (
                                <span>Importing...</span>
                              ) : (
                                <span>Confirm Import</span>
                              )}
                            </button>
                          </div>
                        </div>

                        {formError && (
                          <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded border border-rose-200">
                            {formError}
                          </div>
                        )}

                        {/* PREVIEW TABLE */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 font-sans font-bold text-slate-800 text-xs flex justify-between items-center">
                            <span>CSV Employee Import Preview Schema</span>
                            <span className="text-[10px] text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded font-mono font-normal">UTF-8 Decoded</span>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                              <thead className="bg-slate-100 font-mono text-[10px] font-semibold text-slate-500 select-none sticky top-0">
                                <tr>
                                  <th className="px-5 py-2.5 text-left uppercase">Line #</th>
                                  <th className="px-5 py-2.5 text-left uppercase">Employee ID</th>
                                  <th className="px-5 py-2.5 text-left uppercase">Full Name</th>
                                  <th className="px-5 py-2.5 text-left uppercase">Email address</th>
                                  <th className="px-5 py-2.5 text-left uppercase">Department</th>
                                  <th className="px-5 py-2.5 text-center uppercase">Planned Sessions</th>
                                  <th className="px-5 py-2.5 text-left uppercase">Aesthetic Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-100 text-xs text-slate-600">
                                {importPreviewData.map((row, idx) => (
                                  <tr key={idx} className={`hover:bg-slate-50/50 ${!row.isValid ? 'bg-rose-50/30' : ''}`}>
                                    <td className="px-5 py-2.5 font-mono text-[10px] text-slate-400">
                                      Row {row.rowNum}
                                    </td>
                                    <td className={`px-5 py-2.5 font-mono font-bold ${!row.employeeId ? 'text-rose-600 italic' : 'text-slate-800'}`}>
                                      {row.employeeId || '[MISSING ID]'}
                                    </td>
                                    <td className={`px-5 py-2.5 ${!row.fullName ? 'text-rose-600 italic' : 'text-slate-800 font-medium'}`}>
                                      {row.fullName || '[MISSING FULL NAME]'}
                                    </td>
                                    <td className={`px-5 py-2.5 font-mono text-[10px] ${row.errors.some(e => e.includes('Email')) ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                      {row.email || '[MISSING EMAIL]'}
                                    </td>
                                    <td className="px-5 py-2.5 text-slate-600">
                                      {row.department}
                                    </td>
                                    <td className="px-5 py-2.5 text-center font-mono font-bold text-slate-800">
                                      {row.plannedSessions}
                                    </td>
                                    <td className="px-5 py-2.5">
                                      {row.isValid ? (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                                          row.isUpdate 
                                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        }`}>
                                          {row.isUpdate ? 'Update Matched ID' : 'Create New Profile'}
                                        </span>
                                      ) : (
                                        <div className="space-y-0.5 text-[10px] font-semibold text-rose-600">
                                          {row.errors.map((err, errIdx) => (
                                            <div key={errIdx} className="flex items-center space-x-1">
                                              <span>•</span>
                                              <span>{err}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ROSTER LIST SCREEN */}
            {empFormMode === 'none' && (
              <div className="space-y-4">
                
                {/* Filtration and Search controls */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  
                  {/* Search query input */}
                  <div className="relative md:col-span-2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search by Employee ID, Name, or Email..."
                      value={empSearchQuery}
                      onChange={(e) => {
                        setEmpSearchQuery(e.target.value);
                        setEmpCurrentPage(1);
                      }}
                      className="w-full text-xs pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-50"
                    />
                  </div>

                  {/* Department Filter option */}
                  <div>
                    <select
                      value={empDeptFilter}
                      onChange={(e) => {
                        setEmpDeptFilter(e.target.value);
                        setEmpCurrentPage(1);
                      }}
                      className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
                    >
                      <option value="all">All Departments</option>
                      <option value="English & Linguistics">English & Linguistics</option>
                      <option value="Thai Language & Culture">Thai Language & Culture</option>
                      <option value="History & Philosophy">History & Philosophy</option>
                      <option value="Sociology & Anthropology">Sociology & Anthropology</option>
                      <option value="Office of the Dean">Office of the Dean</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Computer Science">Computer Science</option>
                    </select>
                  </div>

                  {/* Active / Inactive Status filter */}
                  <div>
                    <select
                      value={empActiveFilter}
                      onChange={(e) => {
                        setEmpActiveFilter(e.target.value);
                        setEmpCurrentPage(1);
                      }}
                      className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
                    >
                      <option value="all">All Employment Statuses</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive / Suspended</option>
                    </select>
                  </div>
                </div>

                {/* Sub-bar sorting info */}
                <div className="flex flex-wrap items-center justify-between px-1 text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <span>Sort by:</span>
                    <button
                      onClick={() => {
                        if (empSortField === 'employeeId') {
                          setEmpSortOrder(p => p === 'asc' ? 'desc' : 'asc');
                        } else {
                          setEmpSortField('employeeId');
                          setEmpSortOrder('asc');
                        }
                      }}
                      className={`font-mono px-2 py-1 rounded border capitalize ${empSortField === 'employeeId' ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                    >
                      ID {empSortField === 'employeeId' && (empSortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      onClick={() => {
                        if (empSortField === 'fullName') {
                          setEmpSortOrder(p => p === 'asc' ? 'desc' : 'asc');
                        } else {
                          setEmpSortField('fullName');
                          setEmpSortOrder('asc');
                        }
                      }}
                      className={`px-2 py-1 rounded border capitalize ${empSortField === 'fullName' ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                    >
                      Name {empSortField === 'fullName' && (empSortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      onClick={() => {
                        if (empSortField === 'plannedSessions') {
                          setEmpSortOrder(p => p === 'asc' ? 'desc' : 'asc');
                        } else {
                          setEmpSortField('plannedSessions');
                          setEmpSortOrder('desc');
                        }
                      }}
                      className={`px-2 py-1 rounded border capitalize ${empSortField === 'plannedSessions' ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                    >
                      Sessions {empSortField === 'plannedSessions' && (empSortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setEmpSearchQuery('');
                      setEmpDeptFilter('all');
                      setEmpActiveFilter('all');
                      setEmpSortField('employeeId');
                      setEmpSortOrder('asc');
                      setEmpCurrentPage(1);
                    }}
                    className="text-amber-600 hover:underline hover:text-amber-700 font-semibold"
                  >
                    Clear Filter Criteria
                  </button>
                </div>

                {/* Table containing the employee records */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">Employee ID</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">Personal Information</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider font-mono">Department</th>
                          <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider font-mono">Planned Sessions</th>
                          <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider font-mono">Employment Status</th>
                          <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider font-mono">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100 text-xs text-slate-700">
                        {(() => {
                          const filtered = allEmployees.filter(emp => {
                            const matchSearch = empSearchQuery.trim()
                              ? emp.fullName.toLowerCase().includes(empSearchQuery.toLowerCase()) ||
                                emp.email.toLowerCase().includes(empSearchQuery.toLowerCase()) ||
                                emp.employeeId.toLowerCase().includes(empSearchQuery.toLowerCase())
                              : true;

                            const matchDept = empDeptFilter !== 'all'
                              ? emp.department === empDeptFilter
                              : true;

                            const matchActive = empActiveFilter !== 'all'
                              ? (empActiveFilter === 'active' ? emp.active : !emp.active)
                              : true;

                            return matchSearch && matchDept && matchActive;
                          });

                          const sorted = [...filtered].sort((a, b) => {
                            let valA = a[empSortField];
                            let valB = b[empSortField];

                            if (typeof valA === 'string' && typeof valB === 'string') {
                              return empSortOrder === 'asc' 
                                ? valA.localeCompare(valB) 
                                : valB.localeCompare(valA);
                            } else {
                              const numA = Number(valA);
                              const numB = Number(valB);
                              return empSortOrder === 'asc' ? numA - numB : numB - numA;
                            }
                          });

                          const totalRecords = sorted.length;
                          const totalPages = Math.ceil(totalRecords / empItemsPerPage) || 1;
                          const pageNum = Math.min(empCurrentPage, totalPages);
                          const startIndex = (pageNum - 1) * empItemsPerPage;
                          const endIndex = Math.min(startIndex + empItemsPerPage, totalRecords);
                          const paginated = sorted.slice(startIndex, endIndex);

                          if (totalRecords === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                  No employees recorded under contemporary filtration states.
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <>
                              {paginated.map(emp => (
                                <tr key={emp.employeeId} className="hover:bg-slate-50/75 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-700 font-bold col-employeeId">
                                    {emp.employeeId}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div>
                                      <p className="font-bold text-slate-800 text-sm leading-snug">{emp.fullName}</p>
                                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.email}</p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="font-medium text-slate-600 block">{emp.department}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-slate-800 font-mono font-bold">
                                    {emp.plannedSessions}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      emp.active 
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                        : 'bg-rose-50 text-rose-800 border-rose-100'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${emp.active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                      {emp.active ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center space-x-2.5">
                                      <button
                                        onClick={() => handleOpenEditForm(emp)}
                                        title="Modify Employee"
                                        id={`btn-edit-employee-${emp.employeeId}`}
                                        className="p-1 px-2.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-semibold flex items-center space-x-1"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteEmployee(emp.employeeId)}
                                        title="Delete Employee"
                                        id={`btn-delete-employee-${emp.employeeId}`}
                                        className="p-1 px-2.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-[10px] font-semibold flex items-center space-x-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              
                              <tr>
                                <td colSpan={6} className="px-6 py-3.5 bg-slate-50 border-t border-slate-100">
                                  <div className="flex items-center justify-between text-xs text-slate-500">
                                    <div>
                                      Showing <span className="font-bold text-slate-700">{startIndex + 1}</span> to <span className="font-bold text-slate-700">{endIndex}</span> of <span className="font-bold text-slate-700">{totalRecords}</span> employees
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        disabled={pageNum <= 1}
                                        onClick={() => setEmpCurrentPage(pageNum - 1)}
                                        className="p-1 px-2 bg-white rounded border border-slate-205 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                                      >
                                        <ChevronLeft className="w-4 h-4" />
                                      </button>
                                      <span className="font-mono text-slate-500">Page {pageNum} of {totalPages}</span>
                                      <button
                                        disabled={pageNum >= totalPages}
                                        onClick={() => setEmpCurrentPage(pageNum + 1)}
                                        className="p-1 px-2 bg-white rounded border border-slate-205 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                                      >
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* -------------------- TAB 4: PROFILE SETTINGS -------------------- */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 animate-fade-in" id="hr-tab-profile">
            
            <div className="border-b border-sidebar-100 pb-5 mb-5 flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-amber-500 text-amber-500 font-sans font-extrabold text-xl flex items-center justify-center overflow-hidden">
                {user.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-lg">{user.name}</h3>
                <p className="text-slate-500 text-xs">Authority Class: HR Manager • {user.email}</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 text-amber-900 rounded-lg border border-amber-100 text-xs space-y-1 block mb-6">
              <strong className="font-bold block">Authority Assignment Level</strong>
              Your account has full reviewer privileges over the Faculty of Liberal Arts databases. You can approve or decline leave submissions, change administrative department scopes, audit records, and export timesheets.
            </div>

            <div className="space-y-4 text-xs font-sans text-slate-600 leading-relaxed">
              <strong className="block text-slate-800 text-sm border-b border-slate-100 pb-2">Information & Policy</strong>
              <p>For cyber security, all attendance records are archived digitally on Phranakhon Rajabhat University servers. Personnel logs remain persistent for up to 5 fiscal years according to standards.</p> 
              <p>Should any staff profile require administrative edits (e.g., teaching schedules, department changes), use the simulation role toggles in the top navbar to easily review different views.</p>
            </div>

          </div>
        )}

      </div>

      <div className="bg-slate-105 py-4 border-t border-slate-200 text-center text-[11px] text-slate-400 font-sans">
        Faculty of Liberal Arts Attendance Monitor Dashboard • HR Administration Registry Secure Terminal
      </div>
    </div>
  );
};
