import { findSafeUserById, getPublicTeamDirectory, verifyAccountCredentials } from '../data/team';
import type { SafeUser } from '../types/crm';
import { loadStoredSessionUserId, saveStoredSessionUserId } from './storageService';

export function loginWithCredentials(
  email: string,
  password: string
): { user: SafeUser | null; error: string | null } {
  const user = verifyAccountCredentials(email, password);
  if (!user) {
    return {
      user: null,
      error: 'Invalid email or password. Please verify your credentials and try again.',
    };
  }
  saveStoredSessionUserId(user.id);
  return { user, error: null };
}

export function quickDemoLogin(userId: string): SafeUser | null {
  const user = findSafeUserById(userId);
  if (!user) {
    return null;
  }
  saveStoredSessionUserId(user.id);
  return user;
}

export function restoreSession(): SafeUser | null {
  const storedId = loadStoredSessionUserId();
  if (!storedId) {
    return null;
  }
  const user = findSafeUserById(storedId);
  if (!user) {
    saveStoredSessionUserId(null);
    return null;
  }
  return user;
}

export function logoutSession(): void {
  saveStoredSessionUserId(null);
}

export function getDemoLoginAccounts(): SafeUser[] {
  return getPublicTeamDirectory();
}
