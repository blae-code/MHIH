/**
 * Red River OS — Application Entry Point
 *
 * Routes are built from the centralised PAGE_ROUTE_MAP so that all URLs
 * follow the /os/... convention rather than flat /{PageName} paths.
 *
 * Legacy /{PageName} paths are kept as redirects for backward compatibility.
 */

import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { PAGE_ROUTE_MAP, resolvePageName } from '@/platform/routes';
import RouteErrorBoundary from '@/components/shell/RouteErrorBoundary';

const { Pages, Layout } = pagesConfig;

const LayoutWrapper = ({ children, currentPageName }) => Layout
  ? <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Wraps a page in a route-scoped error boundary so a single page crash
// never blanks the OS shell. The boundary resets on route change.
const SafePage = ({ Page, pageName }) => (
  <RouteErrorBoundary pageKey={pageName} pageName={pageName}>
    <Page />
  </RouteErrorBoundary>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  useEffect(() => {
    if (authError?.type === 'auth_required') {
      navigateToLogin();
    }
  }, [authError?.type]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0a1220" }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#1a2e48", borderTopColor: "#FEDD00" }} />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return null;
    }
  }

  return (
    <Routes>
      {/* Root redirect → OS home */}
      <Route path="/" element={<Navigate to="/os" replace />} />

      {/* Primary OS routes — built from the centralised route map */}
      {Object.entries(PAGE_ROUTE_MAP).map(([pageName, routePath]) => {
        const Page = Pages[pageName];
        if (!Page) return null;
        return (
          <Route
            key={routePath}
            path={routePath}
            element={
              <LayoutWrapper currentPageName={pageName}>
                <SafePage Page={Page} pageName={pageName} />
              </LayoutWrapper>
            }
          />
        );
      })}

      {/* Legacy backward-compat redirects: /{PageName} → new route */}
      {Object.entries(PAGE_ROUTE_MAP).map(([pageName, routePath]) => (
        <Route
          key={`legacy-${pageName}`}
          path={`/${pageName}`}
          element={<Navigate to={routePath} replace />}
        />
      ))}

      {/* Any pages in pages.config.js not yet in the route map */}
      {Object.entries(Pages)
        .filter(([name]) => !PAGE_ROUTE_MAP[name])
        .map(([pageName, Page]) => (
          <Route
            key={`unmapped-${pageName}`}
            path={`/${pageName}`}
            element={
              <LayoutWrapper currentPageName={pageName}>
                <SafePage Page={Page} pageName={pageName} />
              </LayoutWrapper>
            }
          />
        ))}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;