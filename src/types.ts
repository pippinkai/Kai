/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Page {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  STAFF_DASHBOARD = 'STAFF_DASHBOARD',
  HR_DASHBOARD = 'HR_DASHBOARD',
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  NOT_FOUND = 'NOT_FOUND'
}

export type UserRole = 'STAFF' | 'HR_ADMIN' | 'staff' | 'hr' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  displayName?: string;
  role: UserRole;
  department?: string;
  position?: string;
  photoURL?: string;
  createdAt?: string;
  lastLogin?: string;
}

export type AttendanceStatus = 'present' | 'late' | 'half-day' | 'absent' | 'on-leave';

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  email: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:MM:SS
  checkOut: string | null; // HH:MM:SS
  status: AttendanceStatus;
  checkInLocation: string;
  checkOutLocation: string | null;
  remarks: string | null;
  workNotes: string | null;
}

export type LeaveType = 'sick' | 'vacation' | 'business' | 'maternity';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  email: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO string
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface Employee {
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
  plannedSessions: number;
  active: boolean;
  createdAt: string;
}

export type NewAttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Sick' | 'Holiday';

export interface AttendanceRecordNew {
  attendanceId: string;
  employeeId: string;
  attendanceDate: string; // YYYY-MM-DD
  status: NewAttendanceStatus;
  workingHours: number;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface OverrideLog {
  id: string;
  attendanceId: string;
  employeeId: string;
  oldValue: string;
  newValue: string;
  reason: string;
  editedBy: string;
  editedAt: string;
}

