import {
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { type UserProfile } from '../types';

export class PresenceService {
  private heartbeatInterval: any = null;

  /**
   * Set user online status
   */
  public async setOnlineStatus(
    userId: string,
    isOnline: boolean,
    inCall: boolean = false,
    activeCallId: string | null = null
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isOnline,
        inCall,
        activeCallId,
        lastSeen: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[PresenceService] Error updating online status:', err);
    }
  }

  /**
   * Initialize heartbeat while the user is actively using the app
   */
  public startHeartbeat(userId: string): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          isOnline: true,
          lastSeen: serverTimestamp(),
        });
      } catch (err) {
        // Silently fail or ignore if network blipped
      }
    }, 45000);
  }

  /**
   * Stop heartbeat
   */
  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Listen to the partner's user profile by email
   */
  public listenToPartnerByEmail(
    partnerEmail: string,
    onPartnerUpdate: (profile: UserProfile | null) => void
  ): Unsubscribe {
    const normalized = partnerEmail.trim().toLowerCase();
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('email', '==', normalized));

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          onPartnerUpdate({
            uid: docSnap.id,
            email: data.email,
            displayName: data.displayName || 'Authorized Partner',
            photoURL: data.photoURL,
            isOnline: Boolean(data.isOnline),
            lastSeen: data.lastSeen,
            inCall: Boolean(data.inCall),
            activeCallId: data.activeCallId || null,
          });
        } else {
          onPartnerUpdate(null);
        }
      },
      (error) => {
        console.warn('[PresenceService] Partner snapshot error:', error);
      }
    );
  }

  /**
   * Find a user profile by email once
   */
  public async getProfileByEmail(email: string): Promise<UserProfile | null> {
    const normalized = email.trim().toLowerCase();
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('email', '==', normalized));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      return {
        uid: docSnap.id,
        email: data.email,
        displayName: data.displayName || 'Authorized Partner',
        photoURL: data.photoURL,
        isOnline: Boolean(data.isOnline),
        lastSeen: data.lastSeen,
        inCall: Boolean(data.inCall),
        activeCallId: data.activeCallId || null,
      };
    }
    return null;
  }
}

export const presenceService = new PresenceService();
