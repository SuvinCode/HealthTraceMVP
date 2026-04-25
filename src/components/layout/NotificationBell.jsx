import { useState, useMemo } from 'react';
import { Bell, Clock, FileText, Calendar, Check } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { 
  format, isTomorrow, parseISO, isWithinInterval, addMinutes, subMinutes, 
  isPast, startOfDay, addDays 
} from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);


  // 1. Fetch Medications for 30-min alerts
  const { data: medications } = useQuery({
    queryKey: ['med-notifications', user?.email],
    queryFn: () => apiClient.entities.MedicationTask.filter({ patient_email: user?.email }),
    enabled: !!user && user.role === 'user',
    initialData: [],
  });

  // 2. Fetch Appointments for 1-day alerts
  const { data: appointments } = useQuery({
    queryKey: ['appt-notifications', user?.email],
    queryFn: () => apiClient.entities.Appointment.filter({ 
      patient_email: user?.email,
      status: 'upcoming'
    }),
    enabled: !!user && user.role === 'user',
    initialData: [],
  });

  // 3. Fetch Forms for "New Question" alerts
  const { data: connections } = useQuery({
    queryKey: ['conn-notifications', user?.email],
    queryFn: () => apiClient.entities.ConnectionRequest.filter({ patient_email: user?.email, status: 'accepted' }),
    enabled: !!user && user.role === 'user',
    initialData: [],
  });

  const docEmails = connections.map(c => c.doctor_email);
  const { data: forms } = useQuery({
    queryKey: ['form-notifications', docEmails],
    queryFn: async () => {
      if (docEmails.length === 0) return [];
      const all = [];
      for(const e of docEmails) {
        const res = await apiClient.entities.HealthForm.filter({ doctor_email: e, active: true });
        all.push(...res);
      }
      return all;
    },
    enabled: docEmails.length > 0,
    initialData: [],
  });

  const { data: subs } = useQuery({
    queryKey: ['sub-notifications', user?.email],
    queryFn: () => apiClient.entities.HealthFormSubmission.filter({ patient_email: user?.email }),
    enabled: !!user && user.role === 'user',
    initialData: [],
  });

  const notifications = useMemo(() => {
    if (!user || user.role !== 'user') return [];
    const list = [];
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    // Medication alerts (30 mins before)
    medications.forEach(m => {
      const isActiveToday = isWithinInterval(now, { start: parseISO(m.start_date), end: parseISO(m.end_date) });
      if (!isActiveToday) return;

      const times = m.scheduled_times || (m.frequency === 'twice_daily' ? ['09:00', '21:00'] : ['09:00']);
      times.forEach(tStr => {
        const [h, min] = tStr.split(':').map(Number);
        const taskTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, min);
        
        // If task is within 30 mins from now and NOT past
        const diff = (taskTime.getTime() - now.getTime()) / (1000 * 60);
        if (diff > 0 && diff <= 30) {
          list.push({
            id: `med-${m.id}-${tStr}`,
            type: 'task',
            title: 'Medication Due Soon',
            message: `It's almost time for your ${m.medication_name} (${tStr}).`,
            icon: Clock,
            color: 'text-blue-500 bg-blue-50'
          });
        }
      });
    });

    // Appointment alerts (1 day before)
    appointments.forEach(a => {
      const aptDate = parseISO(a.date);
      if (isTomorrow(aptDate)) {
        list.push({
          id: `appt-${a.id}`,
          type: 'appointment',
          title: 'Appointment Tomorrow',
          message: `Reminder: You have "${a.title}" with Dr. ${a.doctor_name} tomorrow at ${a.time_slot}.`,
          icon: Calendar,
          color: 'text-emerald-500 bg-emerald-50'
        });
      }
    });

    // New Form alerts
    const subIds = subs.map(s => s.form_id);
    forms.forEach(f => {
      if (!subIds.includes(f.id)) {
        list.push({
          id: `form-${f.id}`,
          type: 'form',
          title: 'New Health Form',
          message: `Your doctor has posted new questions: "${f.title}". Please fill it out when possible.`,
          icon: FileText,
          color: 'text-amber-500 bg-amber-50'
        });
      }
    });

    return list;
  }, [user, medications, appointments, forms, subs]);

  const showDot = notifications.length > 0 && !hasOpened;

  const handleOpenChange = (v) => {
    setOpen(v);
    if (v) setHasOpened(true);
  };


  if (user?.role !== 'user') return null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          {showDot && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive border-2 border-background rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">{notifications.length}</Badge>
            )}
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (

            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-3">
                <Check className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div key={n.id} className="p-4 flex gap-3 hover:bg-muted/30 transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${n.color} flex items-center justify-center shrink-0`}>
                    <n.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-foreground leading-none mb-1 uppercase tracking-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground leading-normal">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
