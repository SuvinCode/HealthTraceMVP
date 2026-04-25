import { useState, useRef } from 'react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Mic, MicOff, PenLine, Plus, User, Stethoscope,
  Trash2, ChevronDown, ChevronRight, NotebookPen, Volume2,
} from 'lucide-react';

// ─── Medical vocabulary ───────────────────────────────────────────────────────
const MEDICAL_TERMS = {
  Symptoms: [
    'dyspnea', 'tachycardia', 'bradycardia', 'hypertension', 'hypotension',
    'arrhythmia', 'palpitations', 'syncope', 'diaphoresis', 'edema',
    'cyanosis', 'pallor', 'jaundice', 'pruritus', 'erythema',
    'hematemesis', 'melena', 'hematuria', 'proteinuria', 'oliguria',
  ],
  Diagnoses: [
    'myocardial infarction', 'angina pectoris', 'heart failure', 'atrial fibrillation',
    'pulmonary embolism', 'deep vein thrombosis', 'pneumonia', 'COPD', 'asthma',
    'diabetes mellitus', 'hypothyroidism', 'hyperlipidemia', 'anaemia',
    'stroke', 'TIA', 'migraine', 'seizure', 'appendicitis', 'cholecystitis',
    'pancreatitis', "Crohn's disease", 'ulcerative colitis', 'renal failure',
  ],
  Medications: [
    'metformin', 'lisinopril', 'atorvastatin', 'amlodipine', 'omeprazole',
    'metoprolol', 'losartan', 'albuterol', 'prednisone', 'amoxicillin',
    'warfarin', 'aspirin', 'clopidogrel', 'furosemide', 'spironolactone',
    'levothyroxine', 'insulin', 'gabapentin', 'sertraline', 'quetiapine',
  ],
  Clinical: [
    'c/o', 'Hx', 'Dx', 'Rx', 'PRN', 'QID', 'TID', 'BID', 'QD', 'NPO',
    'SOB', 'O/E', 'BP', 'HR', 'RR', 'SpO2', 'BMI', 'GCS', 'AVPU',
  ],
};


// ─── Term chip with cursor-aware insert ──────────────────────────────────────
function TermChip({ term, textareaRef, onInsert }) {
  return (
    <button
      type="button"
      onClick={() => {
        const el = textareaRef?.current;
        if (el) {
          const start = el.selectionStart;
          const end = el.selectionEnd;
          const val = el.value;
          const newVal = val.slice(0, start) + term + ' ' + val.slice(end);
          onInsert(newVal);
          // restore cursor after React re-render
          requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = start + term.length + 1;
            el.focus();
          });
        } else {
          onInsert(prev => prev ? prev + ' ' + term : term);
        }
      }}
      className="px-2 py-0.5 text-[10px] font-medium rounded-full border border-border bg-muted/60 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors whitespace-nowrap"
    >
      {term}
    </button>
  );
}

