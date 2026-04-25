import { apiClient } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, Stethoscope, X, AlertTriangle, Phone, CheckCircle2 } from 'lucide-react';
import { format, parseISO, parse, startOfDay, isToday, isAfter, isBefore, differenceInHours } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Appointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isDoctor = user?.role === 'doctor';

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', user?.email],
    queryFn: async () => {
      const all = await apiClient.entities.Appointment.filter();
      return all.filter(a => {
        if (isDoctor) return a.doctor_email === user?.email || a.doctor_name === user?.full_name;
        return a.patient_email === user?.email || a.patient_name === user?.full_name;
      });
    },
    enabled: !!user?.email,
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Appointment.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment cancelled');
    },
  });

  const now = new Date();
  const todayStart = startOfDay(now);

  const getDateOnly = (apt) => startOfDay(parseISO(apt.date));
  const getDateTime = (apt) => parse(`${apt.date} ${apt.time_slot}`, 'yyyy-MM-dd HH:mm', new Date());

  // Today's appointments (any non-cancelled status)
  const upcoming = appointments
    .filter(a => a.status === 'upcoming' && isToday(parseISO(a.date)))
    .sort((a, b) => getDateTime(a) - getDateTime(b));

  // Tomorrow and beyond, not yet done
  const later = appointments
    .filter(a => a.status === 'upcoming' && isAfter(getDateOnly(a), todayStart))
    .sort((a, b) => getDateTime(a) - getDateTime(b));

  // Already happened or explicitly marked complete
  const completed = appointments
    .filter(a =>
      a.status === 'completed' ||
      (a.status === 'upcoming' && isBefore(getDateOnly(a), todayStart))
    )
    .sort((a, b) => getDateTime(b) - getDateTime(a)); // most recent first

  const AppointmentCard = ({ apt, showCancel = false }) => {
    const aptDateTime = getDateTime(apt);
    const hoursUntil = differenceInHours(aptDateTime, now);
    const isWithin24h = hoursUntil >= 0 && hoursUntil < 24;
    const isCompleted = apt.status === 'completed';
    const isPastDate = isBefore(getDateOnly(apt), todayStart);

    return (
      <Card className={isCompleted || isPastDate ? 'opacity-75' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
              isCompleted || isPastDate ? 'bg-muted' : 'bg-primary/10'
            }`}>
              <span className={`text-xs font-bold ${isCompleted || isPastDate ? 'text-muted-foreground' : 'text-primary'}`}>
                {format(aptDateTime, 'MMM')}
              </span>
              <span className={`text-sm font-bold leading-none ${isCompleted || isPastDate ? 'text-muted-foreground' : 'text-primary'}`}>
                {format(aptDateTime, 'd')}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{apt.title}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {apt.time_slot}
                </span>
                <span className="flex items-center gap-1">
                  {isDoctor ? <User className="w-3.5 h-3.5" /> : <Stethoscope className="w-3.5 h-3.5" />}
                  {isDoctor ? apt.patient_name : apt.doctor_name}
                </span>
              </div>
              {apt.description && (
                <p className="mt-2 text-sm text-muted-foreground/80 italic line-clamp-2">
                  "{apt.description}"
                </p>
              )}
              {isWithin24h && !isDoctor && apt.status === 'upcoming' && (
                <Alert className="mt-2 py-2">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-xs">
                    Less than 24h away. For changes, call the clinic directly. <Phone className="w-3 h-3 inline" />
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Badge variant={apt.status === 'cancelled' ? 'destructive' : 'default'}>
                  {apt.status}
                </Badge>
              )}
              {showCancel && apt.status === 'upcoming' && !isWithin24h && !isDoctor && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => cancelMutation.mutate(apt.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ label }) => (
    <div className="text-center py-16 text-muted-foreground">
      <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">No {label} appointments</p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Appointments</h1>
        {!isDoctor && (
          <Link to="/create-appointment">
            <Button><Calendar className="w-4 h-4 mr-2" /> Book New</Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming
            {upcoming.length > 0 && (
              <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {upcoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="later">Later ({later.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <EmptyState label="upcoming" />
          ) : (
            upcoming.map((apt, i) => (
              <motion.div key={apt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <AppointmentCard apt={apt} showCancel={false} />
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="later" className="mt-4 space-y-3">
          {later.length === 0 ? (
            <EmptyState label="later" />
          ) : (
            later.map((apt, i) => (
              <motion.div key={apt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <AppointmentCard apt={apt} showCancel={true} />
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4 space-y-3">
          {completed.length === 0 ? (
            <EmptyState label="completed" />
          ) : (
            completed.map((apt, i) => (
              <motion.div key={apt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <AppointmentCard apt={apt} showCancel={false} />
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
