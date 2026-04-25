import { useState, useEffect, useRef } from 'react';
import { apiClient, cleanEmail } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, subDays, isToday, eachDayOfInterval, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles, Pencil, CheckCircle2, Calendar, TrendingUp, Users, Mic, MicOff, Volume2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

// ─── Mood Config ────────────────────────────────────────────────────────────
const MOODS = [
  { value: 1, emoji: '😞', label: 'Rough', color: '#ef4444', bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600'    },
  { value: 2, emoji: '😕', label: 'Low',   color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
  { value: 3, emoji: '😐', label: 'Okay',  color: '#eab308', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' },
  { value: 4, emoji: '🙂', label: 'Good',  color: '#84cc16', bg: 'bg-lime-50',   border: 'border-lime-200',   text: 'text-lime-600'   },
  { value: 5, emoji: '😄', label: 'Great', color: '#22c55e', bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-600'  },
];

const getMood = (value) => MOODS.find(m => m.value === value) || MOODS[2];

// ─── Mini Mood Bar Chart ─────────────────────────────────────────────────────
function MoodChart({ entries, onDateSelect }) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = entries.find(e => e.date === dateStr);
    return { date, dateStr, mood: entry?.mood_score ?? null };
  });

  return (
    <div className="flex items-end gap-1.5 h-12">
      {last7.map(({ date, dateStr, mood }, i) => {
        const m = mood ? getMood(mood) : null;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <motion.button
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDateSelect?.(dateStr)}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
              style={{
                height: mood ? `${(mood / 5) * 36}px` : '4px',
                backgroundColor: m ? m.color : '#e2e8f0',
                originY: 1,
              }}
              className="w-full rounded-t-sm cursor-pointer"
              title={mood ? `Mood: ${m.label} on ${format(date, 'MMM d')}` : `No entry for ${format(date, 'MMM d')}`}
            />
            <span className="text-[9px] text-muted-foreground font-medium">
              {format(date, 'EEE')[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── AI Summary Dialog ───────────────────────────────────────────────────────
function AISummaryDialog({ open, onClose, entries, patientName }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && entries.length > 0) {
      setLoading(true);
      setSummary('');
      const recentEntries = entries.slice(0, 14).map(e => ({
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
${JSON.stringify(recentEntries, null, 2)}

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
        .then(data => {
          const text = data.choices?.[0]?.message?.content || 'Unable to generate summary.';
          setSummary(text);
        })
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
            <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
              {summary}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Single Entry Card ───────────────────────────────────────────────────────
function EntryCard({ entry, onEdit }) {
  const mood = getMood(entry.mood_score);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-xl border p-4 ${mood.bg} ${mood.border} group relative`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{mood.emoji}</span>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {isToday(parseISO(entry.date)) ? 'Today' : format(parseISO(entry.date), 'EEEE, MMM d')}
            </p>
            <p className={`text-sm font-bold ${mood.text}`}>{mood.label}</p>
          </div>
        </div>
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 transition-all shrink-0 hover:bg-black/5 rounded-full"
            onClick={() => onEdit(entry)}
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>
      {entry.notes && (
        <p className="mt-3 text-sm text-foreground/70 leading-relaxed border-t border-current/10 pt-3">
          {entry.notes}
        </p>
      )}
    </motion.div>
  );
}


// ─── Main Diary Component ────────────────────────────────────────────────────
export default function Diary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState('view');
  const [selectedMood, setSelectedMood] = useState(null);
  const [notes, setNotes] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);

  // Voice recording — MediaRecorder → Whisper
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
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) { setMicError('Add VITE_OPENAI_API_KEY to .env for voice transcription.'); return; }
        setIsTranscribing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const form = new FormData();
          form.append('file', new File([blob], 'recording.webm', { type: mimeType }));
          form.append('model', 'whisper-1');
          const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}` },
            body: form,
          });
          if (!res.ok) throw new Error(`Whisper error ${res.status}`);
          const { text } = await res.json();
          setNotes(prev => prev ? `${prev} ${text}` : text);
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
      setMicError('Microphone access denied. Allow microphone access and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const isDoctor = user?.role === 'doctor' || user?.user_type === 'doctor';

  // ── Patient: Fetch own entries (disabled for doctors) ─────────────────────
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['diary-entries', user?.email],
    queryFn: async () => {
      const all = await apiClient.entities.DiaryEntry.filter();
      return all
        .filter(e => cleanEmail(e.patient_email) === cleanEmail(user?.email))
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled: !isDoctor && !!user?.email,
  });

  const todayEntry = entries.find(e => e.date === todayStr);

  useEffect(() => {
    if (isDoctor || isLoading) return;
    if (!todayEntry && mode === 'view') {
      setMode('editing');
      setSelectedMood(null);
      setNotes('');
    }
  }, [isDoctor, isLoading, todayEntry, mode]);



  // ── Mutation ─────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async ({ entryId, mood, text, date }) => {
      const payload = {
        patient_email: user.email,
        patient_name: user.full_name,
        date,
        mood_score: mood,
        notes: text,
      };
      if (entryId) {
        return apiClient.entities.DiaryEntry.update(entryId, payload);
      }
      return apiClient.entities.DiaryEntry.create(payload);
    },
    onSuccess: async (_, vars) => {
      await queryClient.invalidateQueries({ queryKey: ['diary-entries'] });
      toast.success(vars.entryId ? 'Entry updated' : 'Diary entry saved');
      setEditingEntry(null);
      setMode('view');
    },
    onError: () => toast.error('Something went wrong. Please try again.'),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const startEditingToday = () => {
    setSelectedMood(todayEntry?.mood_score ?? null);
    setNotes(todayEntry?.notes ?? '');
    setMode('editing');
  };

  const cancelEditingToday = () => setMode('view');

  const saveToday = () => {
    if (!selectedMood || !user?.email) return;
    saveMutation.mutate({ entryId: todayEntry?.id ?? null, mood: selectedMood, text: notes, date: todayStr });
  };

  const openPastEdit = (entry) => {
    setEditingEntry(entry);
    setSelectedMood(entry.mood_score);
    setNotes(entry.notes || '');
    setMode('editPast');
  };

  const closePastEdit = () => {
    setEditingEntry(null);
    setMode(todayEntry ? 'view' : 'editing');
    if (todayEntry) {
      setSelectedMood(todayEntry.mood_score);
      setNotes(todayEntry.notes || '');
    } else {
      setSelectedMood(null);
      setNotes('');
    }
  };

  const savePastEdit = () => {
    if (!selectedMood || !editingEntry) return;
    saveMutation.mutate({ entryId: editingEntry.id, mood: selectedMood, text: notes, date: editingEntry.date });
  };

  const avgMood = entries.length > 0 
    ? (entries.reduce((s, e) => s + e.mood_score, 0) / entries.length).toFixed(1)
    : null;

  if (isDoctor) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-xl mx-auto py-16 px-4 text-center space-y-6"
      >
         <div className="w-20 h-20 bg-violet-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-violet-300" />
         </div>
         <div className="space-y-2">
            <h2 className="text-xl font-bold font-heading">Patient Diary View</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Diary entries reach you directly via each patient's profile clinical dashboard.
            </p>
         </div>
         <Button asChild variant="outline" className="rounded-full gap-2 h-11 px-6 font-bold shadow-sm hover:shadow-md transition-all">
          <Link to="/patient-logs">
            <Users className="w-4 h-4" />
            View Patient Logs
          </Link>
        </Button>
      </motion.div>
    );
  }

  const showSuccessCard = mode === 'view' && todayEntry;
  const showInlineForm = mode === 'editing';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-xl mx-auto py-6 px-4 space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-violet-500" />
          My Diary
        </h1>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-sm text-muted-foreground">How are you feeling today?</p>
          <Button 
            variant="link" 
            className="h-auto p-0 text-violet-600 text-xs font-bold"
            onClick={() => document.getElementById('previous-entries')?.scrollIntoView({ behavior: 'smooth' })}
          >
            View History ↓
          </Button>
        </div>
      </div>

      {/* 7-day Mood Trend */}
      {entries.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Last 7 days
            </p>
            {avgMood && (
              <Badge variant="outline" className="text-xs font-bold">
                Avg {avgMood} · {getMood(Math.round(parseFloat(avgMood))).label}
              </Badge>
            )}
          </div>
          <MoodChart 
            entries={entries} 
            onDateSelect={(dateStr) => {
              const el = document.getElementById(`entry-${dateStr}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-violet-400', 'ring-offset-2');
                setTimeout(() => el.classList.remove('ring-2', 'ring-violet-400', 'ring-offset-2'), 2000);
              } else if (dateStr === todayStr) {
                document.getElementById('today-section')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                toast.info(`No entry found for ${format(parseISO(dateStr), 'MMM d')}`);
              }
            }}
          />
        </div>
      )}

      {/* Today: success card OR inline form */}
      <div id="today-section">
        <AnimatePresence mode="wait">
        {showSuccessCard ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border bg-green-50 border-green-200 p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="font-semibold text-green-800 text-sm">Today's entry saved</p>
                <p className="text-xs text-green-600">Your doctor can see this information.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto rounded-full text-xs h-7 text-green-700 hover:text-green-900 hover:bg-green-100"
                onClick={startEditingToday}
              >
                <Pencil className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-2xl">{getMood(todayEntry.mood_score).emoji}</span>
              <span className={`text-sm font-bold ${getMood(todayEntry.mood_score).text}`}>
                {getMood(todayEntry.mood_score).label}
              </span>
            </div>
            {todayEntry.notes && (
              <p className="text-sm text-green-800/70 leading-relaxed">{todayEntry.notes}</p>
            )}
          </motion.div>
        ) : showInlineForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border bg-card p-5 space-y-5 shadow-sm"
          >
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                {format(new Date(), 'EEEE, MMMM d')}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map((mood) => (
                  <motion.button
                    key={mood.value}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedMood(mood.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all duration-150 ${
                      selectedMood === mood.value
                        ? `${mood.bg} ${mood.border} shadow-sm`
                        : 'border-border bg-muted/30 hover:bg-muted/60'
                    }`}
                  >
                    <span className="text-2xl leading-none">{mood.emoji}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${selectedMood === mood.value ? mood.text : 'text-muted-foreground'}`}>
                      {mood.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Notes <span className="font-normal normal-case">(optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  {isTranscribing && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <div className="w-3 h-3 border border-muted-foreground border-t-primary rounded-full animate-spin" />
                      Transcribing…
                    </span>
                  )}
                  {isRecording && !isTranscribing && (
                    <span className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> Recording…
                    </span>
                  )}
                  {micError && (
                    <span className="text-[11px] text-destructive max-w-[180px] truncate" title={micError}>{micError}</span>
                  )}
                  <button
                    type="button"
                    disabled={isTranscribing}
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isRecording
                        ? 'bg-red-500 text-white shadow-md shadow-red-200'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    } disabled:opacity-40`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {isRecording && <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />}
                  </button>
                </div>
              </div>
              <div className="relative">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling? Any symptoms, thoughts, or things you'd like your doctor to know…"
                  className="min-h-[100px] text-sm resize-none rounded-lg border-border/60 focus:border-violet-300 focus:ring-violet-100"
                  maxLength={1000}
                  disabled={isRecording || isTranscribing}
                />
                {isTranscribing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
                      Transcribing…
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground text-right">{notes.length}/1000</p>
            </div>

            <div className="flex gap-2 pt-1">
              {todayEntry && (
                <Button variant="outline" className="rounded-full flex-1" onClick={cancelEditingToday}>
                  Cancel
                </Button>
              )}
              <Button
                className="rounded-full flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                disabled={!selectedMood || saveMutation.isPending}
                onClick={saveToday}
              >
                {saveMutation.isPending ? 'Saving…' : todayEntry ? 'Update Entry' : 'Save Entry'}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>

      {/* Past Entries */}
      {entries.filter(e => e.date !== todayStr).length > 0 && (
        <div className="space-y-3">
          <p id="previous-entries" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Previous entries
          </p>
          <div className="space-y-2">
            {entries
              .filter(e => e.date !== todayStr)
              .map(entry => (
                <div key={entry.id} id={`entry-${entry.date}`}>
                  <EntryCard entry={entry} onEdit={openPastEdit} />
                </div>
              ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !isLoading && (
        <div className="text-center py-10 text-muted-foreground">
          <span className="text-4xl block mb-3">{'📓'}</span>
          <p className="text-sm">No entries yet — start by logging how you feel today.</p>
        </div>
      )}

      {/* Edit Past Entry Dialog */}
      <Dialog open={mode === 'editPast'} onOpenChange={(open) => !open && closePastEdit()}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              Edit Entry — {editingEntry ? format(parseISO(editingEntry.date), 'EEEE, MMMM d') : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-5">
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((mood) => (
                <motion.button
                  key={mood.value}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all ${
                    selectedMood === mood.value ? `${mood.bg} ${mood.border} shadow-sm` : 'border-border bg-muted/30'
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${selectedMood === mood.value ? mood.text : 'text-muted-foreground'}`}>
                    {mood.label}
                  </span>
                </motion.button>
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Notes <span className="font-normal normal-case">(optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  {isTranscribing && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <div className="w-3 h-3 border border-muted-foreground border-t-primary rounded-full animate-spin" />
                      Transcribing…
                    </span>
                  )}
                  {isRecording && !isTranscribing && (
                    <span className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> Recording…
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={isTranscribing}
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isRecording
                        ? 'bg-red-500 text-white shadow-md shadow-red-200'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    } disabled:opacity-40`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {isRecording && <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />}
                  </button>
                </div>
              </div>
              <div className="relative">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes…"
                  className="min-h-[90px] text-sm resize-none"
                  maxLength={1000}
                  disabled={isRecording || isTranscribing}
                />
                {isTranscribing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
                      Transcribing…
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closePastEdit}>Cancel</Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              disabled={!selectedMood || saveMutation.isPending}
              onClick={savePastEdit}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
