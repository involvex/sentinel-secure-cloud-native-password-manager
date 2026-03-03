import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@shared/types';
interface AuthState {
  user: (User & { salt: string }) | null;
  masterKey: CryptoKey | null;
  isAuthenticated: boolean;
  setAuth: (user: User & { salt: string }, key: CryptoKey) => void;
  clearAuth: () => void;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      masterKey: null,
      isAuthenticated: false,
      setAuth: (user, key) => set({ 
        user, 
        masterKey: key, 
        isAuthenticated: true 
      }),
      clearAuth: () => set({ 
        user: null, 
        masterKey: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'sentinel-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // CRITICAL: masterKey CryptoKey objects are not serializable and must NEVER be stored in localStorage.
      // We keep user info for the session but wipe the key from memory on refresh if not handled by higher-level recovery.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);