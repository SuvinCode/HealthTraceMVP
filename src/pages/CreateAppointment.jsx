import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Clock, Check } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30',
];

export default function CreateAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [date, setDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: connections } = useQuery({
    queryKey: ['my-connections', user?.email],
    queryFn: () => base44.entities.ConnectionRequest.filter({ patient_email: user?.email, status: 'accepted' }),
    initialData: [],
  });

  const { data: existingAppts } = useQuery({
    queryKey: ['doctor-appointments', doctorEmail, date],
    queryFn: () => base44.entities.Appointment.filter({
      doctor_email: doctorEmail,
      date: format(date, 'yyyy-MM-dd'),
      status: 'upcoming',
    }),
    enabled: !!doctorEmail && !!date,
    initialData: [],
  });

  const availableSlots = useMemo(() => {
    const booked = existingAppts.map(a => a.time_slot);
    return TIME_SLOTS.filter(s => !booked.includes(s));
  }, [existingAppts]);

  const handleSubmit = async () => {
    if (!title || !doctorEmail || !date || !timeSlot) {
      toast.error('Please fill all fields');
      return;
    }
    setSaving(true);
    const conn = connections.find(c => c.doctor_email === doctorEmail);
    await base44.entities.Appointment.create({
      title,
      date: format(date, 'yyyy-MM-dd'),
      time_slot: timeSlot,
      patient_email: user.email,
      patient_name: user.full_name,
      doctor_email: doctorEmail,
      doctor_name: conn?.doctor_name || '',
      status: 'upcoming',
    });
    toast.success('Appointment booked!');
    navigate('/appointments');
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Book Appointment</h1>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div>
            <Label>Appointment Name</Label>
            <Input placeholder="e.g. Regular Checkup" value={title} onChange={e => setTitle(e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label>Doctor</Label>
            <Select value={doctorEmail} onValueChange={setDoctorEmail}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select doctor" /></SelectTrigger>
              <SelectContent>
                {connections.map(c => (
                  <SelectItem key={c.doctor_email} value={c.doctor_email}>{c.doctor_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full mt-1.5 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={d => { setDate(d); setTimeSlot(''); }}
                  disabled={d => isBefore(d, startOfDay(new Date()))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {date && doctorEmail && (
            <div>
              <Label className="mb-2 block">Available Time Slots</Label>
              {availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No slots available for this date</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setTimeSlot(slot)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        timeSlot === slot
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'border-border hover:border-primary/40 text-foreground'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={saving || !title || !doctorEmail || !date || !timeSlot}
            className="w-full"
            size="lg"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Book Appointment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}