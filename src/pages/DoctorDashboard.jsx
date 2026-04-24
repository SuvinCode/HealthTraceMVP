import { useState, useRef } from 'react';
import { base44 } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import MonthCalendar from '@/components/dashboard/MonthCalendar';
import DayTimeline from '@/components/dashboard/DayTimeline';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const timelineRef = useRef(null);

  const { data: appointments } = useQuery({
    queryKey: ['doctor-all-appointments', user?.email],
    queryFn: () => base44.entities.Appointment.filter({ doctor_email: user?.email }),
    initialData: [],
  });

  const { data: connections } = useQuery({
    queryKey: ['doctor-connections', user?.email],
    queryFn: () => base44.entities.ConnectionRequest.filter({ doctor_email: user?.email, status: 'accepted' }),
    initialData: [],
  });

  const completeMutation = useMutation({
    mutationFn: (id) => base44.entities.Appointment.update(id, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-all-appointments'] });
      toast.success('Appointment marked as done');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => base44.entities.Appointment.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-all-appointments'] });
      toast.success('Appointment cancelled');
    },
  });

  const totalUpcoming = appointments.filter(a => a.status === 'upcoming').length;
  const totalCompleted = appointments.filter(a => a.status === 'completed').length;

  const stats = [
    { label: 'Patients', value: connections.length, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Upcoming', value: totalUpcoming, icon: Calendar, color: 'bg-accent text-accent-foreground' },
    { label: 'Completed', value: totalCompleted, icon: CheckCircle2, color: 'bg-secondary text-secondary-foreground' },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Google Calendar-style layout */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row min-h-[620px]">

            {/* Left: Month mini calendar */}
            <div className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-border p-4">
              <MonthCalendar
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                setSelectedDate={(day) => {
                  setSelectedDate(day);
                  setCurrentMonth(day);
                }}
                appointments={appointments}
                onAppointmentClick={(timeSlot) => timelineRef.current?.scrollToTime(timeSlot)}
              />

              {/* Today button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 text-xs"
                onClick={() => { setSelectedDate(new Date()); setCurrentMonth(new Date()); }}
              >
                Today
              </Button>
            </div>

            {/* Right: Day timeline */}
            <div className="flex-1 p-4 overflow-hidden">
              <DayTimeline
                ref={timelineRef}
                selectedDate={selectedDate}
                appointments={appointments}
                onComplete={completeMutation.mutate}
                onCancel={cancelMutation.mutate}
              />
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}