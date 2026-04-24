import { format, isSameDay } from 'date-fns';
import { User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useRef, useImperativeHandle, forwardRef } from 'react';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am - 7pm

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

const DayTimeline = forwardRef(function DayTimeline({ selectedDate, appointments, onComplete, onCancel }, ref) {
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
    .filter(a => isSameDay(new Date(a.date), selectedDate) && a.status !== 'cancelled')
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot));

  return (
    <div className="flex flex-col h-full">
      <h2 className="font-heading font-semibold text-base text-foreground mb-3">
        {format(selectedDate, 'EEEE, MMMM d')}
        <span className="ml-2 text-sm text-muted-foreground font-normal">
          {dayAppts.length} appointment{dayAppts.length !== 1 ? 's' : ''}
        </span>
      </h2>

      <div ref={scrollRef} className="flex-1 overflow-y-auto relative" style={{ maxHeight: '560px' }}>
        {HOURS.map(hour => {
          const hourStr = `${String(hour).padStart(2, '0')}:00`;
          const halfStr = `${String(hour).padStart(2, '0')}:30`;

          const apptAtHour = dayAppts.filter(a => {
            const mins = timeToMinutes(a.time_slot);
            return mins >= hour * 60 && mins < hour * 60 + 30;
          });
          const apptAtHalf = dayAppts.filter(a => {
            const mins = timeToMinutes(a.time_slot);
            return mins >= hour * 60 + 30 && mins < (hour + 1) * 60;
          });

          return (
            <div key={hour} ref={el => rowRefs.current[hour] = el}>
              {/* :00 row */}
              <div className="flex items-start min-h-[52px] group">
                <div className="w-12 shrink-0 text-right pr-3 pt-0.5">
                  <span className="text-[10px] text-muted-foreground">{format(new Date(2020, 0, 1, hour), 'h a')}</span>
                </div>
                <div className="flex-1 border-t border-border relative pt-1 pb-1 min-h-[52px]">
                  {apptAtHour.map(apt => (
                    <AppointmentBlock key={apt.id} apt={apt} onComplete={onComplete} onCancel={onCancel} />
                  ))}
                </div>
              </div>
              {/* :30 row */}
              <div className="flex items-start min-h-[52px]">
                <div className="w-12 shrink-0 text-right pr-3 pt-0.5">
                  <span className="text-[10px] text-muted-foreground/50">{String(hour).padStart(2, '0')}:30</span>
                </div>
                <div className="flex-1 border-t border-dashed border-border/50 relative pt-1 pb-1 min-h-[52px]">
                  {apptAtHalf.map(apt => (
                    <AppointmentBlock key={apt.id} apt={apt} onComplete={onComplete} onCancel={onCancel} />
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
      <div className="shrink-0">
        <span className="text-xs font-bold text-primary">{apt.time_slot}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${apt.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {apt.title}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <User className="w-3 h-3" /> {apt.patient_name}
        </p>
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