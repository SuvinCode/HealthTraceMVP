import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { 
  Heart, Calendar, ClipboardList, Plus, Users, LayoutDashboard, 
  LogOut, Bell, Search, Menu, X, FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const patientLinks = [
  { to: '/health-form', icon: FileText, label: 'Health Form' },
  { to: '/diary', icon: Calendar, label: 'Diary' },
  { to: '/appointments', icon: ClipboardList, label: 'Appointments' },
  { to: '/create-appointment', icon: Plus, label: 'Book Appointment' },
];

const doctorLinks = [
  { to: '/doctor-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patient-logs', icon: Users, label: 'Patients' },
  { to: '/appointments', icon: ClipboardList, label: 'Appointments' },
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
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to={isDoctor ? '/doctor-dashboard' : '/health-form'} className="flex items-center gap-2.5">
            <img
              src="/favicon.svg"
              alt="HealthTrace logo"
              className="w-10 h-10 object-contain"
            />
            <span className="font-heading font-bold text-lg">
              <span style={{ color: '#CC2222' }}>Health</span><span style={{ color: '#1E2D4E' }}>Trace</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === link.to
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isDoctor && (
              <Link to="/connection-requests" className="relative">
                <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                {pendingRequests?.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                    {pendingRequests.length}
                  </span>
                )}
              </Link>
            )}
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium text-foreground">{user?.full_name}</span>
                <span className="text-xs text-muted-foreground capitalize">{user?.role || 'user'}</span>
              </div>
            </div>
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
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-sm">
          <nav className="p-4 space-y-1">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === link.to
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}