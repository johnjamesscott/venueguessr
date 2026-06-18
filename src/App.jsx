import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Game from './pages/Game';
import VirtualKeyboard from './components/game/VirtualKeyboard';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import CompetitionManager from './pages/admin/CompetitionManager';
import TourManager from './pages/admin/TourManager';
import PrizeManager from './pages/admin/PrizeManager';
import LeaderboardManager from './pages/admin/LeaderboardManager';
import LeadManager from './pages/admin/LeadManager';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import EmailPreview from './pages/admin/EmailPreview';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#121212]">
        <div className="w-8 h-8 border-4 border-[#2a2a2a] border-t-[#AF231C] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Game />} />
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
        <VirtualKeyboard />
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App