import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Calendar, ClipboardList, Plus, Users, LayoutDashboard,
  LogOut, Bell, Menu, X, FileText, UserPlus, Sun, BookOpen, NotebookPen
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import NotificationBell from './NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';

const patientLinks = [
  { to: '/health-form', icon: FileText, label: 'Health Form' },
  { to: '/myday', icon: Sun, label: 'My Day' },
  { to: '/diary', icon: BookOpen, label: 'Diary' },
  { to: '/appointments', icon: ClipboardList, label: 'Appointments' },
  { to: '/create-appointment', icon: Plus, label: 'Book Appointment' },
];

const doctorLinks = [
  { to: '/doctor-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/connection-requests', icon: UserPlus, label: 'Connect' },
  { to: '/patient-logs', icon: Users, label: 'Patients' },
  { to: '/appointments', icon: ClipboardList, label: 'Appointments' },
  { to: '/notes', icon: NotebookPen, label: 'Notes' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDoctor = user?.role === 'doctor';
  const links = isDoctor ? doctorLinks : patientLinks;

  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests', user?.email],
    queryFn: () => apiClient.entities.ConnectionRequest.filter({ 
      doctor_email: user?.email, 
      status: 'pending' 
    }),
    enabled: isDoctor,
    initialData: [],
  });

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Top Bar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to={isDoctor ? '/doctor-dashboard' : '/health-form'} className="flex items-center gap-2.5">
            <motion.img
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              src="/favicon.svg"
              alt="HealthTrace logo"
              className="w-10 h-10 object-contain"
            />
            <motion.span 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-heading font-bold text-lg"
            >
              <span style={{ color: '#CC2222' }}>Health</span><span style={{ color: '#1E2D4E' }}>Trace</span>
            </motion.span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {links.map((link, i) => (
              <motion.div
                key={link.to}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Link
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                    location.pathname === link.to
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                  {location.pathname === link.to && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden md:flex items-center gap-2 pl-3 border-l border-border"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium text-foreground">{user?.full_name}</span>
                <span className="text-xs text-muted-foreground capitalize">{user?.role || 'user'}</span>
              </div>
            </motion.div>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => logout()}
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mobileOpen ? 'close' : 'menu'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </motion.div>
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="md:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-sm"
          >
            <nav className="p-4 space-y-2">
              {links.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={link.to}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium transition-all ${
                      location.pathname === link.to
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <link.icon className="w-6 h-6" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 overflow-hidden">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}