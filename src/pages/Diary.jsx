import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, subDays, isToday, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Pencil, CheckCircle2, Calendar, TrendingUp, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ─── Mood Config ────────────────────────────────────────────────────────────
const MOODS = [
  { value: 1, emoji: '😞', label: 'Rough',    color: '#ef4444', bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600'    },
  { value: 2, emoji: '😕', label: 'Low',      color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
  { value: 3, emoji: '😐', label: 'Okay',     color: '#eab308', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' },
  { value: 4, emoji: '🙂', label: 'Good',     color: '#84cc16', bg: 'bg-lime-50',   border: 'border-lime-200',   text: 'text-lime-600'   },
  { value: 5, emoji: '😄', label: 'Great',    color: '#22c55e', bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-600'  },
];

const getMood = (value) => MOODS.find(m => m.value === value) || MOODS[2];

// ─── Mini Mood Bar Chart ─────────────────────────────────────────────────────
function MoodChart({ entries }) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = entries.find(e => e.date === dateStr);
    return { date, dateStr, mood: entry?.mood_score ?? null };
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
              style={{
                height: mood ? `${(mood / 5) * 36}px` : '4px',
                backgroundColor: m ? m.color : '#e2e8f0',
                originY: 1,
              }}
              className="w-full rounded-t-sm"
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

// ─── AI Summary Dialog (Doctor View) ────────────────────────────────────────
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

      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
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

Be concise, clinical, and helpful. Format with clear sections.`
          }],
        })
      })
        .then(r => r.json())
        .then(data => {
          const text = data.content?.find(b => b.type === 'text')?.text || 'Unable to generate summary.';
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
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
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={() => onEdit(entry)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
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

  const [selectedMood, setSelectedMood] = useState(null);
  const [notes, setNotes] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // ── Fetch diary entries ──────────────────────────────────────────────────
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['diary-entries', user?.email],
    queryFn: async () => {
      const all = await apiClient.entities.DiaryEntry.filter();
      return all
        .filter(e => e.patient_email === user?.email)
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled: !!user?.email,
  });

  const todayEntry = entries.find(e => e.date === todayStr);

  // Pre-fill form if today's entry exists
  useEffect(() => {
    if (todayEntry && !submitted) {
      setSelectedMood(todayEntry.mood_score);
      setNotes(todayEntry.notes || '');
    }
  }, [todayEntry]);

  // ── Save / Update mutation ────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async ({ mood, text, entryId }) => {
      const payload = {
        patient_email: user.email,
        patient_name: user.full_name,
        date: entryId ? editingEntry.date : todayStr,
        mood_score: mood,
        notes: text,
      };
      if (entryId) {
        await apiClient.entities.DiaryEntry.update(entryId, payload);
      } else {
        await apiClient.entities.DiaryEntry.create(payload);
      }
    },
    onSuccess: (_, { entryId }) => {
      queryClient.invalidateQueries({ queryKey: ['diary-entries'] });
      toast.success(entryId ? 'Entry updated' : 'Diary entry saved');
      setSubmitted(true);
      setEditingEntry(null);
    },
    onError: () => toast.error('Something went wrong. Please try again.'),
  });

  const handleSubmit = () => {
    if (!selectedMood) return;
    saveMutation.mutate({
      mood: selectedMood,
      text: notes,
      entryId: todayEntry?.id ?? null,
    });
  };

  const handleEditSave = () => {
    if (!selectedMood || !editingEntry) return;
    saveMutation.mutate({ mood: selectedMood, text: notes, entryId: editingEntry.id });
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setSelectedMood(entry.mood_score);
    setNotes(entry.notes || '');
  };

  const isDoctor = user?.role === 'doctor' || user?.user_type === 'doctor';

  // ── Doctor view ──────────────────────────────────────────────────────────
  if (isDoctor) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading">Patient Diaries</h1>
            <p className="text-sm text-muted-foreground">Patient-reported mood & wellbeing entries</p>
          </div>
          <Button onClick={() => setShowSummary(true)} className="gap-2 rounded-full" size="sm">
            <Sparkles className="w-4 h-4" />
            AI Summary
          </Button>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No diary entries yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(e => <EntryCard key={e.id} entry={e} onEdit={() => {}} />)}
          </div>
        )}

        <AISummaryDialog
          open={showSummary}
          onClose={() => setShowSummary(false)}
          entries={entries}
          patientName={user?.full_name || 'Patient'}
        />
      </div>
    );
  }

  // ── Patient view ──────────────────────────────────────────────────────────
  const avgMood = entries.length > 0
    ? (entries.slice(0, 7).reduce((s, e) => s + e.mood_score, 0) / Math.min(entries.length, 7)).toFixed(1)
    : null;

  return (
    <div className="max-w-xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-violet-500" />
          My Diary
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">How are you feeling today?</p>
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
          <MoodChart entries={entries} />
        </div>
      )}

      {/* Today's Entry Form */}
      <AnimatePresence mode="wait">
        {submitted && todayEntry && !editingEntry ? (
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
                onClick={() => { setSubmitted(false); setSelectedMood(todayEntry.mood_score); setNotes(todayEntry.notes || ''); }}
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
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border bg-card p-5 space-y-5 shadow-sm"
          >
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                {editingEntry
                  ? `Editing — ${format(parseISO(editingEntry.date), 'EEEE, MMM d')}`
                  : `${format(new Date(), 'EEEE, MMMM d')}`}
              </p>

              {/* Mood Selector */}
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map((mood) => (
                  <motion.button
                    key={mood.value}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedMood(mood.value)}
                    className={`
                      flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all duration-150
                      ${selectedMood === mood.value
                        ? `${mood.bg} ${mood.border} shadow-sm`
                        : 'border-border bg-muted/30 hover:bg-muted/60'}
                    `}
                  >
                    <span className="text-2xl leading-none">{mood.emoji}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${selectedMood === mood.value ? mood.text : 'text-muted-foreground'}`}>
                      {mood.label}
                    </span>
                    {selectedMood === mood.value && (
                      <motion.div
                        layoutId="mood-indicator"
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: mood.color }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Notes <span className="font-normal normal-case">(optional)</span>
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How are you feeling? Any symptoms, thoughts, or things you'd like your doctor to know…"
                className="min-h-[100px] text-sm resize-none rounded-lg border-border/60 focus:border-violet-300 focus:ring-violet-100"
                maxLength={1000}
              />
              <p className="text-[10px] text-muted-foreground text-right">{notes.length}/1000</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              {editingEntry && (
                <Button
                  variant="outline"
                  className="rounded-full flex-1"
                  onClick={() => { setEditingEntry(null); setSelectedMood(todayEntry?.mood_score ?? null); setNotes(todayEntry?.notes || ''); }}
                >
                  Cancel
                </Button>
              )}
              <Button
                className="rounded-full flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                disabled={!selectedMood || saveMutation.isPending}
                onClick={editingEntry ? handleEditSave : handleSubmit}
              >
                {saveMutation.isPending ? 'Saving…' : editingEntry ? 'Save Changes' : todayEntry ? 'Update Entry' : 'Save Entry'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past Entries */}
      {entries.filter(e => e.date !== todayStr).length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Previous entries
          </p>
          <div className="space-y-2">
            {entries
              .filter(e => e.date !== todayStr)
              .map(entry => (
                <EntryCard key={entry.id} entry={entry} onEdit={openEdit} />
              ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !isLoading && (
        <div className="text-center py-10 text-muted-foreground">
          <span className="text-4xl block mb-3">📓</span>
          <p className="text-sm">No entries yet — start by logging how you feel today.</p>
        </div>
      )}

      {/* Edit Past Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
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
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes…"
              className="min-h-[90px] text-sm resize-none"
              maxLength={1000}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingEntry(null)}>Cancel</Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              disabled={!selectedMood || saveMutation.isPending}
              onClick={handleEditSave}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}