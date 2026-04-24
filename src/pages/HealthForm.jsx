import { useMemo, useState } from 'react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Loader2, Clock, CheckCircle2, Stethoscope, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

export default function HealthForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [editingSub, setEditingSub] = useState(null);

  const { data: connections } = useQuery({
    queryKey: ['my-connections', user?.email],
    queryFn: async () => {
      const allConnections = await apiClient.entities.ConnectionRequest.filter();
      return allConnections.filter((connection) => {
        const status = String(connection.status || '').toLowerCase();
        const byEmail = connection.patient_email === user?.email;
        const byName = connection.patient_name === user?.full_name;
        return status === 'accepted' && (byEmail || byName);
      });
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const connectedDoctors = useMemo(() => {
    const uniqueDoctors = new Map();
    connections.forEach((connection) => {
      if (!connection.doctor_email) return;
      if (!uniqueDoctors.has(connection.doctor_email)) {
        uniqueDoctors.set(connection.doctor_email, {
          email: connection.doctor_email,
          name: connection.doctor_name || connection.doctor_email,
        });
      }
    });
    return Array.from(uniqueDoctors.values());
  }, [connections]);

  const doctorEmails = connectedDoctors.map(d => d.email);

  const { data: submissions } = useQuery({
    queryKey: ['my-submissions', user?.email],
    queryFn: async () => {
      const allSubmissions = await apiClient.entities.HealthFormSubmission.filter();
      return allSubmissions.filter((submission) => {
        const byEmail = submission.patient_email === user?.email;
        const byName = submission.patient_name === user?.full_name;
        return byEmail || byName;
      });
    },
    enabled: !!user?.email,
    initialData: [],
  });


  const { data: forms, isLoading } = useQuery({
    queryKey: ['health-forms', doctorEmails, submissions],
    queryFn: async () => {
      if (doctorEmails.length === 0) return [];
      const allForms = [];
      for (const email of doctorEmails) {
        const f = await apiClient.entities.HealthForm.filter({ doctor_email: email, active: true });
        allForms.push(...f);
      }
      const existingSubIds = submissions.map(s => s.form_id);
      return allForms.filter(f => (!f.patient_email || f.patient_email === user.email) && !existingSubIds.includes(f.id));
    },
    enabled: doctorEmails.length > 0,
    initialData: [],
  });

  const handleSubmit = async (form, isEdit = false, subId = null) => {
    setSubmitting(true);
    const formAnswers = form.questions.map(q => ({
      question_id: q.id,
      question_label: q.label,
      answer: String(answers[q.id] || ''),
    }));

    if (isEdit && subId) {
      await apiClient.entities.HealthFormSubmission.update(subId, {
        answers: formAnswers,
        updated_date: new Date().toISOString(),
      });
      toast.success('Submission updated!');
      setEditingSub(null);
    } else {
      await apiClient.entities.HealthFormSubmission.create({
        form_id: form.id,
        form_title: form.title,
        patient_email: user.email,
        patient_name: user.full_name,
        doctor_email: form.doctor_email,
        answers: formAnswers,
        created_date: new Date().toISOString(),
      });
      toast.success('Form submitted successfully!');
    }

    setAnswers({});
    queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
    queryClient.invalidateQueries({ queryKey: ['health-forms'] });
    setSubmitting(false);
  };

  const openEdit = (sub) => {
    const initialAnswers = {};
    sub.answers.forEach(a => {
      initialAnswers[a.question_id] = a.answer;
    });
    setAnswers(initialAnswers);
    setEditingSub(sub);
  };

  const renderQuestion = (q) => {
    const key = q.id;
    switch (q.type) {
      case 'textarea':
        return <Textarea placeholder="Your answer..." value={answers[key] || ''} onChange={e => setAnswers(p => ({ ...p, [key]: e.target.value }))} />;
      case 'number':
        return <Input type="number" placeholder="0" value={answers[key] || ''} onChange={e => setAnswers(p => ({ ...p, [key]: e.target.value }))} />;
      case 'select':
        return (
          <Select value={answers[key] || ''} onValueChange={v => setAnswers(p => ({ ...p, [key]: v }))}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {q.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch checked={answers[key] === 'true'} onCheckedChange={v => setAnswers(p => ({ ...p, [key]: String(v) }))} />
            <span className="text-sm text-muted-foreground">{answers[key] === 'true' ? 'Yes' : 'No'}</span>
          </div>
        );
      default:
        return <Input placeholder="Your answer..." value={answers[key] || ''} onChange={e => setAnswers(p => ({ ...p, [key]: e.target.value }))} />;
    }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Health Forms</h1>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <Tabs defaultValue="forms">
        <TabsList>
          <TabsTrigger value="forms"><FileText className="w-4 h-4 mr-1.5" /> Active Forms</TabsTrigger>
          <TabsTrigger value="history"><Clock className="w-4 h-4 mr-1.5" /> Submission History</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="mt-4 space-y-4">
          {forms.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No new forms available. Check history to edit past submissions.</p>
            </div>
          ) : (
            forms.map((form, i) => (
              <motion.div key={form.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">{form.title}</CardTitle>
                    <CardDescription>From your doctor</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {form.questions?.map(q => (
                      <div key={q.id}>
                        <Label className="mb-1.5 block">
                          {q.label} {q.required && <span className="text-destructive">*</span>}
                        </Label>
                        {renderQuestion(q)}
                      </div>
                    ))}
                    <Button onClick={() => handleSubmit(form)} disabled={submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Submit Form
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {submissions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No submissions yet</div>
          ) : (
            [...submissions].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(sub => (
              <Card key={sub.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => openEdit(sub)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="font-medium">{sub.form_title}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {sub.created_date ? format(new Date(sub.created_date), 'MMM d, yyyy h:mm a') : 'Recently submitted'}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {sub.answers?.slice(0, 2).map((a, i) => (
                      <div key={i} className="text-sm truncate">
                        <span className="text-muted-foreground">{a.question_label}: </span>
                        <span className="text-foreground font-medium">{a.answer || '—'}</span>
                      </div>
                    ))}
                    {sub.answers?.length > 2 && <p className="text-[10px] text-muted-foreground italic">Click to see {sub.answers.length - 2} more...</p>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                Doctors Connected To
              </CardTitle>
              <CardDescription>
                Doctors currently linked to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {connectedDoctors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No connected doctors yet.</p>
              ) : (
                connectedDoctors.map((doctor) => (
                  <div key={doctor.email} className="rounded-lg border p-3 bg-card/50">
                    <p className="text-sm font-semibold text-foreground">{doctor.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Mail className="w-3 h-3" />
                      {doctor.email}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </aside>
      </div>

      {/* Edit Submission Dialog */}
      <Dialog open={!!editingSub} onOpenChange={(open) => !open && setEditingSub(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Submission: {editingSub?.form_title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {editingSub && (
              // Note: We need the original form definition to get the question types
              // For simplicity in this mock, we assume the sub answers are enough or we fetch form
              // Since we don't have the full form objects for history without extra queries,
              // we'll use a simplified list in the edit dialog or just the questions from the answers.
              editingSub.answers.map((a, i) => (
                <div key={i} className="space-y-2">
                  <Label>{a.question_label}</Label>
                  <Input 
                    value={answers[a.question_id] || ''} 
                    onChange={e => setAnswers(p => ({ ...p, [a.question_id]: e.target.value }))} 
                  />
                </div>
              ))
            )}
            <div className="flex gap-2">
              <Button onClick={() => handleSubmit({ id: editingSub.form_id, questions: editingSub.answers.map(a => ({ id: a.question_id, label: a.question_label })) }, true, editingSub.id)} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
              <Button variant="ghost" onClick={() => setEditingSub(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}