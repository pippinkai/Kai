/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, AttendanceRecord, LeaveRequest, UserRole, Employee, AttendanceRecordNew, NewAttendanceStatus, OverrideLog } from '../types';

// Pre-seeded mock profiles
const MOCK_PROFILES: UserProfile[] = [
  {
    uid: 'mock-user-1',
    email: 'sopawan.n@pnu.ac.th', // The user's active login email
    name: 'Sopawan N.',
    displayName: 'Sopawan N.',
    role: 'HR_ADMIN',
    department: 'Office of the Dean',
    position: 'HR Administrator'
  },
  {
    uid: 'mock-user-2',
    email: 'amanda.c@pnu.ac.th',
    name: 'Asst. Prof. Dr. Amanda Carter',
    displayName: 'Asst. Prof. Dr. Amanda Carter',
    role: 'STAFF',
    department: 'English & Linguistics',
    position: 'Assistant Professor'
  },
  {
    uid: 'mock-user-3',
    email: 'kittisak.s@pnu.ac.th',
    name: 'Prof. Kittisak Sornkaew',
    displayName: 'Prof. Kittisak Sornkaew',
    role: 'STAFF',
    department: 'History & Philosophy',
    position: 'Department Head'
  },
  {
    uid: 'mock-user-4',
    email: 'sunisa.p@pnu.ac.th',
    name: 'Sunisa Phromdi',
    displayName: 'Sunisa Phromdi',
    role: 'STAFF',
    department: 'Office of the Dean',
    position: 'Academic Coordinator'
  },
  {
    uid: 'mock-user-5',
    email: 'michael.v@pnu.ac.th',
    name: 'Dr. Michael Vance',
    displayName: 'Dr. Michael Vance',
    role: 'STAFF',
    department: 'Sociology & Anthropology',
    position: 'Senior Lecturer'
  }
];

// Generate dates for mock records (yesterday and today)
const getPastDateString = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const TODAY_STR = getPastDateString(0);
const YESTERDAY_STR = getPastDateString(1);
const TWO_DAYS_AGO_STR = getPastDateString(2);

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: `mock-user-2_${YESTERDAY_STR}`,
    userId: 'mock-user-2',
    userName: 'Asst. Prof. Dr. Amanda Carter',
    email: 'amanda.c@pnu.ac.th',
    date: YESTERDAY_STR,
    checkIn: '08:15:22',
    checkOut: '16:45:10',
    status: 'present',
    checkInLocation: 'Liberal Arts Building A (RFID)',
    checkOutLocation: 'Liberal Arts Building A (RFID)',
    remarks: 'Regular teaching hours',
    workNotes: 'Conducted lecture on Syntax analysis, office hours'
  },
  {
    id: `mock-user-3_${YESTERDAY_STR}`,
    userId: 'mock-user-3',
    userName: 'Prof. Kittisak Sornkaew',
    email: 'kittisak.s@pnu.ac.th',
    date: YESTERDAY_STR,
    checkIn: '08:42:15',
    checkOut: '17:05:00',
    status: 'late',
    checkInLocation: 'Main Gate Gatekeepers RFID',
    checkOutLocation: 'Dean Office Reception',
    remarks: 'Morning traffic, minor delay',
    workNotes: 'Chaired departmental curriculum review seminar'
  },
  {
    id: `mock-user-4_${YESTERDAY_STR}`,
    userId: 'mock-user-4',
    userName: 'Sunisa Phromdi',
    email: 'sunisa.p@pnu.ac.th',
    date: YESTERDAY_STR,
    checkIn: '07:55:00',
    checkOut: '16:30:11',
    status: 'present',
    checkInLocation: 'Liberal Arts Building B (Coordinator Desk)',
    checkOutLocation: 'Liberal Arts Building B (Coordinator Desk)',
    remarks: 'Early shift',
    workNotes: 'Prepared exam materials, archived student forms'
  },
  {
    id: `mock-user-5_${YESTERDAY_STR}`,
    userId: 'mock-user-5',
    userName: 'Dr. Michael Vance',
    email: 'michael.v@pnu.ac.th',
    date: YESTERDAY_STR,
    checkIn: '08:05:00',
    checkOut: null,
    status: 'present',
    checkInLocation: 'Sociology Lab',
    checkOutLocation: null,
    remarks: 'Left late - skipped checkout kiosk check',
    workNotes: null
  },
  // Today's entries
  {
    id: `mock-user-2_${TODAY_STR}`,
    userId: 'mock-user-2',
    userName: 'Asst. Prof. Dr. Amanda Carter',
    email: 'amanda.c@pnu.ac.th',
    date: TODAY_STR,
    checkIn: '08:10:04',
    checkOut: null,
    status: 'present',
    checkInLocation: 'Liberal Arts Building A (RFID)',
    checkOutLocation: null,
    remarks: null,
    workNotes: null
  },
  {
    id: `mock-user-4_${TODAY_STR}`,
    userId: 'mock-user-4',
    userName: 'Sunisa Phromdi',
    email: 'sunisa.p@pnu.ac.th',
    date: TODAY_STR,
    checkIn: '07:58:30',
    checkOut: null,
    status: 'present',
    checkInLocation: 'Liberal Arts Building B (Coordinator Desk)',
    checkOutLocation: null,
    remarks: null,
    workNotes: null
  }
];

