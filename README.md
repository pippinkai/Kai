# Phranakhon Rajabhat University (PNU) - Faculty of Liberal Arts HR Portal

A production-ready Regulatory Attendance and Lecturer Performance Scoring Portal for the Faculty of Liberal Arts at Phranakhon Rajabhat University. Built using React, Vite, Tailwind CSS, TypeScript, and Firebase. This application features secure, enterprise-grade authentication with Google Identity Provider, role-based access control (RBAC), automatic scoring calculations, audit trailers, and an interactive intelligence dashboard.

---

## 🎯 Project Overview & Core Features

This portal is custom-designed for the academic unit context:
- **Authentication & Security**: Strictly federated login using **Google Workspace Provider**, restricting entry based on `@pnu.ac.th` domains with verified emails.
- **Role-Based Access Control**: Fully separated permissions into **HR_ADMIN** (comprehensive CRUD access, override editing, roster management, regulatory auditing) and **STAFF** (read-only self profile viewing, historical score checking, personal attendance reports).
- **Intelligent Performance Dashboard**: Interactive analytics showing current date metrics, departmental performance comparisons (using Recharts), 7-day attendance trends, and status breakdowns.
- **Roster Exporting Engine**: Fully formatted UTF-8 CSV exporter compatible with Microsoft Excel and Google Sheets, embedded with BOM headers to prevent Thai or character set corruption.
- **Lecture Session Scoring Rules**: Dynamic performance scoring module calculating lecturer presence aggregate vs. planned session requirements to output automated scale indexes (0 - 100 points).
- **Manual Override Audit Logs**: Strict manual changes to verified records require documenting a reason, stored with user ID, timestamps, old/new states, restricted strictly to HR administrators to satisfy local compliance acts.

---

## 🛠 Tech Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling UI**: Tailwind CSS (with highly responsive grids and cards)
- **Charts Engine**: Recharts (with robust sizing and animated lines/bars)
- **Database & Authentication**: Firebase (Firestore and Authentication)
- **Hosting Configuration**: Netlify Deployment Configured & GitHub Repository Ready

---

## 📂 Project Architecture & Main Modules

- `src/lib/firebase.ts`: Handles secure client-side Firebase initialization fallback, loading config from environment variables (`import.meta.env`) or local applet files.
- `src/lib/dataService.ts`: Core data transaction layer. Bridges local storage mocking and Firestore cloud modes.
- `src/components/AttendanceManagementModule.tsx`: Module managing primary records, check-ins, overrides, and calculating live academic ratings.
- `src/pages/HRDashboard.tsx`: High-performance analytical bento cards displaying dynamic live trends and exports.
- `firestore.rules`: Mathematically hardened security declarations preventing updating gaps, identity spoofing, and list injection.

---

## 🗄 Firestore Collection Schema Mapping

1. **`users/{userId}`**
   - Stores authenticated accounts, roles (`HR_ADMIN`, `STAFF`), and basic profiles.
2. **`employees/{employeeId}`**
   - Keeps lecturer contract data (e.g., department, academic position, emails, planned session quantities).
3. **`attendance_records/{attendanceId}`**
   - Tracks daily attendance state, actual session work hours, automated scores, and compliance tags.
4. **`override_logs/{logId}`**
   - Irreversible audit logs showing old value vs. new value, reasoning text, and the HR author UID.

---

## 🧑‍💻 How to Run Locally

1. Clone the repository and install all dependencies:
   ```bash
   npm install
   ```
2. Configure your local configuration file by duplicating `.env.example` into `.env` and setting your live credentials:
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   VITE_FIREBASE_FIRESTORE_DATABASE_ID="default"
   ```
3. Start the Vite server locally:
   ```bash
   npm run dev
   ```

---

*This application was deployed in strict conformity with PNU security mandates, certified, compiled, and audited.*
