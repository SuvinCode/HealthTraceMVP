import { useState, useEffect, useMemo } from 'react';
import { apiClient, cleanEmail } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, FileText, Pill, Calendar, Plus, ArrowLeft, Loader2, Clock, CheckCircle2, Ruler, Weight, Heart, X, BookOpen, Sparkles, TrendingUp, Send } from 'lucide-react';
import { format, parseISO, subDays, isToday, startOfDay } from 'date-fns';

import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import MonthCalendar from '@/components/dashboard/MonthCalendar';
import DayTimeline from '@/components/dashboard/DayTimeline';


// ─── Diary helpers ───────────────────────────────────────────────────────────
const MOODS = [
  { value: 1, emoji: '😞', label: 'Rough', color: '#ef4444', bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600'    },
  { value: 2, emoji: '😕', label: 'Low',   color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
  { value: 3, emoji: '😐', label: 'Okay',  color: '#eab308', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' },
  { value: 4, emoji: '🙂', label: 'Good',  color: '#84cc16', bg: 'bg-lime-50',   border: 'border-lime-200',   text: 'text-lime-600'   },
  { value: 5, emoji: '😄', label: 'Great', color: '#22c55e', bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-600'  },
];
const getMood = (value) => MOODS.find(m => m.value === value) || MOODS[2];

function DiaryMoodChart({ entries }) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const entry = entries.find(e => e.date === format(date, 'yyyy-MM-dd'));
    return { date, mood: entry?.mood_score ?? null };
  });
  return (
    <div className="flex items-end gap-1.5 h-12">
      {last7.map(({ date, mood }, i) => {
        const m = mood ? getMood(mood) : null;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
              style={{ height: mood ? `${(mood / 5) * 36}px` : '4px', backgroundColor: m ? m.color : '#e2e8f0', originY: 1 }}
              className="w-full rounded-t-sm"
            />
            <span className="text-[9px] text-muted-foreground font-medium">{format(date, 'EEE')[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

function DiaryAISummaryDialog({ open, onClose, entries, patientName }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && entries.length > 0) {
      setLoading(true);
      setSummary('');
      const recent = entries.slice(0, 14).map(e => ({
        date: e.date,
        mood: getMood(e.mood_score).label,
        notes: e.notes || '(no notes)',
      }));
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: `You are a clinical assistant helping a doctor understand a patient's recent wellbeing based on their self-reported diary entries.

Patient: ${patientName}
Diary entries (most recent first):
${JSON.stringify(recent, null, 2)}

Please provide:
1. A brief clinical summary (2-3 sentences) of the patient's mood trends
2. Key themes or concerns mentioned in their notes
3. Any patterns worth discussing at their next appointment
4. An overall wellbeing assessment (improving / stable / declining)

Be concise, clinical, and helpful. Format with clear sections.`,
          }],
        }),
      })
        .then(r => r.json())
        .then(data => setSummary(data.choices?.[0]?.message?.content || 'Unable to generate summary.'))
        .catch(() => setSummary('Error generating summary. Please try again.'))
        .finally(() => setLoading(false));
    }
  }, [open, entries, patientName]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[580px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            AI Clinical Summary — {patientName}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {loading ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="w-8 h-8 border-2 border-violet-200 border-t-violet-500 rounded-full"
              />
              <p className="text-sm text-muted-foreground">Analysing diary entries…</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">{summary}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PatientProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const patientEmail = decodeURIComponent(window.location.pathname.split('/patient/')[1]);

  const [medForm, setMedForm] = useState({
    medication_name: '', type: 'tablet', dosage: '', start_date: '', end_date: '', frequency: 'once_daily'
  });
  const [formDialog, setFormDialog] = useState(false);
  const [medDialog, setMedDialog] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', questions: [] });
  const [newQ, setNewQ] = useState({ label: '', type: 'text', required: false, options: '' });
  const [showDiarySummary, setShowDiarySummary] = useState(false);
  
  // Med Edit state
  const [editingMed, setEditingMed] = useState(null);
  const [editMedForm, setEditMedForm] = useState({
    medication_name: '', 
    type: 'tablet', 
    dosage: '', 
    start_date: '', 
    end_date: '', 
    frequency: 'once_daily'
  });

  
  // Calendar states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());


  // Queries
  const { data: patients } = useQuery({
    queryKey: ['patient-user', patientEmail],
    queryFn: () => apiClient.entities.patients.filter({ email: cleanEmail(patientEmail) }),
    initialData: [],
  });
  const patient = patients?.[0];

  const { data: submissions } = useQuery({
    queryKey: ['patient-submissions', patientEmail],
    queryFn: () => apiClient.entities.HealthFormSubmission.filter({ patient_email: cleanEmail(patientEmail), doctor_email: cleanEmail(user?.email) }),
    initialData: [],
  });

  const { data: tasks } = useQuery({
    queryKey: ['patient-tasks', patientEmail],
    queryFn: () => apiClient.entities.MedicationTask.filter({ patient_email: cleanEmail(patientEmail), doctor_email: cleanEmail(user?.email) }),
    initialData: [],
  });

  const { data: appointments } = useQuery({
    queryKey: ['patient-appointments', patientEmail],
    queryFn: () => apiClient.entities.Appointment.filter({ patient_email: cleanEmail(patientEmail), doctor_email: cleanEmail(user?.email) }),
    initialData: [],
  });

  const { data: allForms = [] } = useQuery({
    queryKey: ['patient-forms', patientEmail],
    queryFn: () => apiClient.entities.HealthForm.filter({ patient_email: cleanEmail(patientEmail), doctor_email: cleanEmail(user?.email) }),
    enabled: !!patientEmail && !!user?.email,
  });
 
  const { data: connections = [], isLoading: isLoadingConnections } = useQuery({
    queryKey: ['doctor-connections', user?.email],
    queryFn: async () => {
      const all = await apiClient.entities.ConnectionRequest.filter();
      // Mock API returns all, so we filter by doctor AND patient in JS
      return all.filter(c => 
        cleanEmail(c.doctor_email) === cleanEmail(user?.email) && 
        cleanEmail(c.patient_email) === cleanEmail(patientEmail) &&
        c.status === 'accepted'
      );
    },
    initialData: [],
    enabled: !!user?.email && !!patientEmail,
  });

  const { data: diaryEntries = [] } = useQuery({
    queryKey: ['patient-diary', patientEmail],
    queryFn: async () => {
      const all = await apiClient.entities.DiaryEntry.filter();
      return all
        .filter(e => e.patient_email === patientEmail)
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled: !!patientEmail,
  });

  // Mutations
  const addMed = useMutation({
    mutationFn: (data) => apiClient.entities.MedicationTask.create({
      ...data,
      patient_email: cleanEmail(patientEmail),
      patient_name: patient?.full_name || '',
      doctor_email: cleanEmail(user.email),
      completed_dates: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-tasks', patientEmail] });
      setMedDialog(false);
      setMedForm({ medication_name: '', type: 'tablet', dosage: '', start_date: '', end_date: '', frequency: 'once_daily' });
      toast.success('Medication assigned');
    },
  });

  const createForm = useMutation({
    mutationFn: (data) => apiClient.entities.HealthForm.create({
      ...data,
      doctor_email: cleanEmail(user.email),
      patient_email: cleanEmail(patientEmail),
      active: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-forms'] });
      queryClient.invalidateQueries({ queryKey: ['patient-forms', patientEmail] });
      setFormDialog(false);
      setNewForm({ title: '', questions: [] });
      toast.success('Health form created');
    },
  });

  const disconnectPatient = useMutation({
    mutationFn: async () => {
      const conn = connections[0]; // Already filtered to this patient
      if (conn) {
        return apiClient.entities.ConnectionRequest.delete(conn.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
      toast.success('Patient disconnected');
      navigate('/patient-logs');
    },
    onError: () => toast.error('Failed to disconnect'),
  });

  const deleteMedication = useMutation({
    mutationFn: (id) => apiClient.entities.MedicationTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-tasks'] });
      setEditingMed(null);
      toast.success('Medication removed');
    },
    onError: () => toast.error('Failed to remove medication'),
  });

  const updateMedication = useMutation({
    mutationFn: ({ id, updates }) => apiClient.entities.MedicationTask.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-tasks'] });
      setEditingMed(null);
      toast.success('Medication updated');
    },
    onError: () => toast.error('Failed to update medication'),
  });

  const medStats = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const isPastDay = startOfDay(selectedDate) < startOfDay(new Date());
    
    let completed = 0;
    let remaining = 0;
    let missed = 0;
    
    tasks.forEach(m => {
      const start = parseISO(m.start_date);
      const end = parseISO(m.end_date);
      const day = startOfDay(selectedDate);
      
      if (day >= startOfDay(start) && day <= startOfDay(end)) {
        const times = m.scheduled_times || (
          m.frequency === 'twice_daily' ? ['09:00', '21:00'] :
          m.frequency === 'three_times_daily' ? ['08:00', '14:00', '20:00'] : ['09:00']
        );
        times.forEach(() => {
          const isTaken = m.completed_dates?.includes(dateStr);
          if (isTaken) completed++;
          else if (isPastDay) missed++;
          else remaining++;
        });
      }
    });
    return { completed, remaining, missed, total: completed + remaining + missed };
  }, [tasks, selectedDate]);


  const addQuestion = () => {
    if (!newQ.label) return;
    setNewForm(prev => ({
      ...prev,
      questions: [...prev.questions, {
        ...newQ,
        id: `q_${Date.now()}`,
        options: newQ.type === 'select' ? newQ.options.split(',').map(o => o.trim()).filter(Boolean) : [],
      }],
    }));
    setNewQ({ label: '', type: 'text', required: false, options: '' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to="/patient-logs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Patients
      </Link>

      {/* Patient Info */}
      <Card className="mb-6">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold text-foreground">{patient?.full_name || patientEmail}</h1>
            <p className="text-sm text-muted-foreground">{patientEmail}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              {patient?.age && (
                <Badge variant="secondary" className="flex items-center gap-1"><Heart className="w-3 h-3" /> Age: {patient.age}</Badge>
              )}
              {patient?.weight && (
                <Badge variant="secondary" className="flex items-center gap-1"><Weight className="w-3 h-3" /> {patient.weight} kg</Badge>
              )}
              {patient?.height && (
                <Badge variant="secondary" className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {patient.height} cm</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Dialog open={medDialog} onOpenChange={setMedDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Pill className="w-4 h-4 mr-1" /> Assign Medication</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Assign Medication</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div><Label>Medication Name</Label><Input value={medForm.medication_name} onChange={e => setMedForm(p => ({ ...p, medication_name: e.target.value }))} className="mt-1" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Type</Label>
                        <Select value={medForm.type} onValueChange={v => setMedForm(p => ({ ...p, type: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['tablet', 'capsule', 'liquid', 'injection', 'topical', 'inhaler', 'other'].map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Dosage</Label><Input placeholder="e.g. 500mg" value={medForm.dosage} onChange={e => setMedForm(p => ({ ...p, dosage: e.target.value }))} className="mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Start Date</Label><Input type="date" value={medForm.start_date} onChange={e => setMedForm(p => ({ ...p, start_date: e.target.value }))} className="mt-1" /></div>
                      <div><Label>End Date</Label><Input type="date" value={medForm.end_date} onChange={e => setMedForm(p => ({ ...p, end_date: e.target.value }))} className="mt-1" /></div>
                    </div>
                    <div>
                      <Label>Frequency</Label>
                      <Select value={medForm.frequency} onValueChange={v => setMedForm(p => ({ ...p, frequency: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['once_daily', 'twice_daily', 'three_times_daily', 'weekly', 'as_needed'].map(f => (
                            <SelectItem key={f} value={f}>{f.replace(/_/g, ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => addMed.mutate(medForm)} disabled={addMed.isPending || !medForm.medication_name} className="w-full">
                      {addMed.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Assign
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={formDialog} onOpenChange={setFormDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><FileText className="w-4 h-4 mr-1" /> Create Form</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Create Health Form</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div><Label>Form Title</Label><Input value={newForm.title} onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))} className="mt-1" /></div>
                    <div className="border rounded-xl p-3 space-y-3">
                      <p className="text-sm font-medium">Questions ({newForm.questions.length})</p>
                      {newForm.questions.map((q, i) => (
                        <div key={i} className="text-sm bg-muted rounded-lg p-2 flex justify-between">
                          <span>{q.label} ({q.type})</span>
                          <button className="text-destructive text-xs" onClick={() => setNewForm(p => ({ ...p, questions: p.questions.filter((_, idx) => idx !== i) }))}>Remove</button>
                        </div>
                      ))}
                      <div className="space-y-2 pt-2 border-t">
                        <Input placeholder="Question label" value={newQ.label} onChange={e => setNewQ(p => ({ ...p, label: e.target.value }))} />
                        <div className="flex gap-2">
                          <Select value={newQ.type} onValueChange={v => setNewQ(p => ({ ...p, type: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['text', 'textarea', 'number', 'select', 'boolean'].map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" onClick={addQuestion}><Plus className="w-4 h-4 mr-1" /> Add</Button>
                        </div>
                        {newQ.type === 'select' && (
                          <Input placeholder="Options (comma-separated)" value={newQ.options} onChange={e => setNewQ(p => ({ ...p, options: e.target.value }))} />
                        )}
                      </div>
                    </div>
                    <Button onClick={() => createForm.mutate(newForm)} disabled={createForm.isPending || !newForm.title || newForm.questions.length === 0} className="w-full">
                      {createForm.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Form
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive border-destructive/20 hover:border-destructive hover:bg-destructive/5"
              onClick={() => {
                if (window.confirm('Are you sure you want to disconnect this patient?')) {
                  disconnectPatient.mutate();
                }
              }}
            >
              <X className="w-4 h-4 mr-2" /> Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions"><FileText className="w-4 h-4 mr-1" /> Forms ({submissions.length})</TabsTrigger>
          <TabsTrigger value="timeline"><Clock className="w-4 h-4 mr-1" /> Day Timeline</TabsTrigger>
          <TabsTrigger value="appointments"><Calendar className="w-4 h-4 mr-1" /> Appointments ({appointments.length})</TabsTrigger>
          <TabsTrigger value="diary"><BookOpen className="w-4 h-4 mr-1" /> Diary ({diaryEntries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="mt-4 space-y-6">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-primary">
              <Send className="w-4 h-4" /> Outgoing Forms ({allForms.filter(f => f.active && !submissions.some(s => s.form_id === f.id)).length})
            </h3>
            {allForms.filter(f => f.active && !submissions.some(s => s.form_id === f.id)).length === 0 ? (
              <p className="text-center py-8 text-muted-foreground border rounded-xl border-dashed text-sm">No pending outgoing forms</p>
            ) : (
              <div className="grid gap-3">
                {allForms.filter(f => f.active && !submissions.some(s => s.form_id === f.id)).map((form, i) => (
                  <motion.div key={form.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="bg-muted/30">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{form.title}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{form.questions?.length || 0} Questions</p>
                        </div>
                        <Badge variant="outline" className="text-xs">Awaiting Submission</Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-dashed">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4" /> Submitted Forms ({submissions.length})
            </h3>
            {submissions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground border rounded-xl border-dashed">No form submissions yet</p>
            ) : (
              <div className="grid gap-3">
                {[...submissions].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map((sub, i) => (
                  <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          <span className="font-medium">{sub.form_title}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">{format(new Date(sub.created_date), 'MMM d, yyyy h:mm a')}</Badge>
                        </div>
                        {sub.answers?.map((a, i) => (
                          <div key={i} className="text-sm mt-1">
                            <span className="text-muted-foreground">{a.question_label}: </span>
                            <span className="font-medium">{a.answer || '—'}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4 space-y-4">
           {/* Comprehensive Day Timeline */}
           <Card className="overflow-hidden">
             <CardContent className="p-0">
               <div className="flex flex-col lg:flex-row min-h-[600px]">
                 <div className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-border p-4 bg-muted/5">
                   <MonthCalendar
                     currentMonth={currentMonth}
                     setCurrentMonth={setCurrentMonth}
                     selectedDate={selectedDate}
                     setSelectedDate={setSelectedDate}
                     appointments={appointments}
                   />
                   <div className="mt-6 pt-4 border-t border-border space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3">Medication Status</p>
                        <div className="space-y-2">
                           <div className="flex items-center justify-between text-xs">
                             <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /> Completed</span>
                             <span className="font-bold">{medStats.completed}</span>
                           </div>
                           <div className="flex items-center justify-between text-xs">
                             <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Remaining</span>
                             <span className="font-bold">{medStats.remaining}</span>
                           </div>
                           <div className="flex items-center justify-between text-xs">
                             <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> Missed</span>
                             <span className="font-bold text-red-500">{medStats.missed}</span>
                           </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Patient Stats</p>
                        <div className="space-y-1">
                           <div className="flex justify-between text-xs">
                             <span className="text-muted-foreground">Adherence</span> 
                             <span className="font-bold text-primary">
                               {medStats.total > 0 ? Math.round((medStats.completed / medStats.total) * 100) : 100}%
                             </span>
                           </div>
                           <div className="flex justify-between text-xs">
                             <span className="text-muted-foreground">Mood (Avg)</span> 
                             <span className="font-bold text-primary">
                               {diaryEntries.length > 0 ? (diaryEntries.reduce((s, e) => s + e.mood_score, 0) / diaryEntries.length).toFixed(1) : '—'}/5
                             </span>
                           </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setSelectedDate(new Date())}>Go to Today</Button>
                   </div>

                 </div>
                 <div className="flex-1 p-4">
                    <div className="grid gap-6">
                       <section>
                         <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                           <Clock className="w-4 h-4 text-primary" /> Daily Schedule
                         </h3>
                         <DayTimeline
                           selectedDate={selectedDate}
                           appointments={appointments}
                           medications={tasks}
                           onEditMed={(m) => {
                             setEditingMed(m);
                             setEditMedForm({
                               medication_name: m.data.medication_name,
                               type: m.data.type,
                               dosage: m.data.dosage,
                               start_date: m.data.start_date,
                               end_date: m.data.end_date,
                               frequency: m.data.frequency
                             });
                           }}
                           onComplete={(id) => {
                             apiClient.entities.Appointment.update(id, { status: 'completed' });
                             queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
                             toast.success('Appointment completed');
                           }}
                           onCancel={(id) => {
                             apiClient.entities.Appointment.update(id, { status: 'cancelled' });
                             queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
                             toast.success('Appointment removed');
                           }}
                         />

                       </section>
                       
                       {diaryEntries.find(e => e.date === format(selectedDate, 'yyyy-MM-dd')) && (
                         <section className="pt-6 border-t border-dashed">
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                              <BookOpen className="w-4 h-4 text-primary" /> Diary Note
                            </h3>
                            {diaryEntries.filter(e => e.date === format(selectedDate, 'yyyy-MM-dd')).map(entry => {
                              const mood = getMood(entry.mood_score);
                              return (
                                <div key={entry.id} className={`p-4 rounded-xl border ${mood.border} ${mood.bg}`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">{mood.emoji}</span>
                                    <span className={`text-sm font-bold ${mood.text}`}>{mood.label}</span>
                                  </div>
                                  <p className="text-sm text-foreground/80 leading-relaxed">{entry.notes}</p>
                                </div>
                              );
                            })}
                         </section>
                       )}
                    </div>
                 </div>
               </div>
             </CardContent>
           </Card>
        </TabsContent>



        <TabsContent value="appointments" className="mt-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
               <div className="flex flex-col lg:flex-row min-h-[500px]">
                  <div className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-border p-4 bg-muted/5">
                    <MonthCalendar 
                      currentMonth={currentMonth} 
                      setCurrentMonth={setCurrentMonth}
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                      appointments={appointments}
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <DayTimeline 
                      selectedDate={selectedDate}
                      appointments={appointments}
                      medications={tasks}
                      onEditMed={(m) => {
                        setEditingMed(m);
                        setEditMedForm({
                          medication_name: m.data.medication_name,
                          type: m.data.type,
                          dosage: m.data.dosage,
                          start_date: m.data.start_date,
                          end_date: m.data.end_date,
                          frequency: m.data.frequency
                        });
                      }}
                      onComplete={(id) => {
                        apiClient.entities.Appointment.update(id, { status: 'completed' });
                        queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
                        toast.success('Appointment completed');
                      }}
                      onCancel={(id) => {
                        apiClient.entities.Appointment.update(id, { status: 'cancelled' });
                        queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
                        toast.success('Appointment removed');
                      }}
                    />
                  </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diary" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {diaryEntries.length === 0 ? 'No diary entries yet' : `${diaryEntries.length} entr${diaryEntries.length === 1 ? 'y' : 'ies'}`}
            </p>
            <Button
              size="sm"
              className="gap-2 rounded-full"
              disabled={diaryEntries.length === 0}
              onClick={() => setShowDiarySummary(true)}
            >
              <Sparkles className="w-4 h-4" />
              AI Summary
            </Button>
          </div>

          {diaryEntries.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Last 7 days
                </p>
                <DiaryMoodChart entries={diaryEntries} />
              </CardContent>
            </Card>
          )}

          {diaryEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No diary entries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {diaryEntries.map((entry, i) => {
                const mood = getMood(entry.mood_score);
                return (
                  <motion.div key={entry.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                    <Card>
                      <CardContent className={`p-4 ${mood.bg} border ${mood.border} rounded-xl`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{mood.emoji}</span>
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              {isToday(parseISO(entry.date)) ? 'Today' : format(parseISO(entry.date), 'EEEE, MMM d')}
                            </p>
                            <p className={`text-sm font-bold ${mood.text}`}>{mood.label}</p>
                          </div>
                        </div>
                        {entry.notes && (
                          <p className="mt-3 text-sm text-foreground/70 leading-relaxed border-t border-current/10 pt-3">
                            {entry.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          <DiaryAISummaryDialog
            open={showDiarySummary}
            onClose={() => setShowDiarySummary(false)}
            entries={diaryEntries}
            patientName={patient?.full_name || patientEmail}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingMed} onOpenChange={open => !open && setEditingMed(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Medication Name</Label>
              <Input 
                value={editMedForm.medication_name} 
                onChange={e => setEditMedForm(p => ({ ...p, medication_name: e.target.value }))} 
                className="mt-1" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={editMedForm.type} onValueChange={v => setEditMedForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['tablet', 'capsule', 'liquid', 'injection', 'topical', 'inhaler', 'other'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dosage</Label>
                <Input 
                  placeholder="e.g. 500mg" 
                  value={editMedForm.dosage} 
                  onChange={e => setEditMedForm(p => ({ ...p, dosage: e.target.value }))} 
                  className="mt-1" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input 
                  type="date" 
                  value={editMedForm.start_date} 
                  onChange={e => setEditMedForm(p => ({ ...p, start_date: e.target.value }))} 
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input 
                  type="date" 
                  value={editMedForm.end_date} 
                  onChange={e => setEditMedForm(p => ({ ...p, end_date: e.target.value }))} 
                  className="mt-1" 
                />
              </div>
            </div>
            <div>
              <Label>Frequency</Label>
              <Select value={editMedForm.frequency} onValueChange={v => setEditMedForm(p => ({ ...p, frequency: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['once_daily', 'twice_daily', 'three_times_daily', 'weekly', 'as_needed'].map(f => (
                    <SelectItem key={f} value={f}>{f.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2 pt-4">
              <Button 
                onClick={() => updateMedication.mutate({ id: editingMed.data.id, updates: editMedForm })} 
                disabled={updateMedication.isPending || !editMedForm.medication_name}
              >
                {updateMedication.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Update Medication
              </Button>
              <Button 
                variant="outline" 
                className="text-destructive border-destructive/20 hover:border-destructive hover:bg-destructive/5"
                onClick={() => {
                  if (window.confirm('Remove this medication completely?')) {
                    deleteMedication.mutate(editingMed.data.id);
                  }
                }}
                disabled={deleteMedication.isPending}
              >
                {deleteMedication.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />} Remove Medication
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}