// ─── Note card ────────────────────────────────────────────────────────────────
function NoteCard({ note, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
    >
      <Card className="group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] gap-1">
                  {note.input_type === 'voice' ? <Mic className="w-2.5 h-2.5" /> : <PenLine className="w-2.5 h-2.5" />}
                  {note.input_type}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {format(new Date(note.created_at), 'MMM d, yyyy · h:mm a')}
                </span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{note.content}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => onDelete(note.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Collapsible patient group ────────────────────────────────────────────────
function PatientGroup({ patientName, patientEmail, notes, onDelete }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full text-left py-2 hover:text-primary transition-colors group"
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">{patientName?.[0]?.toUpperCase() || 'P'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold">{patientName}</span>
          <span className="text-xs text-muted-foreground ml-2">{patientEmail}</span>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">{notes.length}</Badge>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pl-9 space-y-2 mt-1"
          >
            {notes.map(n => <NoteCard key={n.id} note={n} onDelete={onDelete} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── New Note Dialog ──────────────────────────────────────────────────────────
function NewNoteDialog({ open, onClose, connections, doctorEmail, onSaved }) {
  const [inputType, setInputType] = useState('written');
  const [content, setContent] = useState('');
  const [patientEmail, setPatientEmail] = useState('none');
  const [activeMedCategory, setActiveMedCategory] = useState('Symptoms');
  const textareaRef = useRef(null);

  // Voice recording state — MediaRecorder → Whisper API
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          setMicError('Add VITE_OPENAI_API_KEY to your .env file to enable voice transcription (OpenAI Whisper).');
          return;
        }

        setIsTranscribing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const file = new File([blob], 'recording.webm', { type: mimeType });
          const form = new FormData();
          form.append('file', file);
          form.append('model', 'whisper-1');

          const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}` },
            body: form,
          });
          if (!res.ok) throw new Error(`Whisper error ${res.status}`);
          const { text } = await res.json();
          setContent(prev => prev ? `${prev} ${text}` : text);
        } catch (err) {
          setMicError(`Transcription failed: ${err.message}`);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setMicError('Microphone access denied. Allow microphone access in your browser and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const reset = () => {
    setContent('');
    setPatientEmail('none');
    setInputType('written');
    setMicError(null);
    if (isRecording) stopRecording();
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!content.trim()) { toast.error('Note content is required'); return; }
    const conn = connections.find(c => c.patient_email === patientEmail);
    await onSaved({
      doctor_email: doctorEmail,
      patient_email: patientEmail === 'none' ? null : patientEmail,
      patient_name: conn?.patient_name || null,
      content: content.trim(),
      input_type: inputType,
      created_at: new Date().toISOString(),
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-primary" />
            New Note
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Patient selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Patient <span className="font-normal normal-case">(optional)</span>
            </label>
            <Select value={patientEmail} onValueChange={setPatientEmail}>
              <SelectTrigger>
                <SelectValue placeholder="General note (no patient)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General note (no patient)</SelectItem>
                {connections.map(c => (
                  <SelectItem key={c.patient_email} value={c.patient_email}>
                    {c.patient_name} — {c.patient_email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Input type toggle */}
          <div className="flex rounded-xl border overflow-hidden">
            {[
              { value: 'written', icon: PenLine, label: 'Written' },
              { value: 'voice', icon: Mic, label: 'Voice' },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setInputType(value); if (isRecording) stopRecording(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                  inputType === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Medical term chips */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quick insert:</span>
              {Object.keys(MEDICAL_TERMS).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveMedCategory(cat)}
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full transition-colors ${
                    activeMedCategory === cat
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {MEDICAL_TERMS[activeMedCategory].map(term => (
                <TermChip
                  key={term}
                  term={term}
                  textareaRef={inputType === 'written' ? textareaRef : null}
                  onInsert={(val) => setContent(typeof val === 'function' ? val(content) : val)}
                />
              ))}
            </div>
          </div>

          {/* Content area */}
          {inputType === 'written' ? (
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start typing your note…"
              className="min-h-[140px] text-sm resize-none"
            />
          ) : (
            <div className="space-y-3">
              {micError && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-3">{micError}</p>
              )}

              {/* Transcript area — editable after transcription */}
              <div className="relative">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={isTranscribing ? '' : 'Transcript will appear here after you stop recording…'}
                  className="min-h-[120px] text-sm resize-none"
                  disabled={isRecording || isTranscribing}
                />
                {isTranscribing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/60 rounded-md">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
                      Transcribing…
                    </div>
                  </div>
                )}
              </div>

              {/* Mic button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isTranscribing}
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                      : 'bg-primary text-primary-foreground hover:opacity-90'
                  } disabled:opacity-40`}
                >
                  {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  {isRecording && (
                    <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40" />
                  )}
                </button>
                <div className="text-sm text-muted-foreground">
                  {isRecording ? (
                    <span className="text-red-500 font-medium flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4" /> Recording… click to stop
                    </span>
                  ) : (
                    <span>
                      Click the mic to record.{' '}
                      <span className="text-xs">You can record multiple clips — they'll be appended.</span>
                    </span>
                  )}
                </div>
                {content && !isRecording && !isTranscribing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setContent('')}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!content.trim()}>Save Note</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Notes page ──────────────────────────────────────────────────────────
export default function Notes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: connections = [] } = useQuery({
    queryKey: ['doctor-connections', user?.email],
    queryFn: () => apiClient.entities.ConnectionRequest.filter({ doctor_email: user?.email, status: 'accepted' }),
    enabled: !!user?.email,
  });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['doctor-notes', user?.email],
    queryFn: async () => {
      const all = await apiClient.entities.DoctorNote.filter();
      return all
        .filter(n => n.doctor_email === user?.email)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    enabled: !!user?.email,
  });

  const createNote = useMutation({
    mutationFn: (data) => apiClient.entities.DoctorNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-notes'] });
      toast.success('Note saved');
    },
    onError: () => toast.error('Failed to save note'),
  });

  const deleteNote = useMutation({
    mutationFn: (id) => apiClient.entities.DoctorNote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-notes'] });
      toast.success('Note deleted');
    },
  });

  const myNotes = notes.filter(n => !n.patient_email);
  const patientNotes = notes.filter(n => !!n.patient_email);

  // Group patient notes by patient
  const byPatient = patientNotes.reduce((acc, note) => {
    const key = note.patient_email;
    if (!acc[key]) acc[key] = { name: note.patient_name, email: note.patient_email, notes: [] };
    acc[key].notes.push(note);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <NotebookPen className="w-6 h-6 text-primary" />
            Notes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Written and transcribed clinical notes</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Note
        </Button>
      </div>

      {/* ── My Notes ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">My Notes</h2>
          <Badge variant="secondary" className="text-xs">{myNotes.length}</Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : myNotes.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl">
            <NotebookPen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No general notes yet</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {myNotes.map(n => (
                <NoteCard key={n.id} note={n} onDelete={(id) => deleteNote.mutate(id)} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </section>

      {/* ── Patient Notes ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient Notes</h2>
          <Badge variant="secondary" className="text-xs">{patientNotes.length}</Badge>
        </div>

        {Object.keys(byPatient).length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl">
            <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No patient-specific notes yet</p>
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-border">
            {Object.values(byPatient).map(group => (
              <PatientGroup
                key={group.email}
                patientName={group.name}
                patientEmail={group.email}
                notes={group.notes}
                onDelete={(id) => deleteNote.mutate(id)}
              />
            ))}
          </div>
        )}
      </section>

      <NewNoteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        connections={connections}
        doctorEmail={user?.email}
        onSaved={(data) => createNote.mutateAsync(data)}
      />
    </div>
  );
}
