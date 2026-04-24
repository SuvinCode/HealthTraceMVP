import { useState } from 'react';
import { base44 } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

export default function HealthForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { data: connections } = useQuery({
    queryKey: ['my-connections', user?.email],
    queryFn: () => base44.entities.ConnectionRequest.filter({ patient_email: user?.email, status: 'accepted' }),
    initialData: [],
  });

  const doctorEmails = connections.map(c => c.doctor_email);

  const { data: forms, isLoading } = useQuery({
    queryKey: ['health-forms', doctorEmails],
    queryFn: async () => {
      if (doctorEmails.length === 0) return [];
      const allForms = [];
      for (const email of doctorEmails) {
        const f = await base44.entities.HealthForm.filter({ doctor_email: email, active: true });
        allForms.push(...f);
      }
      return allForms.filter(f => !f.patient_email || f.patient_email === user.email);
    },
    enabled: doctorEmails.length > 0,
    initialData: [],
  });

  const { data: submissions } = useQuery({
    queryKey: ['my-submissions', user?.email],
    queryFn: () => base44.entities.HealthFormSubmission.filter({ patient_email: user?.email }),
    initialData: [],
  });

  const handleSubmit = async (form) => {
    setSubmitting(true);
    const formAnswers = form.questions.map(q => ({
      question_id: q.id,
      question_label: q.label,
      answer: String(answers[q.id] || ''),
    }));
    await base44.entities.HealthFormSubmission.create({
      form_id: form.id,
      form_title: form.title,
      patient_email: user.email,
      patient_name: user.full_name,
      doctor_email: form.doctor_email,
      answers: formAnswers,
    });
    setAnswers({});
    queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
    toast.success('Form submitted successfully!');
    setSubmitting(false);
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
      <Tabs defaultValue="forms">
        <TabsList>
          <TabsTrigger value="forms"><FileText className="w-4 h-4 mr-1.5" /> Active Forms</TabsTrigger>
          <TabsTrigger value="history"><Clock className="w-4 h-4 mr-1.5" /> Submission History</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="mt-4 space-y-4">
          {forms.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No forms available yet. Your doctor will add forms for you to fill out.</p>
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
              <Card key={sub.id} className="opacity-90">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="font-medium">{sub.form_title}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {format(new Date(sub.created_date), 'MMM d, yyyy h:mm a')}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {sub.answers?.map((a, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-muted-foreground">{a.question_label}: </span>
                        <span className="text-foreground font-medium">{a.answer || '—'}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}