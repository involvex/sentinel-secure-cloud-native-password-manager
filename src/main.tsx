import '@/lib/errorReporter';
import { enableMapSet } from "immer";
import React, { StrictMode } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { Dashboard } from '@/pages/Dashboard'
import { LoginPage } from '@/pages/LoginPage'
import { AuthGuard } from '@/components/AuthGuard'
enableMapSet();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/dashboard",
    element: (
      <AuthGuard>
        <Dashboard />
      </AuthGuard>
    ),
    errorElement: <RouteErrorBoundary />,
  }
]);
// Singleton Root Management to prevent runtime createRoot errors
const container = document.getElementById('root');
if (!container) throw new Error("Root container not found");
let root: Root;
// @ts-ignore - attaching to window for singleton access during Fast Refresh
if (window.__REACT_ROOT__) {
  root = window.__REACT_ROOT__;
} else {
  root = createRoot(container);
  // @ts-ignore
  window.__REACT_ROOT__ = root;
}
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)