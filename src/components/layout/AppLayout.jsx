import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Calendar, ClipboardList, Plus, Users, LayoutDashboard,
  LogOut, Bell, Menu, X, FileText, UserPlus, Sun, BookOpen, NotebookPen,
  Settings, Smartphone, MessageSquare, Bug, Check, Copy, Loader2, Building2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient, API_BASE_URL } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import NotificationBell from './NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';

const patientLinks = [
  { to: '/health-form', icon: FileText, label: 'Health Form' },
  { to: '/myday', icon: Sun, label: 'My Day' },
  { to: '/diary', icon: BookOpen, label: 'Diary' },
  { to: '/hospitals', icon: Building2, label: 'Hospitals' },
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
          <Link to={isDoctor ? '/doctor-dashboard' : '/health-form'} className="flex items-center gap-3">
            <motion.img
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              src="/favicon.svg"
              alt="HealthTrace logo"
              className="w-12 h-12 object-contain"
            />
            <motion.span 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-heading font-bold text-xl tracking-tight"
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
              <SettingsMenu />
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

function SettingsMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('menu'); // menu, apple_health, review, bug
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Forms state
  const [name, setName] = useState(user?.full_name || '');
  const [content, setContent] = useState('');

  const baseUrl = API_BASE_URL.replace(/\/$/, "").trim();
  const webhookUrl = (baseUrl + "/webhook/apple-health?user_email=" + (user?.email?.toLowerCase() || "")).replace(/\s/g, "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitReport = async (subject) => {
    setLoading(true);
    try {
      await fetch('https://formsubmit.co/ajax/suvinbusiness@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, message: content, _subject: subject, email: user?.email })
      });
      toast.success('Submitted successfully!');
      setView('menu');
      setContent('');
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setView('menu'); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <div className="flex flex-col h-[500px]">
          <div className="p-6 border-b bg-card sm:flex items-center justify-between">
            <DialogTitle className="font-heading font-bold text-xl flex items-center gap-2">
              {view === 'menu' && <>Settings</>}
              {view === 'apple_health' && <><Smartphone className="w-5 h-5 text-primary" /> Apple Health Setup</>}
              {view === 'review' && <><MessageSquare className="w-5 h-5 text-primary" /> Leave a Review</>}
              {view === 'bug' && <><Bug className="w-5 h-5 text-red-500" /> Report a Bug</>}
            </DialogTitle>
            {view !== 'menu' && (
              <Button variant="ghost" size="sm" onClick={() => setView('menu')} className="text-xs">Back to menu</Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar">
            {view === 'menu' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MenuButton 
                  icon={Smartphone} 
                  label="Connect Apple Health" 
                  desc="Sync your metrics" 
                  onClick={() => setView('apple_health')} 
                />
                <MenuButton 
                  icon={MessageSquare} 
                  label="Leave a Review" 
                  desc="Share your feedback" 
                  onClick={() => setView('review')} 
                />
                <MenuButton 
                  icon={Bug} 
                  label="Report a Bug" 
                  desc="Help us improve" 
                  onClick={() => setView('bug')} 
                  color="text-red-500"
                />
                <MenuButton 
                  icon={LogOut} 
                  label="Log Out" 
                  desc="End your session" 
                  onClick={logout} 
                  color="text-muted-foreground"
                />
              </div>
            )}

            {view === 'apple_health' && (
              <div className="space-y-6 text-sm">
                {[
                  { s: 1, t: "Download", d: "Download Health Auto Export from the iOS App Store. Open it and tap Skip or Continue for Free if it asks you to subscribe." },
                  { s: 2, t: "Automation", d: "Tap the Automated tab on the left. Then tap New Automation and make sure the toggle at the top says Enabled." },
                  { s: 3, t: "Type", d: "Under Automation Type, select REST API." },
                  { s: 4, t: "URL", d: "Tap the URL field and paste your personal HealthTrace link below.", custom: (
                    <div className="mt-3 p-3 bg-muted rounded-xl border flex items-center gap-2">
                      <code className="flex-1 break-all text-[10px] font-mono leading-tight">{webhookUrl}</code>
                      <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 shrink-0">
                        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  )},
                  { s: 5, t: "Version", d: "Scroll down to Export Settings and set Export Version to v1." },
                  { s: 6, t: "Metrics", d: "Scroll down to Data Type Settings and tap Select Health Metrics. Choose Sleep, Steps, and Screen Time." },
                  { s: 7, t: "Save", d: "Scroll back up and tap Update in the top right corner to save everything." },
                  { s: 8, t: "Verify", d: "Scroll all the way down to Export Existing Data and tap Manual Export, and then tap Begin Export. You should see Response: 200!" },
                ].map(step => (
                  <div key={step.s} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">{step.s}</div>
                    <div className="flex-1">
                      <p className="font-bold mb-1">{step.t}</p>
                      <p className="text-muted-foreground leading-relaxed">{step.d}</p>
                      {step.custom}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(view === 'review' || view === 'bug') && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {view === 'review' ? 'Your Feedback' : 'Bug Description'}
                  </label>
                  <Textarea 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    placeholder={view === 'review' ? "How's your experience?" : "What went wrong?"}
                    rows={6}
                  />
                </div>
                <Button 
                  className="w-full h-12 rounded-xl bg-primary" 
                  disabled={loading}
                  onClick={() => handleSubmitReport(view === 'review' ? 'App Review' : 'Bug Report')}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Submit'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }`}</style>
    </Dialog>
  );
}

function MenuButton({ icon: Icon, label, desc, onClick, color = "text-primary" }) {
  return (
    <button 
      onClick={onClick}
      className="p-4 bg-card hover:bg-muted border rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
    >
      <div className={`w-10 h-10 rounded-xl bg-background border flex items-center justify-center mb-3 group-hover:bg-card transition-colors`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="font-bold text-sm mb-0.5">{label}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{desc}</p>
    </button>
  );
}