const MOCK_LEAVES: LeaveRequest[] = [
  {
    id: 'mock-leave-1',
    userId: 'mock-user-5',
    userName: 'Dr. Michael Vance',
    email: 'michael.v@pnu.ac.th',
    leaveType: 'vacation',
    startDate: getPastDateString(-1), // Tomorrow
    endDate: getPastDateString(-3),  // Next 3 days
    reason: 'Attending National Humanities Symposium in Bangkok',
    status: 'approved',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    reviewedBy: 'sopawan.n@pnu.ac.th',
    reviewedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'mock-leave-2',
    userId: 'mock-user-3',
    userName: 'Prof. Kittisak Sornkaew',
    email: 'kittisak.s@pnu.ac.th',
    leaveType: 'sick',
    startDate: TODAY_STR,
    endDate: TODAY_STR,
    reason: 'Annual medical wellness checkup',
    status: 'pending',
    createdAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null
  }
];

const MOCK_EMPLOYEES: Employee[] = [
  {
    employeeId: "PNU-001",
    fullName: "Asst. Prof. Dr. Amanda Carter",
    email: "amanda.c@pnu.ac.th",
    department: "English & Linguistics",
    plannedSessions: 24,
    active: true,
    createdAt: new Date(Date.now() - 31536000000).toISOString()
  },
  {
    employeeId: "PNU-002",
    fullName: "Prof. Kittisak Sornkaew",
    email: "kittisak.s@pnu.ac.th",
    department: "History & Philosophy",
    plannedSessions: 18,
    active: true,
    createdAt: new Date(Date.now() - 31536000000).toISOString()
  },
  {
    employeeId: "PNU-003",
    fullName: "Sunisa Phromdi",
    email: "sunisa.p@pnu.ac.th",
    department: "Office of the Dean",
    plannedSessions: 30,
    active: true,
    createdAt: new Date(Date.now() - 31536000000).toISOString()
  },
  {
    employeeId: "PNU-004",
    fullName: "Dr. Michael Vance",
    email: "michael.v@pnu.ac.th",
    department: "Sociology & Anthropology",
    plannedSessions: 16,
    active: true,
    createdAt: new Date(Date.now() - 31536000000).toISOString()
  },
  {
    employeeId: "PNU-005",
    fullName: "Dr. Benjamas Sukhum",
    email: "benjamas.s@pnu.ac.th",
    department: "Computer Science",
    plannedSessions: 20,
    active: true,
    createdAt: new Date(Date.now() - 15000000000).toISOString()
  },
  {
    employeeId: "PNU-006",
    fullName: "Somchai Saetang",
    email: "somchai.s@pnu.ac.th",
    department: "Mathematics",
    plannedSessions: 12,
    active: false,
    createdAt: new Date(Date.now() - 15000000000).toISOString()
  }
];

// LocalStorage key setup
const STORAGE_KEYS = {
  PROFILES: 'fla_attendance_profiles',
  ATTENDANCE: 'fla_attendance_records',
  LEAVES: 'fla_leave_requests',
  EMPLOYEES: 'fla_employee_records',
  ATTENDANCE_NEW: 'fla_attendance_records_new',
  OVERRIDE_LOGS: 'fla_override_logs'
};

const MOCK_OVERRIDE_LOGS: OverrideLog[] = [
  {
    id: "log_override_1",
    attendanceId: "att_pnu1_20260604",
    employeeId: "PNU-001",
    oldValue: "Status: Absent, Hours: 0 hrs",
    newValue: "Status: Sick, Hours: 0 hrs",
    reason: "Submitted official medical certificate from hospital; approved by Dean.",
    editedBy: "sopawan.n@pnu.ac.th",
    editedAt: "2026-06-05T09:30:15.000Z"
  },
  {
    id: "log_override_2",
    attendanceId: "att_pnu3_20260610",
    employeeId: "PNU-003",
    oldValue: "Status: Present, Hours: 8 hrs",
    newValue: "Status: Absent, Hours: 0 hrs",
    reason: "Accidentally clocked in using another department's RFID terminal but corrected to absent.",
    editedBy: "sopawan.n@pnu.ac.th",
    editedAt: "2026-06-11T14:15:22.000Z"
  }
];

