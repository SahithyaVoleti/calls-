import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { presenceService } from '../services/presenceService';
import { type UserProfile } from '../types';

interface PresenceContextType {
  partnerProfile: UserProfile | null;
  loadingPartner: boolean;
  isPartnerOnline: boolean;
  isPartnerInCall: boolean;
  partnerDisplayName: string;
  partnerAvatarUrl?: string;
  lastSeenText: string;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { partnerEmail, isAuthorized } = useAuth();
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);
  const [loadingPartner, setLoadingPartner] = useState(true);

  useEffect(() => {
    if (!partnerEmail || !isAuthorized) {
      setPartnerProfile(null);
      setLoadingPartner(false);
      return;
    }

    setLoadingPartner(true);
    const unsubscribe = presenceService.listenToPartnerByEmail(partnerEmail, (profile) => {
      setPartnerProfile(profile);
      setLoadingPartner(false);
    });

    return () => {
      unsubscribe();
    };
  }, [partnerEmail, isAuthorized]);

  const isPartnerOnline = Boolean(partnerProfile?.isOnline);
  const isPartnerInCall = Boolean(partnerProfile?.inCall);
  const partnerDisplayName = partnerProfile?.displayName || partnerEmail || 'Authorized Partner';
  const partnerAvatarUrl = partnerProfile?.photoURL;

  // Format last seen human readable
  let lastSeenText = 'Offline';
  if (isPartnerOnline) {
    lastSeenText = isPartnerInCall ? 'In another call' : 'Available now';
  } else if (partnerProfile?.lastSeen?.toMillis) {
    const diffSec = Math.floor((Date.now() - partnerProfile.lastSeen.toMillis()) / 1000);
    if (diffSec < 60) {
      lastSeenText = 'Active just now';
    } else if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      lastSeenText = `Last seen ${mins}m ago`;
    } else if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      lastSeenText = `Last seen ${hours}h ago`;
    } else {
      lastSeenText = 'Last seen recently';
    }
  }

  return (
    <PresenceContext.Provider
      value={{
        partnerProfile,
        loadingPartner,
        isPartnerOnline,
        isPartnerInCall,
        partnerDisplayName,
        partnerAvatarUrl,
        lastSeenText,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = (): PresenceContextType => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};
