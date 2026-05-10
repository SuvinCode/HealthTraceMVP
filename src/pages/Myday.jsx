// Originally "Diary.jsx" — renamed to MyDay.jsx
// This is the daily schedule/timeline view (medications, appointments).
// The "Diary" name now belongs to the mood & journal feature.

import { useState, useMemo } from 'react';
import { apiClient, cleanEmail } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Pill, Clock, FileText, Pencil, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  format, isSameDay, isWithinInterval, parseISO, addMonths, subMonths, 
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays, 
  subDays, isToday, startOfDay
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const TYPE_COLORS = {
  medication: 'bg-blue-50 border-blue-100 text-blue-600',
  medicationDone: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  appointment: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  form: 'bg-amber-50 border-amber-100 text-amber-600',
  diary: 'bg-purple-50 border-purple-100 text-purple-600',
};

const MOODS = [
  { value: 1, emoji: '😞', label: 'Rough', color: '#ef4444' },
  { value: 2, emoji: '😕', label: 'Low',   color: '#f97316' },
  { value: 3, emoji: '😐', label: 'Okay',  color: '#eab308' },
  { value: 4, emoji: '🙂', label: 'Good',  color: '#84cc16' },
  { value: 5, emoji: '😄', label: 'Great', color: '#22c55e' },
];
const getMood = (v) => MOODS.find(m => m.value === v) || MOODS[2];

