import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
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
import { User, FileText, Pill, Calendar, Plus, ArrowLeft, Loader2, Clock, CheckCircle2, Ruler, Weight, Heart, X, BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { format, parseISO, subDays, isToday, eachDayOfInterval, isFuture, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

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

  // Queries
  const { data: patients } = useQuery({
    queryKey: ['patient-user', patientEmail],
    queryFn: () => apiClient.entities.patients.filter({ email: patientEmail }),
    initialData: [],
  });
  const patient = patients?.[0];

  const { data: submissions } = useQuery({
    queryKey: ['patient-submissions', patientEmail],
    queryFn: () => apiClient.entities.HealthFormSubmission.filter({ patient_email: patientEmail, doctor_email: user?.email }),
    initialData: [],
  });

  const { data: tasks } = useQuery({
    queryKey: ['patient-tasks', patientEmail],
    queryFn: () => apiClient.entities.MedicationTask.filter({ patient_email: patientEmail, doctor_email: user?.email }),
    initialData: [],
  });

  const { data: appointments } = useQuery({
    queryKey: ['patient-appointments', patientEmail],
    queryFn: () => apiClient.entities.Appointment.filter({ patient_email: patientEmail, doctor_email: user?.email }),
    initialData: [],
  });
 
  const { data: connections } = useQuery({
    queryKey: ['patient-connections', patientEmail],
    queryFn: () => apiClient.entities.ConnectionRequest.filter({ patient_email: patientEmail, doctor_email: user?.email }),
    initialData: [],
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
      patient_email: patientEmail,
      patient_name: patient?.full_name || '',
      doctor_email: user.email,
      completed_dates: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-tasks'] });
      setMedDialog(false);
      setMedForm({ medication_name: '', type: 'tablet', dosage: '', start_date: '', end_date: '', frequency: 'once_daily' });
      toast.success('Medication assigned');
    },
  });

  const createForm = useMutation({
    mutationFn: (data) => apiClient.entities.HealthForm.create({
      ...data,
      doctor_email: user.email,
      patient_email: patientEmail,
      active: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-forms'] });
      setFormDialog(false);
      setNewForm({ title: '', questions: [] });
      toast.success('Health form created');
    },
  });

  const disconnectPatient = useMutation({
    mutationFn: async () => {
      const conn = connections.find(c => c.status === 'accepted');
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
    <div>
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
          <TabsTrigger value="medications"><Pill className="w-4 h-4 mr-1" /> Medications ({tasks.length})</TabsTrigger>
          <TabsTrigger value="appointments"><Calendar className="w-4 h-4 mr-1" /> Appointments ({appointments.length})</TabsTrigger>
          <TabsTrigger value="diary"><BookOpen className="w-4 h-4 mr-1" /> Diary ({diaryEntries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="mt-4 space-y-3">
          {submissions.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No form submissions yet</p>
          ) : (
            [...submissions].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(sub => (
              <Card key={sub.id}>
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
            ))
          )}
        </TabsContent>

        <TabsContent value="medications" className="mt-4 space-y-4">
          {tasks.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No medications assigned yet</p>
          ) : (
            tasks.map(task => {
              const allDays = eachDayOfInterval({
                start: parseISO(task.start_date),
                end: parseISO(task.end_date),
              });
              const takenSet = new Set(task.completed_dates || []);
              const takenCount = (task.completed_dates || []).length;
              const adherencePct = allDays.length > 0 ? Math.round((takenCount / allDays.length) * 100) : 0;

              return (
                <Card key={task.id}>
                  <CardContent className="p-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <Pill className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{task.medication_name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <Badge variant="secondary" className="text-xs">{task.type}</Badge>
                          {task.dosage && <Badge variant="outline" className="text-xs">{task.dosage}</Badge>}
                          <Badge variant="outline" className="text-xs">{task.frequency?.replace(/_/g, ' ')}</Badge>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground shrink-0">
                        <p>{task.start_date} — {task.end_date}</p>
                        <p className={`font-semibold mt-0.5 ${adherencePct >= 80 ? 'text-green-600' : adherencePct >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {takenCount}/{allDays.length} days · {adherencePct}%
                        </p>
                      </div>
                    </div>

                    {/* Adherence timeline */}
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Adherence</p>
                      <div className="flex flex-wrap gap-1">
                        {allDays.map(day => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const taken = takenSet.has(dateStr);
                          const upcoming = isFuture(startOfDay(day)) && !isToday(day);
                          return (
                            <div
                              key={dateStr}
                              title={`${format(day, 'EEE MMM d')} — ${taken ? 'Taken' : upcoming ? 'Upcoming' : 'Missed'}`}
                              className={`w-6 h-6 rounded-sm flex items-center justify-center text-[9px] font-bold select-none ${
                                taken
                                  ? 'bg-green-500 text-white'
                                  : upcoming
                                  ? 'bg-muted text-muted-foreground/40'
                                  : 'bg-red-100 text-red-400'
                              }`}
                            >
                              {format(day, 'd')}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />Taken</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-100 inline-block" />Missed</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-muted inline-block" />Upcoming</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="appointments" className="mt-4 space-y-3">
          {appointments.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No appointments yet</p>
          ) : (
            [...appointments].sort((a, b) => new Date(b.date) - new Date(a.date)).map(apt => (
              <Card key={apt.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">{format(parseISO(apt.date), 'MMM')}</span>
                    <span className="text-sm font-bold text-primary leading-none">{format(parseISO(apt.date), 'd')}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{apt.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {apt.time_slot}</p>
                  </div>
                  <Badge variant={apt.status === 'upcoming' ? 'default' : apt.status === 'completed' ? 'secondary' : 'destructive'}>
                    {apt.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
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
              {diaryEntries.map(entry => {
                const mood = getMood(entry.mood_score);
                return (
                  <Card key={entry.id}>
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
    </div>
  );
}