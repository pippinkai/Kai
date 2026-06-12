/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { dataService } from '../lib/dataService';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isLocalMode: boolean;
  unauthorizedDomainError: string | null;
  setUnauthorizedDomainError: (error: string | null) => void;
  fbAuthError: string | null;
  setFbAuthError: (error: string | null) => void;
  loginWithGoogle: () => Promise<void>;
  simulateLocalLogin: (email: string, role: UserRole) => void;
  logout: () => Promise<void>;
  updateUserContext: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(!isFirebaseConfigured);
  const [unauthorizedDomainError, setUnauthorizedDomainError] = useState<string | null>(null);
  const [fbAuthError, setFbAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        try {
          if (firebaseUser) {
            const email = firebaseUser.email || '';
            if (!email.toLowerCase().endsWith('@pnu.ac.th')) {
              console.error('Email domain not authorized:', email);
              setUnauthorizedDomainError(email);
              setUser(null);
              localStorage.removeItem('fla_session_user');
              try {
                await signOut(auth);
              } catch (err) {
                console.error('Sign out error:', err);
              }
              setLoading(false);
              return;
            }

            // Reset error on happy path
            setUnauthorizedDomainError(null);

            // Fetch additional profile from custom users collection in DB with safety timeout
            const nowStr = new Date().toISOString();
            let profile: UserProfile | null = null;
            let dbIsOffline = false;

            try {
              const fetchPromise = dataService.getUserProfile(firebaseUser.uid);
              const timeoutPromise = new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error('timeout')), 2300)
              );
              profile = await Promise.race([fetchPromise, timeoutPromise]);
            } catch (fsErr) {
              console.warn('[AuthContext] Profile fetch online time out or failed. Falling back to local profile:', fsErr);
              dbIsOffline = true;
              dataService.setOfflineMode(true);
              setIsLocalMode(true);
            }

            if (dbIsOffline) {
              // Look up locally (either standard pre-seed or previously registered profile)
              const localProfilesRaw = localStorage.getItem('fla_attendance_profiles');
              let loadedProfiles: UserProfile[] = [];
              if (localProfilesRaw) {
                try { loadedProfiles = JSON.parse(localProfilesRaw); } catch {}
              }
              const existingLocalProfile = loadedProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
              
              const isBootstrappedHR = email.toLowerCase() === 'sopawan.n@pnu.ac.th';
              profile = existingLocalProfile || {
                uid: firebaseUser.uid,
                email: email,
                name: firebaseUser.displayName || 'Faculty Member',
                displayName: firebaseUser.displayName || 'Faculty Member',
                role: isBootstrappedHR ? 'HR_ADMIN' : 'STAFF',
                department: isBootstrappedHR ? 'Office of the Dean' : 'English & Linguistics',
                position: isBootstrappedHR ? 'HR Director' : 'Lecturer',
                photoURL: firebaseUser.photoURL || undefined,
                createdAt: nowStr,
                lastLogin: nowStr
              };
            }
            
            if (!profile) {
              // First time Google Login - create standard staff profile (or HR if specifically configured)
              const isBootstrappedHR = email.toLowerCase() === 'sopawan.n@pnu.ac.th';
              profile = {
                uid: firebaseUser.uid,
                email: email,
                name: firebaseUser.displayName || 'Faculty Member',
                displayName: firebaseUser.displayName || 'Faculty Member',
                role: isBootstrappedHR ? 'HR_ADMIN' : 'STAFF',
                department: isBootstrappedHR ? 'Office of the Dean' : 'English & Linguistics', // Default department
                position: isBootstrappedHR ? 'HR Director' : 'Lecturer',
                photoURL: firebaseUser.photoURL || undefined,
                createdAt: nowStr,
                lastLogin: nowStr
              };
              
              if (!dbIsOffline) {
                try {
                  const savePromise = dataService.saveUserProfile(profile);
                  const timeoutPromise = new Promise<void>((_, reject) => 
                    setTimeout(() => reject(new Error('timeout')), 2300)
                  );
                  await Promise.race([savePromise, timeoutPromise]);
                } catch (fsErr) {
                  console.warn('Failed to save profile online. Switched to offline mode.', fsErr);
                  dataService.setOfflineMode(true);
                  setIsLocalMode(true);
                }
              }
            } else {
              // Update lastLogin
              profile.lastLogin = nowStr;
              profile.displayName = firebaseUser.displayName || profile.displayName || profile.name;
              
              if (!dbIsOffline) {
                try {
                  const savePromise = dataService.saveUserProfile(profile);
                  const timeoutPromise = new Promise<void>((_, reject) => 
                    setTimeout(() => reject(new Error('timeout')), 2300)
                  );
                  await Promise.race([savePromise, timeoutPromise]);
                } catch (fsErr) {
                  console.warn('Failed to update profile online. Switched to offline mode.', fsErr);
                  dataService.setOfflineMode(true);
                  setIsLocalMode(true);
                }
              }
            }

            // Sync with local backup copy
            const localProfilesRaw = localStorage.getItem('fla_attendance_profiles');
            let loadedProfiles: UserProfile[] = [];
            if (localProfilesRaw) {
              try { loadedProfiles = JSON.parse(localProfilesRaw); } catch {}
            }
            loadedProfiles = loadedProfiles.filter(p => p.email.toLowerCase() !== email.toLowerCase());
            loadedProfiles.push(profile);
            localStorage.setItem('fla_attendance_profiles', JSON.stringify(loadedProfiles));
            localStorage.setItem('fla_session_user', JSON.stringify(profile));

            setUser(profile);
            if (!dbIsOffline) {
              setIsLocalMode(false);
            }
          } else {
            // Not logged in to Firebase - check local storage session backup for testing convenience
            const localUser = localStorage.getItem('fla_session_user');
            if (localUser) {
              const parsed = JSON.parse(localUser);
              if (parsed && parsed.email && !parsed.email.toLowerCase().endsWith('@pnu.ac.th')) {
                setUser(null);
                localStorage.removeItem('fla_session_user');
              } else {
                setUser(parsed);
              }
            } else {
              setUser(null);
            }
          }
        } catch (err: any) {
          console.error('Error during auth state change processing:', err);
          
          // Parse the error string if it is a FirestoreErrorInfo JSON to make it friendly
          let errorMsg = err?.message || String(err);
          try {
            if (errorMsg.includes('{"error":') || errorMsg.trim().startsWith('{')) {
              const parsedErr = JSON.parse(errorMsg);
              errorMsg = parsedErr.error || errorMsg;
            }
          } catch {}
          
          setFbAuthError(errorMsg);
          setUser(null);
        } finally {
          setLoading(false);
        }
      });
      return unsubscribe;
    } else {
      // Offline/Local Mode
      const localUser = localStorage.getItem('fla_session_user');
      if (localUser) {
        const parsed = JSON.parse(localUser);
        if (parsed && parsed.email && !parsed.email.toLowerCase().endsWith('@pnu.ac.th')) {
          setUser(null);
          localStorage.removeItem('fla_session_user');
        } else {
          setUser(parsed);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async () => {
    setUnauthorizedDomainError(null);
    setFbAuthError(null);
    if (isFirebaseConfigured && auth && googleProvider) {
      setLoading(true);
      try {
        googleProvider.setCustomParameters({ hd: 'pnu.ac.th' });
        const result = await signInWithPopup(auth, googleProvider);
        const email = result.user.email || '';
        if (!email.toLowerCase().endsWith('@pnu.ac.th')) {
          setUnauthorizedDomainError(email);
          setUser(null);
          localStorage.removeItem('fla_session_user');
          await signOut(auth);
          return;
        }
      } catch (error: any) {
        console.error('Google Sign In failed:', error);
        setFbAuthError(error?.code || error?.message || String(error));
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      // Local Mode Login Trigger (Default to HR first, can be switched later in UI)
      simulateLocalLogin('sopawan.n@pnu.ac.th', 'HR_ADMIN');
    }
  };

  const simulateLocalLogin = (email: string, role: UserRole) => {
    setLoading(true);
    setUnauthorizedDomainError(null);

    // Enforce domain check in simulated mode too
    if (!email.toLowerCase().endsWith('@pnu.ac.th')) {
      console.error('Local Simulation failed: Gmail domain mismatch:', email);
      setUnauthorizedDomainError(email);
      setUser(null);
      localStorage.removeItem('fla_session_user');
      setLoading(false);
      return;
    }

    // Find matching pre-seeded profile, or create new one
    const profiles = localStorage.getItem('fla_attendance_profiles');
    let loadedProfiles: UserProfile[] = [];
    if (profiles) {
      try {
        loadedProfiles = JSON.parse(profiles);
      } catch {}
    }

    // Map role format for compliance
    let mappedRole: UserRole = role;
    if (role === 'hr' || role === 'admin') mappedRole = 'HR_ADMIN';
    if (role === 'staff') mappedRole = 'STAFF';

    let profile = loadedProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());

    const nowStr = new Date().toISOString();

    if (!profile) {
      profile = {
        uid: 'user-' + Math.random().toString(36).substring(2, 9),
        email,
        name: email.split('@')[0].toUpperCase(),
        displayName: email.split('@')[0].toUpperCase(),
        role: mappedRole,
        department: 'Office of the Dean',
        position: mappedRole === 'HR_ADMIN' ? 'HR Specialist' : 'Lecturer',
        createdAt: nowStr,
        lastLogin: nowStr
      };
      loadedProfiles.push(profile);
      localStorage.setItem('fla_attendance_profiles', JSON.stringify(loadedProfiles));
    } else {
      // Sync role if updated in login form
      profile.role = mappedRole;
      profile.lastLogin = nowStr;
      profile.displayName = profile.displayName || profile.name;
    }

    setUser(profile);
    setIsLocalMode(true);
    localStorage.setItem('fla_session_user', JSON.stringify(profile));
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    setUnauthorizedDomainError(null);
    if (isFirebaseConfigured && auth && !isLocalMode) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setUser(null);
    localStorage.removeItem('fla_session_user');
    setLoading(false);
  };

  const updateUserContext = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    
    // Save to persistence
    await dataService.saveUserProfile(updated);
    
    // Update local session
    localStorage.setItem('fla_session_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isLocalMode, 
      unauthorizedDomainError,
      setUnauthorizedDomainError,
      fbAuthError,
      setFbAuthError,
      loginWithGoogle, 
      simulateLocalLogin, 
      logout,
      updateUserContext
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