export default function MyDay() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEventForEdit, setSelectedEventForEdit] = useState(null);
  const [editTime, setEditTime] = useState('');

  // Data Fetching
  const { data: medications } = useQuery({
    queryKey: ['medication-tasks', user?.email],
    queryFn: async () => {
      const allTasks = await apiClient.entities.MedicationTask.filter();
      return allTasks.filter((task) => {
        const byEmail = cleanEmail(task.patient_email) === cleanEmail(user?.email);
        const byName = task.patient_name === user?.full_name;
        return byEmail || byName;
      });
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: appointments } = useQuery({
    queryKey: ['my-appointments', user?.email],
    queryFn: async () => {
      const allAppointments = await apiClient.entities.Appointment.filter();
      return allAppointments.filter((appointment) => {
        const byEmail = cleanEmail(appointment.patient_email) === cleanEmail(user?.email);
        const byName = appointment.patient_name === user?.full_name;
        return byEmail || byName;
      });
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: diaryEntries } = useQuery({
    queryKey: ['my-diary', user?.email],
    queryFn: async () => {
      const all = await apiClient.entities.DiaryEntry.filter();
      return all.filter(e => cleanEmail(e.patient_email) === cleanEmail(user?.email));
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: forms = [] } = useQuery({
    queryKey: ['health-forms-myday', user?.email],
    queryFn: async () => {
      const allForms = await apiClient.entities.HealthForm.filter();
      return allForms.filter(f => !f.patient_email || cleanEmail(f.patient_email) === cleanEmail(user?.email));
    },
    enabled: !!user?.email,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['my-submissions-myday', user?.email],
    queryFn: async () => {
      const allSubmissions = await apiClient.entities.HealthFormSubmission.filter();
      return allSubmissions.filter(s => cleanEmail(s.patient_email) === cleanEmail(user?.email));
    },
    enabled: !!user?.email,
  });

  const toggleMedication = useMutation({
    mutationFn: async ({ task, dateStr }) => {
      const completed = task.completed_dates || [];
      const isCompleted = completed.includes(dateStr);
      const newDates = isCompleted ? completed.filter(d => d !== dateStr) : [...completed, dateStr];
      await apiClient.entities.MedicationTask.update(task.id, { completed_dates: newDates });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medication-tasks'] }),
  });

  // Calendar Helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  // Timeline Events Mapping
  const timelineEvents = useMemo(() => {
    const events = [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    medications.forEach(m => {
      const startDate = m.start_date || m.date;
      const endDate = m.end_date || m.date;
      
      if (!startDate || !endDate) return;

      try {
        const start = startOfDay(parseISO(startDate));
        const end = addDays(startOfDay(parseISO(endDate)), 1);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

        if (isWithinInterval(selectedDate, { start, end })) {
          const times = m.scheduled_times || ['09:00'];
          times.forEach(time => {
            events.push({
              id: `med-${m.id}-${time}`,
              type: 'medication',
              title: m.medication_name,
              time,
              duration: 50,
              data: m,
              completed: m.completed_dates?.includes(dateStr)
            });
          });
        }
      } catch (e) {
        console.error("Timeline date check failed:", m, e);
      }
    });

    appointments.forEach(a => {
      if (a.date === dateStr && a.status === 'upcoming') {
        events.push({
          id: `appt-${a.id}`,
          type: 'appointment',
          title: a.title,
          time: a.time_slot,
          duration: 60,
          data: a,
        });
      }
    });

    return events.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, appointments, diaryEntries, forms, submissions, selectedDate]);

  const pendingEvents = useMemo(() => timelineEvents.filter(e => !e.completed), [timelineEvents]);
  
  const completedEvents = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const list = [];
    
    // Completed meds
    medications.forEach(m => {
      if (m.completed_dates?.includes(dateStr)) {
        const times = m.scheduled_times || ['09:00'];
        times.forEach(t => {
           list.push({ id: `comp-med-${m.id}-${t}`, type: 'medication', title: m.medication_name, time: t, data: m, completed: true });
        });
      }
    });

    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, submissions, selectedDate]);

  const updateTaskTime = useMutation({
    mutationFn: async ({ event, newTime }) => {
      if (event.type === 'medication') {
        const task = event.data;
        const oldTime = event.time;
        const existingTimes = task.scheduled_times || ['09:00'];
        const newTimes = existingTimes.map(t => t === oldTime ? newTime : t);
        await apiClient.entities.MedicationTask.update(task.id, { scheduled_times: newTimes });
      } else if (event.type === 'appointment') {
        await apiClient.entities.Appointment.update(event.data.id, { time_slot: newTime });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      toast.success('Schedule updated');
    },
  });

  const handleDragEnd = (event, info, evtObj) => {
    const [h, m] = evtObj.time.split(':').map(Number);
    const startMins = h * 60 + m;
    const deltaMins = Math.round(info.offset.y);
    const totalMins = Math.max(0, Math.min(1439, startMins + deltaMins));
    const snappedMins = Math.round(totalMins / 15) * 15;
    const newH = Math.floor(snappedMins / 60);
    const newM = snappedMins % 60;
    const newTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    if (newTime !== evtObj.time) updateTaskTime.mutate({ event: evtObj, newTime });
  };

  const openManualEdit = (evt) => {
    setSelectedEventForEdit(evt);
    setEditTime(evt.time);
  };

  const handleManualSave = () => {
    if (editTime) {
      updateTaskTime.mutate({ event: selectedEventForEdit, newTime: editTime });
      setSelectedEventForEdit(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-[calc(100vh-8rem)]"
    >
      <Dialog open={!!selectedEventForEdit} onOpenChange={(open) => !open && setSelectedEventForEdit(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Schedule</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Set Time for "{selectedEventForEdit?.title}"</Label>
              <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSelectedEventForEdit(null)}>Cancel</Button>
            <Button onClick={handleManualSave}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 overflow-hidden bg-background border rounded-3xl shadow-sm">
        {/* Sidebar */}
        <aside className="w-72 border-r bg-card/50 hidden md:flex flex-col p-6 space-y-8 overflow-y-auto">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="font-heading font-bold text-sm tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h2>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={`${d}-${i}`} className="text-[10px] font-bold text-muted-foreground/60 uppercase">{d}</div>
              ))}
              {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />)}
              {calendarDays.map(day => (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`text-xs h-8 w-8 rounded-full flex flex-col items-center justify-center transition-all relative ${
                    isSameDay(day, selectedDate) ? 'bg-primary text-primary-foreground font-bold' :
                    isToday(day) ? 'text-primary font-bold' : 'hover:bg-muted text-foreground/80'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Active Tasks</h3>
            <div className="space-y-3">
              {pendingEvents.slice(0, 5).map((e, i) => (
                <div key={e.id} className="flex gap-3 items-center px-1 group">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    e.type === 'medication' ? 'bg-blue-500' : 
                    e.type === 'appointment' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold truncate leading-none mb-1">{e.title}</p>
                    <p className="text-[10px] text-muted-foreground">{e.time}</p>
                  </div>
                </div>
              ))}
              {pendingEvents.length === 0 && <p className="text-[11px] text-muted-foreground italic">No pending tasks</p>}
            </div>
          </div>
        </aside>

        {/* Main Timeline */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <header className="flex items-center justify-between p-4 border-b bg-card/10 sticky top-0 z-40 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <h1 className="font-heading text-xl font-bold flex items-center gap-2">
                {format(selectedDate, 'EEEE, MMM d')}
                {isToday(selectedDate) && <Badge className="bg-primary/10 text-primary border-none px-2 py-0 h-5 text-[10px] font-bold">TODAY</Badge>}
              </h1>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-full px-4 h-8 text-xs font-bold" onClick={() => setSelectedDate(new Date())}>Today</Button>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="relative min-h-[1440px] px-4 md:px-0">
              {HOURS.map(hour => (
                <div key={hour} className="flex group" style={{ height: '60px' }}>
                  <div className="w-16 md:w-20 pr-4 text-right text-[10px] text-muted-foreground/60 font-bold -translate-y-2 select-none">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  <div className="flex-1 border-t border-muted/30 group-last:border-none" />
                </div>
              ))}

              <div className="absolute inset-y-0 left-16 md:left-20 right-4 pointer-events-none">
                <AnimatePresence mode="popLayout">
                  {pendingEvents.map((event) => {
                    const [h, m] = event.time.split(':').map(Number);
                    const top = (h * 60) + m;
                    return (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 1440 }}
                        dragElastic={0}
                        dragMomentum={false}
                        onDragEnd={(e, info) => handleDragEnd(e, info, event)}
                        whileDrag={{ zIndex: 50, scale: 1.02, boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                        className={`absolute left-1 right-2 p-3 rounded-2xl border shadow-sm pointer-events-auto cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:brightness-95 group overflow-hidden ${getEventColor(event)}`}
                        style={{ top: `${top}px`, minHeight: '55px', zIndex: 10 }}
                      >
                        <div className="flex items-center justify-between gap-3 h-full min-w-0">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-white/50 flex items-center justify-center shrink-0">
                               {event.type === 'medication' ? <Pill className="w-4 h-4" /> :
                                event.type === 'appointment' ? <Clock className="w-4 h-4" /> :
                                event.type === 'form' ? <FileText className="w-4 h-4" /> :
                                <span className="text-lg">{getMood(event.data.mood_score).emoji}</span>}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate leading-none mb-1">{event.title}</p>
                              <p className="text-[10px] opacity-70 font-bold uppercase tracking-wider">{event.time}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            {event.type === 'medication' && (
                              <Button 
                                size="sm" 
                                className="h-7 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-sm px-3 text-[10px] font-bold"
                                onClick={() => toggleMedication.mutate({ task: event.data, dateStr: format(selectedDate, 'yyyy-MM-dd') })}
                              >
                                DONE
                              </Button>
                            )}
                            {event.type === 'form' && (
                              <Link to="/health-form">
                                <Button size="sm" variant="outline" className="h-7 rounded-full px-3 text-[10px] font-bold bg-white/50">
                                  FILL
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Completed Section at the bottom */}
            {completedEvents.length > 0 && (
              <div className="mt-12 mb-24 px-4 md:px-20 border-t pt-8">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Completed Today
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {completedEvents.map(event => (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 text-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
                        {event.type === 'medication' ? <Pill className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate line-through opacity-50">{event.title}</p>
                        <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-wider">{event.time}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {pendingEvents.length === 0 && completedEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">No tasks scheduled for today</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </motion.div>
  );
}

function getEventColor(event) {
  const type = event.type;
  switch (type) {
    case 'medication': return 'bg-blue-50 text-blue-600 border border-blue-100';
    case 'appointment': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    case 'form': return 'bg-amber-50 text-amber-600 border border-amber-100';
    case 'diary': return 'bg-purple-50 text-purple-600 border border-purple-100';
    default: return 'bg-slate-50 text-slate-600 border border-slate-100';
  }
}