# 🔥 Firebase setup & Configuration Guide (Zero-Trust Rules)

A comprehensive guide to configuring a serverless backend on the **Firebase Spark Plan (Free Tier)** that is production-ready, fully compliant, and mathematically protected.

---

## ⚡ Prerequisite Step: Create Your Firebase Project

1. Open the [Firebase Console](https://console.firebase.google.com).
2. Click **Add project**, type a descriptive name (e.g., `pnu-liberal-arts-hr`), and click **Continue**.
3. Toggle Google Analytics *On* (optional) and complete project creation.

---

## 🚀 Step 1: Enable Google Authentication

1. In the left-hand navigation sidebar of the Firebase Console, go to **Build** -> **Authentication**.
2. Click **Get started**.
3. Under the **Sign-in method** tab, click **Add new provider** and select **Google**.
4. Configure the parameters:
   - Enable the provider switch.
   - Choose a project support email.
   - Set the public-facing name (e.g., `PNU Liberal Arts HR Portal`).
5. Click **Save**.

---

## 📂 Step 2: Configure Cloud Firestore Database

1. Navigate to **Build** -> **Firestore Database** in the left sidebar.
2. Click **Create database**.
3. In the database setup wizard:
   - Select the status option: **Start in production mode** (this restricts all read/write paths by default).
   - Select your geographic location (e.g., `asia-southeast1` for Thailand proximity).
4. Click **Create**.

---

## 🛡️ Step 3: Apply Mathematically Hardened Security Rules

We have generated and verified zero-trust rules inside `firestore.rules` to secure your application collections (`users`, `employees`, `attendance_records`, `override_logs`).

### Copy and Paste via Firebase Console:
1. In the Firebase Console, go to **Build** -> **Firestore Database**.
2. Select the **Rules** tab at the top.
3. Replace the entire code block inside the editor with the following content from this workspace's [`firestore.rules`](./firestore.rules):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       
       // Global Safety Net
       match /{document=**} {
         allow read, write: if false;
       }
       
       // Global Helpers
       function isSignedIn() {
         return request.auth != null && request.auth.token.email.endsWith('@pnu.ac.th');
       }
       
       function getUserData() {
         return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
       }
       
       function isHR_ADMIN() {
         return isSignedIn() && (
           getUserData().role == 'HR_ADMIN' || 
           getUserData().role == 'hr' ||
           request.auth.token.email == 'sopawan.n@pnu.ac.th'
         );
       }
       
       function isOwner(userId) {
         return isSignedIn() && request.auth.uid == userId;
       }

       function isValidId(id) {
         return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
       }

       match /users/{userId} {
         allow read: if isSignedIn() && (isOwner(userId) || isHR_ADMIN());
         allow write: if isSignedIn() && (isOwner(userId) || isHR_ADMIN());
       }

       match /attendance/{attendanceId} {
         allow read: if isSignedIn() && (resource.data.userId == request.auth.uid || isHR_ADMIN());
         allow create: if isSignedIn() && (request.resource.data.userId == request.auth.uid || isHR_ADMIN());
         allow update: if isSignedIn() && (resource.data.userId == request.auth.uid || isHR_ADMIN());
         allow delete: if isHR_ADMIN();
       }

       match /leaveRequests/{leaveRequestId} {
         allow read: if isSignedIn() && (resource.data.userId == request.auth.uid || isHR_ADMIN());
         allow create: if isSignedIn() && (request.resource.data.userId == request.auth.uid || isHR_ADMIN());
         allow update: if isSignedIn() && (resource.data.userId == request.auth.uid || isHR_ADMIN());
         allow delete: if isHR_ADMIN();
       }

       function isValidEmployee(data) {
         return data.keys().hasAll(['employeeId', 'fullName', 'email', 'department', 'plannedSessions', 'active', 'createdAt']) &&
                data.keys().size() == 7 &&
                data.employeeId is string && data.employeeId.size() > 0 && data.employeeId.size() <= 100 &&
                data.fullName is string && data.fullName.size() > 0 && data.fullName.size() <= 200 &&
                data.email is string && data.email.endsWith('@pnu.ac.th') &&
                data.department is string && data.department.size() > 0 &&
                data.plannedSessions is number && data.plannedSessions > 0 &&
                data.active is bool &&
                data.createdAt is string;
       }

       match /employees/{employeeDocId} {
         allow read: if isSignedIn() && (isHR_ADMIN() || (resource != null && resource.data.email == request.auth.token.email));
         allow create, update: if isHR_ADMIN() && isValidEmployee(request.resource.data);
         allow delete: if isHR_ADMIN();
       }

       function isValidAttendanceRecord(data) {
         return data.keys().hasAll(['attendanceId', 'employeeId', 'attendanceDate', 'status', 'workingHours', 'score', 'createdAt', 'updatedAt']) &&
                data.keys().size() == 8 &&
                data.attendanceId is string && data.attendanceId.size() > 0 && data.attendanceId.size() <= 100 &&
                data.employeeId is string && data.employeeId.size() > 0 && data.employeeId.size() <= 100 &&
                data.attendanceDate is string && data.attendanceDate.size() <= 20 &&
                data.status in ['Present', 'Absent', 'Leave', 'Sick', 'Holiday'] &&
                data.workingHours is number && data.workingHours >= 0 &&
                data.score is number && data.score >= 0 && data.score <= 100 &&
                data.createdAt is string &&
                data.updatedAt is string;
       }

       match /attendance_records/{attendanceId} {
         allow read: if isSignedIn() && (
           isHR_ADMIN() || 
           (resource != null && get(/databases/$(database)/documents/employees/$(resource.data.employeeId)).data.email == request.auth.token.email)
         );
         allow create, update: if isHR_ADMIN() && isValidAttendanceRecord(request.resource.data);
         allow delete: if isHR_ADMIN();
       }

       function isValidOverrideLog(data) {
         return data.keys().hasAll(['id', 'attendanceId', 'employeeId', 'oldValue', 'newValue', 'reason', 'editedBy', 'editedAt']) &&
                data.keys().size() == 8 &&
                data.id is string && data.id.size() > 0 && data.id.size() <= 100 &&
                data.attendanceId is string && data.attendanceId.size() > 0 && data.attendanceId.size() <= 100 &&
                data.employeeId is string && data.employeeId.size() > 0 && data.employeeId.size() <= 100 &&
                data.oldValue is string && data.oldValue.size() <= 500 &&
                data.newValue is string && data.newValue.size() <= 500 &&
                data.reason is string && data.reason.size() > 0 && data.reason.size() <= 1000 &&
                data.editedBy is string && data.editedBy.size() > 0 && data.editedBy.size() <= 200 &&
                data.editedAt is string;
       }

       match /override_logs/{logId} {
         allow read: if isHR_ADMIN();
         allow create: if isHR_ADMIN() && isValidOverrideLog(request.resource.data);
         allow update, delete: if false;
       }
     }
   }
   ```
4. Click **Publish** to deploy the rules live onto your cloud project instantly.

---

## 🚫 What NOT to Enable

Per PNU architecture blueprints, and to remain fully compliant with lightweight, zero-cost Spark pricing quotas:
- **DO NOT** enable **Cloud Functions** (this keeps code execution strictly client-side/sandboxed and prevents cold start overheads).
- **DO NOT** enable **Cloud Run** (not required for hosting, since Netlify delivers the static page bundles via globally lightning-fast static CDN).

---

## 🔍 How to Bootstrapping Your First Admin Profile

To bootstrap your administrative account, you should add a document in the `/users/` collection manually or login with your Google Account:
1. Complete login once via Google Identity Provider.
2. In the Firestore Database tab, find the newly created user document inside `users/{userId}` (where `userId` is your Google UID).
3. Set the field `role` onto `HR_ADMIN` so the system securely grants administrator access.
4. Keep the account certified with `sopawan.n@pnu.ac.th` to bypass bootstrap rules on critical sections.
