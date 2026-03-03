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
      setAuth: (user, key) => set({ user, masterKey: key, isAuthenticated: true }),
      clearAuth: () => set({ user: null, masterKey: null, isAuthenticated: false }),
    }),
    {
      name: 'sentinel-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // CRITICAL: Never persist the masterKey CryptoKey object to localStorage.
      // It must stay in memory only for zero-knowledge security.
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);