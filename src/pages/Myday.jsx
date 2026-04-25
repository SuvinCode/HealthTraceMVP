// Originally "Diary.jsx" — renamed to MyDay.jsx
// This is the daily schedule/timeline view (medications, appointments).
// The "Diary" name now belongs to the mood & journal feature.

import { useState, useMemo, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Pill, Calendar as CalIcon, Clock, FileText, CheckCircle2, Pencil } from 'lucide-react';
import { 
  format, isSameDay, isWithinInterval, parseISO, addMonths, subMonths, 
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfDay, addDays, 
  subDays, isToday, startOfWeek, endOfWeek 
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const TYPE_COLORS = {
  medication: 'bg-blue-100 border-blue-200 text-blue-700',
  medicationDone: 'bg-green-100 border-green-300 text-green-800',
  appointment: 'bg-emerald-100 border-emerald-200 text-emerald-700',
  form: 'bg-amber-100 border-amber-200 text-amber-700',
};

const getEventColor = (event) => {
  if (event.type === 'medication') {
    return event.completed ? TYPE_COLORS.medicationDone : TYPE_COLORS.medication;
  }
  return TYPE_COLORS[event.type];
};

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
        const byEmail = task.patient_email === user?.email;
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
        const byEmail = appointment.patient_email === user?.email;
        const byName = appointment.patient_name === user?.full_name;
        return byEmail || byName;
      });
    },
    enabled: !!user?.email,
    initialData: [],
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
      if (isWithinInterval(selectedDate, { start: parseISO(m.start_date), end: parseISO(m.end_date) })) {
        const times = m.scheduled_times || (
          m.frequency === 'twice_daily' ? ['09:00', '21:00'] : 
          m.frequency === 'three_times_daily' ? ['08:00', '14:00', '20:00'] : ['09:00']
        );
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
  }, [medications, appointments, selectedDate]);

  const updateTaskTime = useMutation({
    mutationFn: async ({ event, newTime }) => {
      if (event.type === 'medication') {
        const task = event.data;
        const oldTime = event.time;
        const existingTimes = task.scheduled_times || (
          task.frequency === 'twice_daily' ? ['09:00', '21:00'] : 
          task.frequency === 'three_times_daily' ? ['08:00', '14:00', '20:00'] : ['09:00']
        );
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
            <p className="text-xs text-muted-foreground italic">
              Tip: You can also drag the event on the timeline to reschedule.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSelectedEventForEdit(null)}>Cancel</Button>
            <Button onClick={handleManualSave}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 overflow-hidden bg-background border rounded-2xl shadow-sm">
        {/* Sidebar */}
        <aside className="w-72 border-r bg-card/50 hidden md:flex flex-col p-6 space-y-8 overflow-y-auto">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
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
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="text-[10px] font-bold text-muted-foreground/60 uppercase">{d}</div>
              ))}
              {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />)}
              {calendarDays.map(day => (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`text-xs h-8 w-8 rounded-full flex items-center justify-center transition-all ${
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
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Upcoming</h3>
            <div className="space-y-3">
              {timelineEvents.slice(0, 3).map((e, i) => (
                <motion.div 
                  key={e.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex gap-3 items-center px-1 group"
                >
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    e.type === 'medication' ? 'bg-blue-500' : 
                    e.type === 'appointment' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold leading-none mb-1 group-hover:text-primary transition-colors">{e.title}</p>
                    <p className="text-[10px] text-muted-foreground">{e.time}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openManualEdit(e)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Timeline */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <header className="flex items-center justify-between p-4 border-b bg-card/10">
            <div className="flex items-center gap-4">
              <h1 className="font-heading text-xl font-bold flex items-center gap-2">
                {format(selectedDate, 'EEEE, MMM d')}
                {isToday(selectedDate) && <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-2 py-0 h-5 text-[10px] font-bold">TODAY</Badge>}
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
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-muted-foreground font-medium hidden sm:block">DRAG TO RESCHEDULE</p>
              <Button variant="outline" size="sm" className="rounded-full px-4 h-8 text-xs font-bold" onClick={() => setSelectedDate(new Date())}>Today</Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto relative custom-scrollbar">
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
                  {timelineEvents.map((event) => {
                    const [h, m] = event.time.split(':').map(Number);
                    const top = (h * 60) + m;
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 1440 }}
                        dragElastic={0}
                        dragMomentum={false}
                        onDragEnd={(e, info) => handleDragEnd(e, info, event)}
                        whileDrag={{ zIndex: 50, scale: 1.02, boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                        className={`absolute left-1 right-2 p-2 rounded-lg border shadow-sm pointer-events-auto cursor-grab active:cursor-grabbing transition-colors transition-shadow hover:shadow-md hover:brightness-95 group overflow-hidden ${getEventColor(event)}`}
                        style={{ top: `${top}px`, height: `${event.duration}px`, minHeight: '45px', zIndex: 10 }}
                      >
                        <div className="flex items-start justify-between h-full min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              {event.type === 'medication' ? <Pill className="w-3.5 h-3.5 shrink-0" /> :
                               event.type === 'appointment' ? <Clock className="w-3.5 h-3.5 shrink-0" /> : <FileText className="w-3.5 h-3.5 shrink-0" />}
                              <p className="text-[11px] font-bold truncate leading-none uppercase tracking-tight">{event.title}</p>
                            </div>
                            <p className="text-[10px] opacity-70 font-bold tracking-wide">{event.time}</p>
                          </div>
                          {event.type === 'medication' && (
                            <Checkbox
                              checked={event.completed}
                              onCheckedChange={() => toggleMedication.mutate({ task: event.data, dateStr: format(selectedDate, 'yyyy-MM-dd') })}
                              className={`w-5 h-5 bg-white/50 shrink-0 ml-2 transition-colors ${
                                event.completed
                                  ? 'border-green-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600'
                                  : 'border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                              }`}
                            />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
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