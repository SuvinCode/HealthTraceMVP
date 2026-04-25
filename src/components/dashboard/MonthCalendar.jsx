import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MonthCalendar({ currentMonth, setCurrentMonth, selectedDate, setSelectedDate, appointments, onAppointmentClick }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const getApptCount = (day) =>
    appointments.filter(a => isSameDay(parseISO(a.date), day) && a.status !== 'cancelled').length;

  const now = new Date();
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
  const todayRemaining = appointments
    .filter(a => {
      if (!isSameDay(parseISO(a.date), now)) return false;
      if (a.status === 'cancelled') return false;
      const [h, m] = a.time_slot.split(':').map(Number);
      return h * 60 + m >= currentTimeMinutes;
    })
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot));

  return (
    <div className="select-none">
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-heading font-semibold text-sm text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const count = getApptCount(day);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`relative flex flex-col items-center justify-center h-8 w-full rounded-lg text-xs font-medium transition-all
                ${isSelected ? 'bg-primary text-primary-foreground' :
                  isToday ? 'bg-primary/10 text-primary font-bold' :
                  'hover:bg-muted text-foreground'}
                ${!isCurrentMonth ? 'opacity-30' : ''}
              `}
            >
              {format(day, 'd')}
              {count > 0 && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Today's remaining appointments */}
      {todayRemaining.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Today's Remaining
          </p>
          <div className="space-y-1">
            {todayRemaining.map(apt => (
              <button
                key={apt.id}
                onClick={() => {
                  setSelectedDate(now);
                  setCurrentMonth(now);
                  if (onAppointmentClick) onAppointmentClick(apt.time_slot);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary shrink-0">{apt.time_slot}</span>
                  <span className="text-[11px] text-foreground truncate group-hover:text-primary transition-colors">{apt.title}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate pl-8">{apt.patient_name}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}