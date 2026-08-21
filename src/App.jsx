import React, { lazy, Suspense, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Game from './pages/Game';
import VirtualKeyboard from './components/game/VirtualKeyboard';
import ProtectedRoute from './components/ProtectedRoute';

const Submit = lazy(() => import('./pages/Submit'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CompetitionManager = lazy(() => import('./pages/admin/CompetitionManager'));
const TourManager = lazy(() => import('./pages/admin/TourManager'));
const PrizeManager = lazy(() => import('./pages/admin/PrizeManager'));
const LeaderboardManager = lazy(() => import('./pages/admin/LeaderboardManager'));
const LeadManager = lazy(() => import('./pages/admin/LeadManager'));
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'));
const EmailPreview = lazy(() => import('./pages/admin/EmailPreview'));

const AppLoading = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#121212]">
    <div className="w-8 h-8 border-4 border-[#2a2a2a] border-t-[#AF231C] rounded-full animate-spin" />
  </div>
);

const AdminAccessRequired = ({ authenticated = false }) => {
  const { navigateToLogin } = useAuth();
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#121212] px-5 text-center">
      <div className="max-w-sm">
        <h1 className="text-white text-2xl font-black mb-2">Admin access required</h1>
        <p className="text-[#888] text-sm mb-6">
          {authenticated
            ? 'Your account does not have permission to view VenueGuessr lead or competition data.'
            : 'Sign in with an approved VenueGuessr admin account to continue.'}
        </p>
        {authenticated ? (
          <a href="/" className="inline-flex bg-[#AF231C] text-white font-bold px-5 py-3 rounded-xl">Back to the game</a>
        ) : (
          <button onClick={navigateToLogin} className="bg-[#AF231C] text-white font-bold px-5 py-3 rounded-xl">Sign in</button>
        )}
      </div>
    </div>
  );
};

const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    authChecked,
    checkAppState,
    navigateToLogin,
  } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdminRoute && !authChecked) {
      checkAppState();
    }
  }, [authChecked, isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute && authError?.type === 'auth_required') {
      navigateToLogin();
    }
  }, [authError?.type, isAdminRoute, navigateToLogin]);

  if (isAdminRoute && (!authChecked || isLoadingPublicSettings || isLoadingAuth)) {
    return (
      <AppLoading />
    );
  }

  if (isAdminRoute && authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <AppLoading />;
    }
  }

  return (
    <Suspense fallback={<AppLoading />}>
      <Routes>
        <Route path="/submit" element={<Submit />} />
        <Route path="/" element={<Game />} />
        <Route
          element={(
            <ProtectedRoute
              requiredRole="admin"
              unauthenticatedElement={<AdminAccessRequired />}
              unauthorizedElement={<AdminAccessRequired authenticated />}
            />
          )}
        >
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="competitions" element={<CompetitionManager />} />
            <Route path="venues" element={<TourManager />} />
            <Route path="prizes" element={<PrizeManager />} />
            <Route path="leaderboard" element={<LeaderboardManager />} />
            <Route path="leads" element={<LeadManager />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="email-preview" element={<EmailPreview />} />
          </Route>
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <VirtualKeyboard />
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
