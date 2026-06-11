import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Game from './pages/Game';
import VirtualKeyboard from './components/game/VirtualKeyboard';
import AdminDashboard from './pages/admin/Dashboard';
import Competitions from './pages/admin/Competitions';
import Tours from './pages/admin/Tours';
import Prizes from './pages/admin/Prizes';
import AdminLeaderboard from './pages/admin/Leaderboard';
import Leads from './pages/admin/Leads';
import Analytics from './pages/admin/Analytics';

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
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/competitions" element={<Competitions />} />
      <Route path="/admin/tours" element={<Tours />} />
      <Route path="/admin/prizes" element={<Prizes />} />
      <Route path="/admin/leaderboard" element={<AdminLeaderboard />} />
      <Route path="/admin/leads" element={<Leads />} />
      <Route path="/admin/analytics" element={<Analytics />} />
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