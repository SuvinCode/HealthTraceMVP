import { apiClient } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, Stethoscope, X, AlertTriangle, Phone } from 'lucide-react';
import { format, differenceInHours, isPast, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Appointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isDoctor = user?.role === 'doctor';

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', user?.email],
    queryFn: () => {
      const emailField = isDoctor ? 'doctor_email' : 'patient_email';
      return apiClient.entities.Appointment.filter({ [emailField]: user?.email });
    },
    initialData: [],
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Appointment.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment cancelled');
    },
  });

  const now = new Date();
  const upcoming = appointments.filter(a => a.status === 'upcoming' && !isPast(parseISO(a.date)));
  const past = appointments.filter(a => a.status === 'completed' || (a.status === 'upcoming' && isPast(parseISO(a.date))));
  const cancelled = appointments.filter(a => a.status === 'cancelled');

  const canModify = (apt) => {
    const aptDate = parseISO(apt.date);
    return differenceInHours(aptDate, now) > 24;
  };

  const AppointmentCard = ({ apt, showActions = true }) => {
    const editable = canModify(apt);
    const aptDate = parseISO(apt.date);
    const isEmergencyWindow = !editable && apt.status === 'upcoming' && !isPast(aptDate);

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{format(aptDate, 'MMM')}</span>
              <span className="text-sm font-bold text-primary leading-none">{format(aptDate, 'd')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{apt.title}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {apt.time_slot}</span>
                <span className="flex items-center gap-1">
                  {isDoctor ? <User className="w-3.5 h-3.5" /> : <Stethoscope className="w-3.5 h-3.5" />}
                  {isDoctor ? apt.patient_name : apt.doctor_name}
                </span>
              </div>
              {isEmergencyWindow && !isDoctor && (
                <Alert className="mt-2 py-2">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-xs">
                    Less than 24h away. For changes, call the clinic directly. <Phone className="w-3 h-3 inline" />
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={apt.status === 'upcoming' ? 'default' : apt.status === 'completed' ? 'secondary' : 'destructive'}>
                {apt.status}
              </Badge>
              {showActions && apt.status === 'upcoming' && !isPast(aptDate) && editable && !isDoctor && (
                <Button size="icon" variant="ghost" onClick={() => cancelMutation.mutate(apt.id)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
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
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
        </TabsList>

        {[
          { value: 'upcoming', items: upcoming },
          { value: 'past', items: past },
          { value: 'cancelled', items: cancelled },
        ].map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4 space-y-3">
            {tab.items.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No {tab.value} appointments</div>
            ) : (
              tab.items.sort((a, b) => new Date(a.date) - new Date(b.date)).map((apt, i) => (
                <motion.div key={apt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <AppointmentCard apt={apt} showActions={tab.value === 'upcoming'} />
                </motion.div>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}