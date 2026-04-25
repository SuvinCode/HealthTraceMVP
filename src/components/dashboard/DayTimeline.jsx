import { format, isSameDay, parseISO, startOfDay, isToday } from 'date-fns';
import { User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useRef, useImperativeHandle, forwardRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Pill, Pencil } from 'lucide-react';



const HOURS = Array.from({ length: 24 }, (_, i) => i); // 12am - 11pm

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

const DayTimeline = forwardRef(function DayTimeline({ 
  selectedDate, 
  appointments, 
  medications = [], 
  onComplete, 
  onCancel, 
  onToggleMed,
  onEditMed
}, ref) {
  // Determine if the selected date is today and compute current minutes for time indicator
  const isTodaySelected = isToday(selectedDate);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const scrollRef = useRef(null);
  const rowRefs = useRef({});

  useImperativeHandle(ref, () => ({
    scrollToTime(timeSlot) {
      const [h] = timeSlot.split(':').map(Number);
      const el = rowRefs.current[h];
      if (el && scrollRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }));

  const dayAppts = appointments
    .filter(a => isSameDay(parseISO(a.date), selectedDate) && a.status !== 'cancelled')
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot));

  const dayMeds = [];
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  medications.forEach(m => {
    // Basic filter: is selectedDate within start/end?
    const start = parseISO(m.start_date);
    const end = parseISO(m.end_date);
    const day = startOfDay(selectedDate);
    
    if (day >= startOfDay(start) && day <= startOfDay(end)) {
      const times = m.scheduled_times || (
        m.frequency === 'twice_daily' ? ['09:00', '21:00'] :
        m.frequency === 'three_times_daily' ? ['08:00', '14:00', '20:00'] : ['09:00']
      );
      times.forEach(time => {
        dayMeds.push({ 
          id: `med-${m.id}-${time}`, 
          type: 'medication', 
          title: m.medication_name, 
          time, 
          data: m, 
          completed: m.completed_dates?.includes(dateStr) 
        });
      });
    }
  });

  const allEvents = [
    ...dayAppts.map(a => ({ ...a, type: 'appointment', time: a.time_slot })),
    ...dayMeds
  ].sort((a, b) => a.time.localeCompare(b.time));


  return (
    <div className="flex flex-col h-full">
      <h2 className="font-heading font-semibold text-base text-foreground mb-3">
        {format(selectedDate, 'EEEE, MMMM d')}
        <span className="ml-2 text-sm text-muted-foreground font-normal">
          {allEvents.length} item{allEvents.length !== 1 ? 's' : ''}
        </span>
      </h2>


      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        {HOURS.map(hour => {
          const hourStr = `${String(hour).padStart(2, '0')}:00`;
          const halfStr = `${String(hour).padStart(2, '0')}:30`;

          const eventsAtHour = allEvents.filter(e => {
            const mins = timeToMinutes(e.time);
            return mins >= hour * 60 && mins < hour * 60 + 30;
          });
          const eventsAtHalf = allEvents.filter(e => {
            const mins = timeToMinutes(e.time);
            return mins >= hour * 60 + 30 && mins < (hour + 1) * 60;
          });

          return (
            <div key={hour} ref={el => rowRefs.current[hour] = el} className="relative">
              {isTodaySelected && currentMinutes >= hour * 60 && currentMinutes < (hour + 1) * 60 && (
                <div 
                  className="absolute left-12 right-0 border-t border-gray-400 z-10"
                  style={{ top: `${((currentMinutes % 60) / 60) * 100}%` }}
                >
                  <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-gray-400" />
                </div>
              )}
              {/* :00 row */}
              <div className="flex items-start min-h-[52px] group">
                <div className="w-12 shrink-0 text-right pr-3 pt-0.5">
                  <span className="text-[10px] text-muted-foreground">{format(new Date(2020, 0, 1, hour), 'h a')}</span>
                </div>
                <div className="flex-1 border-t border-border relative pt-1 pb-1 min-h-[52px]">
                  {eventsAtHour.map(evt => (
                    evt.type === 'appointment' ? 
                      <AppointmentBlock key={evt.id} apt={evt} onComplete={onComplete} onCancel={onCancel} /> :
                      <MedicationBlock key={evt.id} med={evt} selectedDate={selectedDate} onToggle={onToggleMed} onEdit={onEditMed} />
                  ))}
                </div>
              </div>
              {/* :30 row */}
              <div className="flex items-start min-h-[52px]">
                <div className="w-12 shrink-0 text-right pr-3 pt-0.5">
                  <span className="text-[10px] text-muted-foreground/50">{String(hour).padStart(2, '0')}:30</span>
                </div>
                <div className="flex-1 border-t border-dashed border-border/50 relative pt-1 pb-1 min-h-[52px]">
                  {eventsAtHalf.map(evt => (
                    evt.type === 'appointment' ? 
                      <AppointmentBlock key={evt.id} apt={evt} onComplete={onComplete} onCancel={onCancel} /> :
                      <MedicationBlock key={evt.id} med={evt} selectedDate={selectedDate} onToggle={onToggleMed} onEdit={onEditMed} />
                  ))}
                </div>
              </div>
            </div>
          );

        })}
      </div>
    </div>
  );
});

