/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Page, UserRole } from '../types';
import { 
  LogIn, 
  GraduationCap, 
  ArrowLeft, 
  HelpCircle,
  ExternalLink,
  AlertTriangle,
  Chrome,
  Lock,
  ShieldAlert,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LoginPageProps {
  setCurrentPage: (page: Page) => void;
  setActiveTab: (tab: 'dashboard' | 'attendance' | 'reports' | 'profile') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ setCurrentPage, setActiveTab }) => {
  const { loginWithGoogle, simulateLocalLogin, fbAuthError, setFbAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [error, setError] = useState('');
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Automatically expand troubleshooting if an authentication error occurs
  useEffect(() => {
    if (fbAuthError) {
      setShowTroubleshoot(true);
      setError('Firebase authentication failed. See detailed setup instructions below.');
    }
  }, [fbAuthError]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      if (setFbAuthError) setFbAuthError(null);
      await loginWithGoogle();
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Firebase authentication failed. Check details below.');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide a valid university email.');
      return;
    }
    if (!email.includes('@')) {
      setError('Email format is missing "@ university domain".');
      return;
    }

    // Capture standard roles or determine by email suffix / prefix matches
    let assignedRole = role;
    if (email.toLowerCase().includes('sopawan.n@pnu.ac.th')) {
      assignedRole = 'HR_ADMIN';
    }

    simulateLocalLogin(email, assignedRole);
    setActiveTab('dashboard');
    if (assignedRole === 'hr' || assignedRole === 'HR_ADMIN') {
      setCurrentPage(Page.HR_DASHBOARD);
    } else {
      setCurrentPage(Page.STAFF_DASHBOARD);
    }
  };

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const projectId = 'gen-lang-client-0145855189';
  const devUrl = 'ais-dev-4unp4kmfmmifervbkym2pv-975019251916.asia-southeast1.run.app';
  const preUrl = 'ais-pre-4unp4kmfmmifervbkym2pv-975019251916.asia-southeast1.run.app';

  // Categorize specific authentication errors
  const isPopupBlocked = !!(fbAuthError?.includes('popup-closed-by-user') || fbAuthError?.includes('cancelled-popup-request') || fbAuthError?.includes('popup-blocked'));
  const isUnauthorizedDomain = !!(fbAuthError?.includes('unauthorized-domain'));
  const isOperationNotAllowed = !!(fbAuthError?.includes('operation-not-allowed'));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-200" id="login-page">
      
      {/* Return to home button */}
      <div className="absolute top-6 left-6">
        <button
          id="btn-return-home"
          onClick={() => setCurrentPage(Page.LANDING)}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Crest */}
        <div className="mx-auto h-16 w-16 rounded-full bg-slate-900 border-2 border-amber-500 flex items-center justify-center text-amber-500 shadow-sm">
          <GraduationCap className="w-8 h-8" />
        </div>

        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900 font-sans">
          Faculty Port Access
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 font-mono tracking-wider uppercase">
          Faculty of Liberal Arts Attendance Monitor
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-slate-100 space-y-6">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-800 text-xs rounded-lg font-medium flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">เข้าสู่ระบบไม่สำเร็จ / Sign-In Error</p>
                <p className="mt-0.5 text-slate-600 leading-normal">{fbAuthError ? `Firebase Error: ${fbAuthError}` : error}</p>
              </div>
            </div>
          )}

          {isIframe && !fbAuthError && (
            <div className="p-3.5 bg-blue-50 border border-blue-100 text-blue-900 text-xs rounded-lg leading-normal flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-800">แนะนำสำหรับการล็อกอินด้วย Google:</p>
                <p className="mt-1">แอปพลิเคชันกำลังทำงานอยู่ในเฟรมจำลอง (iFrame) ซึ่งเบราว์เซอร์ส่วนใหญ่จะบล็อกหน้าต่างป๊อปอัปเพื่อความปลอดภัย</p>
                <p className="mt-1.5 font-semibold">💡 เพื่อให้ใช้งานล็อกอินได้ราบรื่น กรุณาคลิกปุ่ม "เปิดในแท็บใหม่" (Open in a new tab) ที่รูปสัญลักษณ์ลูกศรชี้เฉียงขึ้นตรงมุมขวาบนของ AI Studio ก่อนกดเข้าสู่ระบบ</p>
              </div>
            </div>
          )}

          {/* Core Login Flow button */}
          <div className="space-y-4">
            <button
              id="google-login-signin"
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 rounded-lg text-sm font-semibold text-white bg-slate-950 hover:bg-slate-900 focus:outline-none transition-all flex items-center justify-center space-x-2 shadow"
            >
              <svg className="w-4 h-4 fill-current mr-1" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.71 0 3.28.614 4.53 1.642l2.428-2.428C17.657 1.83 15.085 1 12.24 1 6.586 1 2 5.586 2 11.24s4.586 10.24 10.24 10.24c5.9 0 9.8-4.143 9.8-10 0-.614-.07-1.129-.186-1.571H12.24z"/>
              </svg>
              <span>Verify with University G-Suite</span>
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200"></span>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400 font-mono">OR SIMULATE AUTH ENTRIES</span>
              </div>
            </div>
          </div>

          {/* Form for manual simulation */}
          <form className="space-y-5" onSubmit={handleLoginSubmit}>
            <div>
              <label htmlFor="university-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-widest font-mono">
                University Email Domain
              </label>
              <div className="mt-1.5">
                <input
                  id="university-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sopawan.n@pnu.ac.th"
                  className="block w-full rounded-lg border border-slate-250 px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest font-mono">
                Assigned Authority Level
              </label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-select-staff-role"
                  onClick={() => setRole('STAFF')}
                  className={`py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                    role === 'STAFF' || role === 'staff'
                      ? 'bg-amber-55 border-amber-550 text-amber-900 border-2 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Liberal Arts Staff
                </button>
                <button
                  type="button"
                  id="btn-select-hr-role"
                  onClick={() => setRole('HR_ADMIN')}
                  className={`py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                    role === 'HR_ADMIN' || role === 'hr'
                      ? 'bg-amber-55 border-amber-550 text-amber-900 border-2 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  HR Director / Dean
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                id="btn-submit-simulate-login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 focus:outline-none transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4 mr-2" />
                <span>Log In Securely</span>
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-start space-x-2 text-[10px] text-slate-400">
            <HelpCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="leading-normal">
              For initial HR evaluation, use the email <strong className="font-semibold text-slate-500">sopawan.n@pnu.ac.th</strong>. If logging in via other systems, defaults are preconfigured based on the dean office directory database.
            </p>
          </div>

        </div>

        {/* Interactive Firebase / Google Auth Setup Troubleshooting Guide */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-300 shadow-md">
          <button
            onClick={() => setShowTroubleshoot(!showTroubleshoot)}
            className="w-full flex items-center justify-between font-medium text-xs tracking-wider uppercase text-amber-500 font-mono focus:outline-none"
            id="toggle-troubleshoot"
          >
            <span className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4" />
              <span>คู่มือตั้งค่า Google Sign-In ใน Firebase</span>
            </span>
            {showTroubleshoot ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTroubleshoot && (
            <div className="mt-4 space-y-4 text-xs font-sans leading-relaxed border-t border-slate-800 pt-4">
              <p className="text-slate-400">
                เนื่องจากแอปพลิเคชันนี้ทำงานร่วมกับ Firebase Authentication จริง การเปิดให้ผู้ใช้งานทั่วไปสามารถล็อกอินด้วยอีเมล <span className="text-amber-300 font-mono">@pnu.ac.th</span> ต้องตั้งค่า 3 ขั้นตอนดังนี้ใน Firebase Console:
              </p>

              {/* Step 1 */}
              <div className={`p-3 rounded-lg border transition-all ${
                isPopupBlocked || isIframe 
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' 
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
              }`}>
                <div className="flex items-start space-x-2">
                  <span className="font-mono text-xs bg-slate-800 text-slate-200 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h4 className="font-semibold flex items-center space-x-1.5 text-amber-400">
                      <span>เปิดด้วยแท็บใหม่ (Open in New Tab)</span>
                      {(isPopupBlocked || isIframe) && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">แนะนำเลย</span>}
                    </h4>
                    <p className="mt-1 text-slate-300">
                      การรันผ่านระบบจำลองแบบ iFrame มักถูกเบราว์เซอร์บล็อกหน้าต่าง Google Login ป๊อปอัปให้คลิกรูปเครื่องหมายลูกศรชี้เฉียงขึ้น <strong className="text-white hover:underline">"เปิดเป็นแท็บใหม่ (Open in a new tab)"</strong> ที่ด้านบนขวาของเฟรมพรีวิว จากนั้นลองกดปุ่ม Google อีกครั้ง
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`p-3 rounded-lg border transition-all ${
                isUnauthorizedDomain 
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' 
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
              }`}>
                <div className="flex items-start space-x-2">
                  <span className="font-mono text-xs bg-slate-800 text-slate-200 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="w-full">
                    <h4 className="font-semibold flex items-center space-x-1.5 text-amber-400">
                      <span>เพิ่มเครื่องเซิร์ฟเวอร์ใน Authorized Domains</span>
                      {isUnauthorizedDomain && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">ต้องแก้ไข</span>}
                    </h4>
                    <p className="mt-1 text-slate-300">
                      ต้องนำโดเมนพรีวิวของแอปนี้ไปเพิ่มใน "ผู้ให้บริการที่ได้รับอนุญาต" ใน Firebase Console:
                    </p>
                    
                    <div className="mt-2 bg-slate-900 border border-slate-800 rounded p-2 text-[11px] space-y-1.5 font-mono select-all text-amber-300">
                      <div>{devUrl}</div>
                      <div>{preUrl}</div>
                    </div>

                    <a 
                      href={`https://console.firebase.google.com/project/${projectId}/authentication/settings`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 text-amber-400 font-medium inline-flex items-center space-x-1 hover:underline text-[11px]"
                    >
                      <span>ไปยังหน้าตั้งค่าโดเมน Firebase</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <p className="mt-1 text-[10px] text-slate-400 italic font-medium">👉 เลื่อนหน้าจอลงมาที่หัวข้อ "Authorized Domains" (โดเมนที่ได้รับอนุญาต) แล้วกด Add Domain เพิ่มทั้ง 2 รายการข้างบนลงไป</p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className={`p-3 rounded-lg border transition-all ${
                isOperationNotAllowed 
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' 
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
              }`}>
                <div className="flex items-start space-x-2">
                  <span className="font-mono text-xs bg-slate-800 text-slate-200 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h4 className="font-semibold flex items-center space-x-1.5 text-amber-400">
                      <span>เปิดทำงาน Google Provider</span>
                      {isOperationNotAllowed && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">ต้องเปิด</span>}
                    </h4>
                    <p className="mt-1 text-slate-300">
                      หาก Firebase ฟ้องว่าบล็อกการเข้าใช้ ให้เช็กว่าเปิดทำงาน Google Provider แล้วหรือยัง:
                    </p>
                    <a 
                      href={`https://console.firebase.google.com/project/${projectId}/authentication/providers`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 text-amber-400 font-medium inline-flex items-center space-x-1 hover:underline text-[11px]"
                    >
                      <span>ไปยังแถบ Sign-in method ใน Firebase</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <p className="mt-1 text-[10px] text-slate-400 italic">👉 กดปุ่ม "Add new provider" (เพิ่มผู้ให้บริการใหม่) → เลือก "Google" → กดเปิดใช้งาน(Enable) และกดบันทึก</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-950/30 rounded p-3 border border-slate-800 text-[10px] text-slate-400">
                <span className="font-semibold text-white">หมายเหตุการประเมิน: </span>
                หากต้องการประเมินระบบแบบออฟไลน์โดยไม่ต้องเชื่องต่อ Google จริง ท่านสามารถกรอกที่อยู่อีเมลจำลอง (เช่น <span className="text-amber-400">sopawan.n@pnu.ac.th</span>) ทางช่องด้านบน แล้วกดล็อกอินจำลองได้ทันที!
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
