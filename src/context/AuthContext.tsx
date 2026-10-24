import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isLiveFirebase } from '../services/firebase';
import { authService } from '../services/authService';
import { presenceService } from '../services/presenceService';
import { mockBackend } from '../services/mockBackend';
import { getPartnerEmail, isEmailConfiguredAllowed } from '../utils/allowlist';
import { type UserProfile } from '../types';

interface AuthContextType {
  currentUser: any;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthorized: boolean;
  partnerEmail: string | null;
  isDemoMode: boolean;
  login: (email: string, pass: string) => Promise<User>;
  signUp: (params: { email: string; pass: string; displayName: string; photoURL?: string }) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  updateProfile: (params: { displayName: string; photoURL?: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const fetchProfile = async (user: any) => {
    try {
      const profile = await authService.getUserProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
      } else {
        setUserProfile({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Authorized Member',
          photoURL: user.photoURL || undefined,
          isOnline: true,
        });
      }
    } catch (e) {
      console.warn('[AuthContext] Failed to fetch profile:', e);
    }
  };

  useEffect(() => {
    let unsubscribe: () => void;

    if (!isLiveFirebase || !auth) {
      // Local Demo Mode: listen to mockBackend session updates
      unsubscribe = mockBackend.onAuthStateChanged(async (user) => {
        setLoading(true);
        if (user && user.email) {
          const allowed = isEmailConfiguredAllowed(user.email);
          setIsAuthorized(allowed);
          setCurrentUser(user);
          if (allowed) {
            setUserProfile({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'Authorized Member',
              photoURL: user.photoURL,
              isOnline: true,
            });
            presenceService.setOnlineStatus(user.uid, true);
          } else {
            setUserProfile(null);
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
          setIsAuthorized(false);
        }
        setLoading(false);
      });
    } else {
      // Live Firebase Mode
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setLoading(true);
        if (user && user.email) {
          const allowed = isEmailConfiguredAllowed(user.email);
          setIsAuthorized(allowed);
          setCurrentUser(user);

          if (allowed) {
            await fetchProfile(user);
            presenceService.setOnlineStatus(user.uid, true);
            presenceService.startHeartbeat(user.uid);
          } else {
            setUserProfile(null);
          }
        } else {
          if (currentUser) {
            presenceService.stopHeartbeat();
          }
          setCurrentUser(null);
          setUserProfile(null);
          setIsAuthorized(false);
        }
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
      presenceService.stopHeartbeat();
    };
  }, []);

  // Update offline presence on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentUser?.uid) {
        presenceService.setOnlineStatus(currentUser.uid, false);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  const partnerEmail = currentUser?.email ? getPartnerEmail(currentUser.email) : null;

  const login = async (email: string, pass: string): Promise<User> => {
    return authService.login(email, pass);
  };

  const signUp = async (params: {
    email: string;
    pass: string;
    displayName: string;
    photoURL?: string;
  }): Promise<User> => {
    return authService.signUp({
      email: params.email,
      password: params.pass,
      displayName: params.displayName,
      photoURL: params.photoURL,
    });
  };

  const logout = async (): Promise<void> => {
    if (currentUser?.uid) {
      presenceService.stopHeartbeat();
      await presenceService.setOnlineStatus(currentUser.uid, false);
    }
    await authService.logout();
    setCurrentUser(null);
    setUserProfile(null);
    setIsAuthorized(false);
  };

  const resetPassword = async (email: string): Promise<void> => {
    return authService.resetPassword(email);
  };

  const resendVerification = async (): Promise<void> => {
    return authService.resendVerification();
  };

  const updateProfile = async (params: { displayName: string; photoURL?: string }): Promise<void> => {
    await authService.updateUserProfile(params);
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAuthorized,
        partnerEmail,
        isDemoMode: !isLiveFirebase,
        login,
        signUp,
        logout,
        resetPassword,
        resendVerification,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