export default DayTimeline;

function AppointmentBlock({ apt, onComplete, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className={`mb-1 rounded-lg px-3 py-2 border flex items-center gap-3 text-sm
        ${apt.status === 'completed'
          ? 'bg-muted/50 border-border opacity-60'
          : 'bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors'}
      `}
    >
        <Checkbox
          checked={apt.status === 'completed'}
          onCheckedChange={(checked) => {
            if (checked && apt.status === 'upcoming') {
              onComplete(apt.id);
            }
          }}
          disabled={apt.status === 'completed'}
          className="h-5 w-5 rounded-md border-primary/30 shrink-0"
        />
        <div className="shrink-0">
          <span className="text-xs font-bold text-primary">{apt.time_slot}</span>
        </div>

      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${apt.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {apt.title}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="w-3 h-3" /> {apt.patient_name}
          </p>
          {apt.description && (
            <p className="text-xs text-muted-foreground/60 italic truncate max-w-[150px]">
              - {apt.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {apt.status === 'upcoming' && (
          <>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => onComplete(apt.id)}>
              <CheckCircle2 className="w-3 h-3 mr-1" /> Done
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-destructive" onClick={() => onCancel(apt.id)}>
              Cancel
            </Button>
          </>
        )}
        {apt.status === 'completed' && (
          <Badge variant="secondary" className="text-xs">Done</Badge>
        )}
      </div>
    </motion.div>
  );
}

function MedicationBlock({ med, selectedDate, onToggle, onEdit }) {
  const isTaken = med.completed;
  const isFutureDay = startOfDay(selectedDate) > startOfDay(new Date());
  const isPastDay = startOfDay(selectedDate) < startOfDay(new Date());
  const isTodayDate = isToday(selectedDate);

  // Missed logic: not taken AND day is over (past day)
  const isMissed = !isTaken && isPastDay;
  const isRemaining = !isTaken && (isTodayDate || isFutureDay);

  let statusStyles = 'bg-blue-50 border-blue-200 text-blue-700';
  if (isTaken) statusStyles = 'bg-green-50 border-green-300 text-green-700';
  else if (isMissed) statusStyles = 'bg-red-50 border-red-200 text-red-600';
  else if (isRemaining) statusStyles = 'bg-yellow-50 border-yellow-200 text-yellow-700';

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className={`mb-1 rounded-lg px-3 py-2 border flex items-center gap-3 text-sm transition-colors ${statusStyles}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {onToggle ? (
          <Checkbox
            checked={isTaken}
            onCheckedChange={() => onToggle?.(med.data, format(selectedDate, 'yyyy-MM-dd'))}
            className={`h-5 w-5 rounded-md shrink-0 ${isTaken ? 'border-green-500' : isMissed ? 'border-red-400' : 'border-yellow-500'}`}
          />
        ) : (
          <div className={`h-5 w-5 rounded-md border shrink-0 flex items-center justify-center ${isTaken ? 'bg-green-500 border-green-500' : isMissed ? 'border-red-400' : 'border-yellow-500'}`}>
            {isTaken && <CheckCircle2 className="w-3 h-3 text-white" />}
          </div>
        )}
        <div className="shrink-0">
          <span className="text-xs font-bold opacity-80">{med.time}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold truncate ${isTaken ? 'line-through opacity-70' : ''}`}>
            {med.title}
          </p>
          <p className="text-[10px] opacity-70 flex items-center gap-1">
             <Pill className="w-3 h-3" /> {med.data.dosage} {med.data.type}
          </p>
        </div>
      </div>
      
      {onEdit && (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7 hover:bg-black/5"
          onClick={() => onEdit(med)}
        >
          <Pencil className="w-3 h-3" />
        </Button>
      )}
    </motion.div>
  );
}