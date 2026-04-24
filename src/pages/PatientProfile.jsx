import { useState } from 'react';
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
import { User, FileText, Pill, Calendar, Plus, ArrowLeft, Loader2, Clock, CheckCircle2, Ruler, Weight, Heart } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function PatientProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const patientEmail = decodeURIComponent(window.location.pathname.split('/patient/')[1]);

  const [medForm, setMedForm] = useState({
    medication_name: '', type: 'tablet', dosage: '', start_date: '', end_date: '', frequency: 'once_daily'
  });
  const [formDialog, setFormDialog] = useState(false);
  const [medDialog, setMedDialog] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', questions: [] });
  const [newQ, setNewQ] = useState({ label: '', type: 'text', required: false, options: '' });

  // Queries
  const { data: patients } = useQuery({
    queryKey: ['patient-user', patientEmail],
    queryFn: () => apiClient.entities.User.filter({ email: patientEmail }),
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
          <div className="flex gap-2">
            <Dialog open={medDialog} onOpenChange={setMedDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><Pill className="w-4 h-4 mr-1" /> Assign Medication</Button>
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
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions"><FileText className="w-4 h-4 mr-1" /> Forms ({submissions.length})</TabsTrigger>
          <TabsTrigger value="medications"><Pill className="w-4 h-4 mr-1" /> Medications ({tasks.length})</TabsTrigger>
          <TabsTrigger value="appointments"><Calendar className="w-4 h-4 mr-1" /> Appointments ({appointments.length})</TabsTrigger>
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

        <TabsContent value="medications" className="mt-4 space-y-3">
          {tasks.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No medications assigned yet</p>
          ) : (
            tasks.map(task => (
              <Card key={task.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Pill className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{task.medication_name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge variant="secondary" className="text-xs">{task.type}</Badge>
                      {task.dosage && <Badge variant="outline" className="text-xs">{task.dosage}</Badge>}
                      <Badge variant="outline" className="text-xs">{task.frequency?.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{task.start_date} — {task.end_date}</p>
                    <p>{task.completed_dates?.length || 0} days completed</p>
                  </div>
                </CardContent>
              </Card>
            ))
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
      </Tabs>
    </div>
  );
}