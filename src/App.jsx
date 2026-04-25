import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-Client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout';
import Onboarding from './pages/Onboarding';
import Landing from './pages/Landing';

import HealthForm from './pages/HealthForm';
import MyDay from './pages/Myday';
import Diary from './pages/Diary';
import Appointments from './pages/Appointments';
import CreateAppointment from './pages/CreateAppointment';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientLogs from './pages/PatientLogs';
import PatientProfile from './pages/PatientProfile';
import ConnectionRequests from './pages/ConnectionRequests';
import Login from './pages/Login';
import Signup from './pages/Signup';

import { motion, AnimatePresence } from 'framer-motion';

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/';

  // Show loading spinner while checking auth, but skip it if we're already on an auth page
  // or if there's no session at all (to show login/signup immediately)
  const hasToken = !!localStorage.getItem('auth_token');
  if (isLoadingPublicSettings || (isLoadingAuth && hasToken && !isAuthPage)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"
        ></motion.div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError && !isAuthPage) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <Navigate to="/login" replace />;
    }
  }

  // If not authenticated and no specific error, redirect to login
  if (!user && !isLoadingAuth && !isAuthPage) {
    return <Navigate to="/login" replace />;
  }

  // Check if user needs onboarding
  const needsOnboarding = user && !user.onboarding_complete;
  const isDoctor = user?.role === 'doctor';

  if (needsOnboarding) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="*" element={<Onboarding />} />
        </Routes>
      </AnimatePresence>
    );
  }

  // Render the main app
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route path="/" element={user ? <Navigate to={isDoctor ? '/doctor-dashboard' : '/health-form'} replace /> : <Landing />} />

        <Route element={<AppLayout />}>
          <Route path="/health-form" element={<HealthForm />} />
          <Route path="/myday" element={<MyDay />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/create-appointment" element={<CreateAppointment />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/patient-logs" element={<PatientLogs />} />
          <Route path="/patient/:patientEmail" element={<PatientProfile />} />
          <Route path="/connection-requests" element={<ConnectionRequests />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
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
  )
}

export default App