const MOCK_ATTENDANCE_NEW: AttendanceRecordNew[] = [
  // Amanda Carter PNU-001 (plannedSessions 24)
  {
    attendanceId: "att_pnu1_20260601",
    employeeId: "PNU-001",
    attendanceDate: "2026-06-01",
    status: "Present",
    workingHours: 8,
    score: 4.17,
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu1_20260602",
    employeeId: "PNU-001",
    attendanceDate: "2026-06-02",
    status: "Present",
    workingHours: 8,
    score: 8.33,
    createdAt: "2026-06-02T08:00:00.000Z",
    updatedAt: "2026-06-02T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu1_20260603",
    employeeId: "PNU-001",
    attendanceDate: "2026-06-03",
    status: "Present",
    workingHours: 8,
    score: 12.50,
    createdAt: "2026-06-03T08:00:00.000Z",
    updatedAt: "2026-06-03T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu1_20260604",
    employeeId: "PNU-001",
    attendanceDate: "2026-06-04",
    status: "Sick",
    workingHours: 0,
    score: 12.50,
    createdAt: "2026-06-04T08:00:00.000Z",
    updatedAt: "2026-06-04T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu1_20260605",
    employeeId: "PNU-001",
    attendanceDate: "2026-06-05",
    status: "Present",
    workingHours: 8,
    score: 16.67,
    createdAt: "2026-06-05T08:00:00.000Z",
    updatedAt: "2026-06-05T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu1_20260608",
    employeeId: "PNU-001",
    attendanceDate: "2026-06-08",
    status: "Present",
    workingHours: 8,
    score: 20.83,
    createdAt: "2026-06-08T08:00:00.000Z",
    updatedAt: "2026-06-08T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu1_20260609",
    employeeId: "PNU-001",
    attendanceDate: "2026-06-09",
    status: "Present",
    workingHours: 8,
    score: 25.00,
    createdAt: "2026-06-09T08:00:00.000Z",
    updatedAt: "2026-06-09T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu1_20260610",
    employeeId: "PNU-001",
    attendanceDate: "2026-06-10",
    status: "Present",
    workingHours: 8,
    score: 29.17,
    createdAt: "2026-06-10T08:00:00.000Z",
    updatedAt: "2026-06-10T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu1_20260611",
    employeeId: "PNU-001",
    attendanceDate: "2026-06-11",
    status: "Present",
    workingHours: 8,
    score: 33.33,
    createdAt: "2026-06-11T08:00:00.000Z",
    updatedAt: "2026-06-11T08:00:00.000Z"
  },
  // May 2026 records for Amanda PNU-001 to show Month/Annual view (10 present days)
  {
    attendanceId: "att_pnu1_20260511",
    employeeId: "PNU-001",
    attendanceDate: "2026-05-11",
    status: "Present",
    workingHours: 8,
    score: 83.33,
    createdAt: "2026-05-11T08:00:00.000Z",
    updatedAt: "2026-05-11T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu1_20260512",
    employeeId: "PNU-001",
    attendanceDate: "2026-05-12",
    status: "Present",
    workingHours: 8,
    score: 87.50,
    createdAt: "2026-05-12T08:00:00.000Z",
    updatedAt: "2026-05-12T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu1_20260513",
    employeeId: "PNU-001",
    attendanceDate: "2026-05-13",
    status: "Leave",
    workingHours: 0,
    score: 87.50,
    createdAt: "2026-05-13T08:00:00.000Z",
    updatedAt: "2026-05-13T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu1_20260514",
    employeeId: "PNU-001",
    attendanceDate: "2026-05-14",
    status: "Present",
    workingHours: 8,
    score: 91.67,
    createdAt: "2026-05-14T08:00:00.000Z",
    updatedAt: "2026-05-14T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu1_20260515",
    employeeId: "PNU-001",
    attendanceDate: "2026-05-15",
    status: "Present",
    workingHours: 8,
    score: 95.83,
    createdAt: "2026-05-15T08:00:00.000Z",
    updatedAt: "2026-05-15T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu1_20260518",
    employeeId: "PNU-001",
    attendanceDate: "2026-05-18",
    status: "Present",
    workingHours: 8,
    score: 100.00,
    createdAt: "2026-05-18T08:00:00.000Z",
    updatedAt: "2026-05-18T08:00:00.000Z"
  },

  // Sunisa Phromdi PNU-003 (plannedSessions 30)
  {
    attendanceId: "att_pnu3_20260601",
    employeeId: "PNU-003",
    attendanceDate: "2026-06-01",
    status: "Present",
    workingHours: 8,
    score: 3.33,
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu3_20260602",
    employeeId: "PNU-003",
    attendanceDate: "2026-06-02",
    status: "Present",
    workingHours: 8,
    score: 6.67,
    createdAt: "2026-06-02T08:00:00.000Z",
    updatedAt: "2026-06-02T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu3_20260603",
    employeeId: "PNU-003",
    attendanceDate: "2026-06-03",
    status: "Present",
    workingHours: 8,
    score: 10.00,
    createdAt: "2026-06-03T08:00:00.000Z",
    updatedAt: "2026-06-03T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu3_20260604",
    employeeId: "PNU-003",
    attendanceDate: "2026-06-04",
    status: "Leave",
    workingHours: 0,
    score: 10.00,
    createdAt: "2026-06-04T08:00:00.000Z",
    updatedAt: "2026-06-04T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu3_20260605",
    employeeId: "PNU-003",
    attendanceDate: "2026-06-05",
    status: "Present",
    workingHours: 8,
    score: 13.33,
    createdAt: "2026-06-05T08:00:00.000Z",
    updatedAt: "2026-06-05T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu3_20260608",
    employeeId: "PNU-003",
    attendanceDate: "2026-06-08",
    status: "Present",
    workingHours: 8,
    score: 16.67,
    createdAt: "2026-06-08T08:00:00.000Z",
    updatedAt: "2026-06-08T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu3_20260609",
    employeeId: "PNU-003",
    attendanceDate: "2026-06-09",
    status: "Present",
    workingHours: 8,
    score: 20.00,
    createdAt: "2026-06-09T08:00:00.000Z",
    updatedAt: "2026-06-09T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu3_20260610",
    employeeId: "PNU-003",
    attendanceDate: "2026-06-10",
    status: "Absent",
    workingHours: 0,
    score: 20.00,
    createdAt: "2026-06-10T08:00:00.000Z",
    updatedAt: "2026-06-10T08:00:00.000Z"
  },
  {
    attendanceId: "att_pnu3_20260611",
    employeeId: "PNU-003",
    attendanceDate: "2026-06-11",
    status: "Present",
    workingHours: 8,
    score: 23.33,
    createdAt: "2026-06-11T08:00:00.000Z",
    updatedAt: "2026-06-11T08:00:00.000Z"
  }
];

