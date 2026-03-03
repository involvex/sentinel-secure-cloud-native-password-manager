import React, { ReactNode } from 'react';
import { Navigate } from "react-router-dom";
import { useAuthStore } from '@/lib/auth-store';
export function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const masterKey = useAuthStore(s => s.masterKey);
  // If we have a session but lost the key (refresh), redirect to login
  if (!isAuthenticated || !masterKey) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}