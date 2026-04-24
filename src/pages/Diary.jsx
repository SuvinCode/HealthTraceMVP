import { useState, useMemo } from 'react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Pill, Calendar as CalIcon } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isWithinInterval, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

const FREQ_LABELS = {
  once_daily: 'Once daily',
  twice_daily: 'Twice daily',
  three_times_daily: '3x daily',
  weekly: 'Weekly',
  as_needed: 'As needed',
};

export default function Diary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: tasks } = useQuery({
    queryKey: ['medication-tasks', user?.email],
    queryFn: () => apiClient.entities.MedicationTask.filter({ patient_email: user?.email }),
    initialData: [],
  });

  const toggleComplete = useMutation({
    mutationFn: async ({ task, dateStr }) => {
      const completed = task.completed_dates || [];
      const isCompleted = completed.includes(dateStr);
      const newDates = isCompleted ? completed.filter(d => d !== dateStr) : [...completed, dateStr];
      await apiClient.entities.MedicationTask.update(task.id, { completed_dates: newDates });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medication-tasks'] }),
  });

  const tasksForDate = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return tasks.filter(t => {
      const start = parseISO(t.start_date);
      const end = parseISO(t.end_date);
      return isWithinInterval(selectedDate, { start, end });
    });
  }, [tasks, selectedDate]);

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const getTaskCountForDay = (day) => {
    return tasks.filter(t => {
      const start = parseISO(t.start_date);
      const end = parseISO(t.end_date);
      return isWithinInterval(day, { start, end });
    }).length;
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Diary</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="font-heading font-semibold text-lg">{format(currentMonth, 'MMMM yyyy')}</h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {calendarDays.map(day => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const taskCount = getTaskCountForDay(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all relative ${
                      isSelected ? 'bg-primary text-primary-foreground shadow-md' :
                      isToday ? 'bg-accent text-accent-foreground font-semibold' :
                      'hover:bg-muted text-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                    {taskCount > 0 && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tasks for selected date */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CalIcon className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold">{format(selectedDate, 'EEEE, MMM d')}</h2>
          </div>

          {tasksForDate.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Pill className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No medications for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasksForDate.map(task => {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const isCompleted = task.completed_dates?.includes(dateStr);

                return (
                  <Card key={task.id} className={isCompleted ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleComplete.mutate({ task, dateStr })}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {task.medication_name}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <Badge variant="secondary" className="text-xs">{task.type}</Badge>
                            {task.dosage && <Badge variant="outline" className="text-xs">{task.dosage}</Badge>}
                            <Badge variant="outline" className="text-xs">{FREQ_LABELS[task.frequency] || task.frequency}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}