// Initialize LocalStorage with seeds if empty
function initLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(MOCK_PROFILES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(MOCK_ATTENDANCE));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LEAVES)) {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(MOCK_LEAVES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(MOCK_EMPLOYEES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE_NEW)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_NEW, JSON.stringify(MOCK_ATTENDANCE_NEW));
  }
  if (!localStorage.getItem(STORAGE_KEYS.OVERRIDE_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.OVERRIDE_LOGS, JSON.stringify(MOCK_OVERRIDE_LOGS));
  }
}

initLocalStorage();

// Helper to get local data helper
function getLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

let localOnlyFallback = false;

export const dataService = {
  // Check if system is in real firebase mode
  isCloudMode(): boolean {
    return isFirebaseConfigured && db !== null && !localOnlyFallback;
  },

  setOfflineMode(offline: boolean) {
    localOnlyFallback = offline;
    console.log('[dataService] Offline fallback set to:', offline);
  },

  getOfflineMode(): boolean {
    return localOnlyFallback;
  },

  // USER PROFILES
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (this.isCloudMode()) {
      const path = `users/${uid}`;
      try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as UserProfile;
        }
        return null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
        return null;
      }
    } else {
      const profiles = getLocal<UserProfile>(STORAGE_KEYS.PROFILES);
      return profiles.find(p => p.uid === uid) || null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (this.isCloudMode()) {
      const path = `users/${profile.uid}`;
      try {
        await setDoc(doc(db, 'users', profile.uid), profile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      const profiles = getLocal<UserProfile>(STORAGE_KEYS.PROFILES);
      const filtered = profiles.filter(p => p.uid !== profile.uid);
      filtered.push(profile);
      saveLocal(STORAGE_KEYS.PROFILES, filtered);
    }
  },

  async getAllUsers(): Promise<UserProfile[]> {
    if (this.isCloudMode()) {
      const path = 'users';
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const users: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          users.push(doc.data() as UserProfile);
        });
        return users;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
        return [];
      }
    } else {
      return getLocal<UserProfile>(STORAGE_KEYS.PROFILES);
    }
  },

  // ATTENDANCE LOGS
  async getAttendanceToday(userId: string): Promise<AttendanceRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    if (this.isCloudMode()) {
      const path = `attendance/${userId}_${today}`;
      try {
        const docRef = doc(db, 'attendance', `${userId}_${today}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as AttendanceRecord;
        }
        return null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
        return null;
      }
    } else {
      const records = getLocal<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE);
      return records.find(r => r.userId === userId && r.date === today) || null;
    }
  },

  async getUserAttendanceHistory(userId: string): Promise<AttendanceRecord[]> {
    if (this.isCloudMode()) {
      const path = 'attendance';
      try {
        const q = query(
          collection(db, 'attendance'), 
          where('userId', '==', userId),
          orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const records: AttendanceRecord[] = [];
        querySnapshot.forEach((doc) => {
          records.push(doc.data() as AttendanceRecord);
        });
        return records;
      } catch (err) {
        // Fallback search if index is building or other error
        try {
          const qSimple = query(collection(db, 'attendance'), where('userId', '==', userId));
          const snapSimple = await getDocs(qSimple);
          const list: AttendanceRecord[] = [];
          snapSimple.forEach((doc) => list.push(doc.data() as AttendanceRecord));
          return list.sort((a,b) => b.date.localeCompare(a.date));
        } catch {
          handleFirestoreError(err, OperationType.LIST, path);
          return [];
        }
      }
    } else {
      const records = getLocal<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE);
      return records
        .filter(r => r.userId === userId)
        .sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  async checkIn(userId: string, userName: string, email: string, checkInLocation: string, remarks: string, status: 'present' | 'late'): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
    const recordId = `${userId}_${today}`;

    const record: AttendanceRecord = {
      id: recordId,
      userId,
      userName,
      email,
      date: today,
      checkIn: timeStr,
      checkOut: null,
      status,
      checkInLocation,
      checkOutLocation: null,
      remarks: remarks || null,
      workNotes: null
    };

    if (this.isCloudMode()) {
      const path = `attendance/${recordId}`;
      try {
        await setDoc(doc(db, 'attendance', recordId), record);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      const records = getLocal<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE);
      const filtered = records.filter(r => r.id !== recordId);
      filtered.push(record);
      saveLocal(STORAGE_KEYS.ATTENDANCE, filtered);
    }

    return record;
  },

  async checkOut(userId: string, checkOutLocation: string, workNotes: string): Promise<AttendanceRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
    const recordId = `${userId}_${today}`;

    if (this.isCloudMode()) {
      const path = `attendance/${recordId}`;
      try {
        const docRef = doc(db, 'attendance', recordId);
        const updates = {
          checkOut: timeStr,
          checkOutLocation,
          workNotes
        };
        await updateDoc(docRef, updates);
        
        const updatedDocSnap = await getDoc(docRef);
        return updatedDocSnap.exists() ? (updatedDocSnap.data() as AttendanceRecord) : null;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
        return null;
      }
    } else {
      const records = getLocal<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE);
      const idx = records.findIndex(r => r.id === recordId);
      if (idx !== -1) {
        records[idx].checkOut = timeStr;
        records[idx].checkOutLocation = checkOutLocation || 'Liberal Arts Office';
        records[idx].workNotes = workNotes || 'Duties completed';
        saveLocal(STORAGE_KEYS.ATTENDANCE, records);
        return records[idx];
      }
      return null;
    }
  },

  async getAllAttendance(): Promise<AttendanceRecord[]> {
    if (this.isCloudMode()) {
      const path = 'attendance';
      try {
        const querySnapshot = await getDocs(collection(db, 'attendance'));
        const records: AttendanceRecord[] = [];
        querySnapshot.forEach((doc) => {
          records.push(doc.data() as AttendanceRecord);
        });
        return records.sort((a,b) => b.date.localeCompare(a.date));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
        return [];
      }
    } else {
      return getLocal<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE).sort((a,b) => b.date.localeCompare(a.date));
    }
  },

  // LEAVE REQUESTS
  async getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
    if (this.isCloudMode()) {
      const path = 'leaveRequests';
      try {
        const q = query(
          collection(db, 'leaveRequests'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const reqs: LeaveRequest[] = [];
        querySnapshot.forEach((doc) => {
          reqs.push(doc.data() as LeaveRequest);
        });
        return reqs;
      } catch (err) {
        try {
          const qSimple = query(collection(db, 'leaveRequests'), where('userId', '==', userId));
          const snapSimple = await getDocs(qSimple);
          const list: LeaveRequest[] = [];
          snapSimple.forEach((doc) => list.push(doc.data() as LeaveRequest));
          return list.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
        } catch {
          handleFirestoreError(err, OperationType.LIST, path);
          return [];
        }
      }
    } else {
      const leaves = getLocal<LeaveRequest>(STORAGE_KEYS.LEAVES);
      return leaves
        .filter(l => l.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  async createLeaveRequest(userId: string, userName: string, email: string, leaveType: 'sick' | 'vacation' | 'business' | 'maternity', startDate: string, endDate: string, reason: string): Promise<LeaveRequest> {
    const id = 'leave-' + Math.random().toString(36).substr(2, 9);
    const leave: LeaveRequest = {
      id,
      userId,
      userName,
      email,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null
    };

    if (this.isCloudMode()) {
      const path = `leaveRequests/${id}`;
      try {
        await setDoc(doc(db, 'leaveRequests', id), leave);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      const leaves = getLocal<LeaveRequest>(STORAGE_KEYS.LEAVES);
      leaves.push(leave);
      saveLocal(STORAGE_KEYS.LEAVES, leaves);
    }

    return leave;
  },

  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    if (this.isCloudMode()) {
      const path = 'leaveRequests';
      try {
        const querySnapshot = await getDocs(collection(db, 'leaveRequests'));
        const list: LeaveRequest[] = [];
        querySnapshot.forEach((doc) => {
          list.push(doc.data() as LeaveRequest);
        });
        return list.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
        return [];
      }
    } else {
      return getLocal<LeaveRequest>(STORAGE_KEYS.LEAVES).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  async reviewLeaveRequest(leaveRequestId: string, reviewerEmail: string, status: 'approved' | 'rejected'): Promise<LeaveRequest | null> {
    if (this.isCloudMode()) {
      const path = `leaveRequests/${leaveRequestId}`;
      try {
        const docRef = doc(db, 'leaveRequests', leaveRequestId);
        const updates = {
          status,
          reviewedBy: reviewerEmail,
          reviewedAt: new Date().toISOString()
        };
        await updateDoc(docRef, updates);
        
        // Update user state if approved for on-leave
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data() as LeaveRequest) : null;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
        return null;
      }
    } else {
      const leaves = getLocal<LeaveRequest>(STORAGE_KEYS.LEAVES);
      const idx = leaves.findIndex(l => l.id === leaveRequestId);
      if (idx !== -1) {
        leaves[idx].status = status;
        leaves[idx].reviewedBy = reviewerEmail;
        leaves[idx].reviewedAt = new Date().toISOString();
        saveLocal(STORAGE_KEYS.LEAVES, leaves);
        return leaves[idx];
      }
      return null;
    }
  },

  // EMPLOYEE MANAGEMENT
  async getAllEmployees(): Promise<Employee[]> {
    if (this.isCloudMode()) {
      const path = 'employees';
      try {
        const querySnapshot = await getDocs(collection(db, 'employees'));
        const list: Employee[] = [];
        querySnapshot.forEach((doc) => {
          list.push(doc.data() as Employee);
        });
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
        return [];
      }
    } else {
      return getLocal<Employee>(STORAGE_KEYS.EMPLOYEES).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    if (this.isCloudMode()) {
      const path = `employees/${employeeId}`;
      try {
        const docRef = doc(db, 'employees', employeeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as Employee;
        }
        return null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
        return null;
      }
    } else {
      const list = getLocal<Employee>(STORAGE_KEYS.EMPLOYEES);
      return list.find(e => e.employeeId === employeeId) || null;
    }
  },

  async createEmployee(employee: Employee): Promise<void> {
    const existingEmp = await this.getEmployeeById(employee.employeeId);
    if (existingEmp) {
      throw new Error(`Employee ID ${employee.employeeId} already exists!`);
    }

    if (this.isCloudMode()) {
      const path = `employees/${employee.employeeId}`;
      try {
        await setDoc(doc(db, 'employees', employee.employeeId), employee);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      const list = getLocal<Employee>(STORAGE_KEYS.EMPLOYEES);
      list.push(employee);
      saveLocal(STORAGE_KEYS.EMPLOYEES, list);
    }
  },

  async updateEmployee(oldId: string, employee: Employee): Promise<void> {
    if (oldId !== employee.employeeId) {
      const existingEmp = await this.getEmployeeById(employee.employeeId);
      if (existingEmp) {
        throw new Error(`Employee ID ${employee.employeeId} already exists!`);
      }
    }

    if (this.isCloudMode()) {
      try {
        if (oldId !== employee.employeeId) {
          await setDoc(doc(db, 'employees', employee.employeeId), employee);
          await deleteDoc(doc(db, 'employees', oldId));
        } else {
          await setDoc(doc(db, 'employees', employee.employeeId), employee);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `employees/${employee.employeeId}`);
      }
    } else {
      const list = getLocal<Employee>(STORAGE_KEYS.EMPLOYEES);
      const filtered = list.filter(e => e.employeeId !== oldId);
      filtered.push(employee);
      saveLocal(STORAGE_KEYS.EMPLOYEES, filtered);
    }
  },

  async deleteEmployee(employeeId: string): Promise<void> {
    if (this.isCloudMode()) {
      const path = `employees/${employeeId}`;
      try {
        await deleteDoc(doc(db, 'employees', employeeId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      const list = getLocal<Employee>(STORAGE_KEYS.EMPLOYEES);
      const filtered = list.filter(e => e.employeeId !== employeeId);
      saveLocal(STORAGE_KEYS.EMPLOYEES, filtered);
    }
  },

  // NEW ATTENDANCE RECORDS MANAGEMENT
  async getAllAttendanceRecords(): Promise<AttendanceRecordNew[]> {
    if (this.isCloudMode()) {
      const path = 'attendance_records';
      try {
        const querySnapshot = await getDocs(collection(db, 'attendance_records'));
        const list: AttendanceRecordNew[] = [];
        querySnapshot.forEach((doc) => {
          list.push(doc.data() as AttendanceRecordNew);
        });
        return list.sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
        return [];
      }
    } else {
      return getLocal<AttendanceRecordNew>(STORAGE_KEYS.ATTENDANCE_NEW).sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
    }
  },

  subscribeToAttendanceRecords(onUpdate: (records: AttendanceRecordNew[]) => void, onError?: (error: any) => void): () => void {
    if (this.isCloudMode()) {
      const path = 'attendance_records';
      const unsubscribe = onSnapshot(collection(db, 'attendance_records'), (snapshot) => {
        const list: AttendanceRecordNew[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as AttendanceRecordNew);
        });
        const sorted = list.sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
        onUpdate(sorted);
      }, (err) => {
        const handledError = handleFirestoreError(err, OperationType.GET, path);
        if (onError) onError(handledError);
      });
      return unsubscribe;
    } else {
      // Return a 1s poller for offline/mock state to keep things reactive
      const interval = setInterval(() => {
        const records = getLocal<AttendanceRecordNew>(STORAGE_KEYS.ATTENDANCE_NEW).sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
        onUpdate(records);
      }, 1000);
      return () => clearInterval(interval);
    }
  },

  subscribeToEmployees(onUpdate: (employees: Employee[]) => void, onError?: (error: any) => void): () => void {
    if (this.isCloudMode()) {
      const path = 'employees';
      const unsubscribe = onSnapshot(collection(db, 'employees'), (snapshot) => {
        const list: Employee[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Employee);
        });
        onUpdate(list);
      }, (err) => {
        const handledError = handleFirestoreError(err, OperationType.GET, path);
        if (onError) onError(handledError);
      });
      return unsubscribe;
    } else {
      const interval = setInterval(() => {
        const employees = getLocal<Employee>(STORAGE_KEYS.EMPLOYEES);
        onUpdate(employees);
      }, 1000);
      return () => clearInterval(interval);
    }
  },

  async getEmployeeAttendanceRecords(employeeId: string): Promise<AttendanceRecordNew[]> {
    if (this.isCloudMode()) {
      const path = 'attendance_records';
      try {
        const q = query(collection(db, 'attendance_records'), where('employeeId', '==', employeeId));
        const querySnapshot = await getDocs(q);
        const list: AttendanceRecordNew[] = [];
        querySnapshot.forEach((doc) => {
          list.push(doc.data() as AttendanceRecordNew);
        });
        return list.sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
      } catch (err) {
        // Fallback list to filter on client side if indices are still building
        try {
          const snapshot = await getDocs(collection(db, 'attendance_records'));
          const list: AttendanceRecordNew[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as AttendanceRecordNew;
            if (data.employeeId === employeeId) {
              list.push(data);
            }
          });
          return list.sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
        } catch {
          handleFirestoreError(err, OperationType.LIST, path);
          return [];
        }
      }
    } else {
      const list = getLocal<AttendanceRecordNew>(STORAGE_KEYS.ATTENDANCE_NEW);
      return list.filter(r => r.employeeId === employeeId).sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
    }
  },

  async calculateAndSyncScores(employeeId: string): Promise<void> {
    const employee = await this.getEmployeeById(employeeId);
    if (!employee) return;
    const plannedSessions = employee.plannedSessions || 100;

    const records = await this.getEmployeeAttendanceRecords(employeeId);

    const sorted = [...records].sort((a, b) => a.attendanceDate.localeCompare(b.attendanceDate));
    let presentCount = 0;
    const maxPoints = 100;

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].status === 'Present') {
        presentCount++;
      }
      const score = Math.min((presentCount / plannedSessions) * maxPoints, maxPoints);
      sorted[i].score = parseFloat(score.toFixed(2));
      sorted[i].updatedAt = new Date().toISOString();

      if (this.isCloudMode()) {
        const path = `attendance_records/${sorted[i].attendanceId}`;
        try {
          await setDoc(doc(db, 'attendance_records', sorted[i].attendanceId), sorted[i]);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    }

    if (!this.isCloudMode()) {
      const allList = getLocal<AttendanceRecordNew>(STORAGE_KEYS.ATTENDANCE_NEW);
      const filtered = allList.filter(r => r.employeeId !== employeeId);
      const merged = [...filtered, ...sorted];
      saveLocal(STORAGE_KEYS.ATTENDANCE_NEW, merged);
    }
  },

  async saveAttendanceRecord(record: AttendanceRecordNew): Promise<void> {
    if (this.isCloudMode()) {
      const path = `attendance_records/${record.attendanceId}`;
      try {
        await setDoc(doc(db, 'attendance_records', record.attendanceId), record);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      const list = getLocal<AttendanceRecordNew>(STORAGE_KEYS.ATTENDANCE_NEW);
      const filtered = list.filter(r => r.attendanceId !== record.attendanceId);
      filtered.push(record);
      saveLocal(STORAGE_KEYS.ATTENDANCE_NEW, filtered);
    }

    await this.calculateAndSyncScores(record.employeeId);
  },

  // OVERRIDE LOGS MANAGEMENT
  async getAllOverrideLogs(): Promise<OverrideLog[]> {
    if (this.isCloudMode()) {
      const path = 'override_logs';
      try {
        const querySnapshot = await getDocs(collection(db, 'override_logs'));
        const list: OverrideLog[] = [];
        querySnapshot.forEach((doc) => {
          list.push(doc.data() as OverrideLog);
        });
        return list.sort((a, b) => b.editedAt.localeCompare(a.editedAt));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
        return [];
      }
    } else {
      return getLocal<OverrideLog>(STORAGE_KEYS.OVERRIDE_LOGS).sort((a, b) => b.editedAt.localeCompare(a.editedAt));
    }
  },

  async saveOverrideLog(log: OverrideLog): Promise<void> {
    if (this.isCloudMode()) {
      const path = `override_logs/${log.id}`;
      try {
        await setDoc(doc(db, 'override_logs', log.id), log);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      const list = getLocal<OverrideLog>(STORAGE_KEYS.OVERRIDE_LOGS);
      list.push(log);
      saveLocal(STORAGE_KEYS.OVERRIDE_LOGS, list);
    }
  },

  async getAttendanceRecordById(attendanceId: string): Promise<AttendanceRecordNew | null> {
    if (this.isCloudMode()) {
      const path = `attendance_records/${attendanceId}`;
      try {
        const docRef = doc(db, 'attendance_records', attendanceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as AttendanceRecordNew;
        }
        return null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
        return null;
      }
    } else {
      const list = getLocal<AttendanceRecordNew>(STORAGE_KEYS.ATTENDANCE_NEW);
      return list.find(r => r.attendanceId === attendanceId) || null;
    }
  },

  async overrideAttendanceRecord(record: AttendanceRecordNew, reason: string, editedBy: string): Promise<void> {
    if (!reason || reason.trim() === '') {
      throw new Error('A reason for manual override is mandatory.');
    }
    const oldRecord = await this.getAttendanceRecordById(record.attendanceId);
    const oldValue = oldRecord 
      ? `Status: ${oldRecord.status}, Hours: ${oldRecord.workingHours} hrs` 
      : 'No previous record';
    const newValue = `Status: ${record.status}, Hours: ${record.workingHours} hrs`;

    const log: OverrideLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      attendanceId: record.attendanceId,
      employeeId: record.employeeId,
      oldValue,
      newValue,
      reason,
      editedBy,
      editedAt: new Date().toISOString()
    };

    // 1. Save Log
    await this.saveOverrideLog(log);

    // 2. Save Updated Attendance Record (which triggers sync and scores)
    await this.saveAttendanceRecord(record);
  },

  async deleteAttendanceRecord(attendanceId: string, employeeId: string): Promise<void> {
    if (this.isCloudMode()) {
      const path = `attendance_records/${attendanceId}`;
      try {
        await deleteDoc(doc(db, 'attendance_records', attendanceId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      const list = getLocal<AttendanceRecordNew>(STORAGE_KEYS.ATTENDANCE_NEW);
      const filtered = list.filter(r => r.attendanceId !== attendanceId);
      saveLocal(STORAGE_KEYS.ATTENDANCE_NEW, filtered);
    }

    await this.calculateAndSyncScores(employeeId);
  }
};
