import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Stethoscope, ArrowRight, Loader2, Smartphone, Check, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Onboarding() {
  const { user, checkUserAuth, logout } = useAuth();
  const navigate = useNavigate();
  // If role was already selected during signup (and it's not the default 'user'), skip to step 2
  const [step, setStep] = useState(user?.role && user.role !== 'user' ? 2 : 1);
  const [role, setRole] = useState(user?.role || 'user');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    age: '', weight: '', height: '',
    medical_license: '', specialisation: ''
  });

  const webhookUrl = `https://api.healthtrace.com/webhook/apple-health?user_email=${user?.email}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const handleField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleBack = async () => {
    if (user?.id) {
      try {
        await apiClient.auth.deleteMe(user.id);
      } catch (err) {
        console.error("Cleanup failed:", err);
      }
    }
    logout();
    navigate('/login');
  };

  const handleSubmit = async (skipAppleHealth = false) => {
    setSaving(true);
    const data = { role, onboarding_complete: true };
    if (role === 'user') {
      data.age = Number(formData.age);
      data.weight = Number(formData.weight);
      data.height = Number(formData.height);
      if (skipAppleHealth !== true) {
        data.apple_health_webhook_url = webhookUrl;
        data.apple_health_connected = true;
      }
    } else {
      data.age = Number(formData.age);
      data.medical_license = formData.medical_license;
      data.specialisation = formData.specialisation;
    }
    
    // 1. Update the user record
    const updatedUser = await apiClient.auth.updateMe(data);
    
    // 2. If patient, add to searchable patients list
    if (role === 'user') {
      await apiClient.entities.patients.create({
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        role: 'user'
      });
    }

    await checkUserAuth();
    navigate(role === 'doctor' ? '/doctor-dashboard' : '/health-form');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-body">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-md">
            <img src="/favicon.svg" alt="HealthTrace Logo" className="w-9 h-9" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Welcome to HealthTrace</h1>
          <p className="text-muted-foreground mt-1 text-sm">Let's set up your profile</p>
        </div>

        {step === 1 && (
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Choose your account type</CardTitle>
              <CardDescription>This determines your experience in the app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => setRole('user')}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                  role === 'user' ? 'border-primary bg-accent' : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Patient</p>
                  <p className="text-sm text-muted-foreground">Free — Track health & book appointments</p>
                </div>
              </button>
              <button
                onClick={() => setRole('doctor')}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                  role === 'doctor' ? 'border-primary bg-accent' : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Doctor</p>
                  <p className="text-sm text-muted-foreground">Paid — Manage patients & schedules</p>
                </div>
              </button>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(2)} className="flex-1" size="lg">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                {role === 'user' ? 'Your Health Profile' : 'Doctor Profile'}
              </CardTitle>
              <CardDescription>
                {role === 'user' ? 'We need a few details for your health tracking' : 'Your professional details'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Age</Label>
                <Input type="number" placeholder="e.g. 30" value={formData.age}
                  onChange={e => handleField('age', e.target.value)} />
              </div>
              {role === 'user' ? (
                <>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input type="number" placeholder="e.g. 70" value={formData.weight}
                      onChange={e => handleField('weight', e.target.value)} />
                  </div>
                  <div>
                    <Label>Height (cm)</Label>
                    <Input type="number" placeholder="e.g. 175" value={formData.height}
                      onChange={e => handleField('height', e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Medical License Number</Label>
                    <Input placeholder="e.g. ML-12345" value={formData.medical_license}
                      onChange={e => handleField('medical_license', e.target.value)} />
                  </div>
                  <div>
                    <Label>Specialisation</Label>
                    <Select value={formData.specialisation} onValueChange={v => handleField('specialisation', v)}>
                      <SelectTrigger><SelectValue placeholder="Select specialisation" /></SelectTrigger>
                      <SelectContent>
                        {['General Practice', 'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 'Surgery', 'Other'].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                {role === 'user' ? (
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={() => handleSubmit(true)} disabled={saving} className="flex-1">
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Complete Setup
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && role === 'user' && (
          <Card className="border-border shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="font-heading text-xl">Connect Apple Health (Recommended)</CardTitle>
              <CardDescription>
                Sync your biometric data to automate tracking and power clinical insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground mt-0.5">1</div>
                  <div className="text-sm leading-relaxed text-muted-foreground">Download <span className="font-semibold text-foreground">Health Auto Export</span> from the iOS App Store. Open it and choose the <span className="font-semibold text-foreground">free tier</span> (you can close or skip any subscription prompts).</div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground mt-0.5">2</div>
                  <div className="text-sm leading-relaxed text-muted-foreground">Go to the <span className="font-semibold text-foreground">Automated</span> tab at the left sidebar. Tap <span className="font-semibold text-foreground">New Automation</span>, click enabled, and choose <span className="font-semibold text-foreground">REST API</span> (or Export to REST API).</div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground mt-0.5">3</div>
                  <div className="text-sm leading-relaxed text-muted-foreground">Under the <span className="font-semibold text-foreground">API URL</span> field, paste your personal HealthTrace webhook link:</div>
                </div>

                <div className="ml-9 p-3 bg-muted/50 rounded-xl border border-border flex items-center gap-2">
                  <div className="flex-1 truncate text-xs font-mono text-muted-foreground" title={webhookUrl}>
                    {webhookUrl}
                  </div>
                  <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-8 w-8 shrink-0 relative transition-transform active:scale-95 text-foreground hover:bg-background">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground mt-0.5">4</div>
                  <div className="text-sm leading-relaxed text-muted-foreground">Continue to the next step, select the metrics you want to safely share, and scroll up and click on <span className="font-semibold text-foreground">update</span> in the automation you created. Data will now flow automatically!</div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-border">
                <Button variant="ghost" onClick={() => handleSubmit(true)} disabled={saving} className="flex-1 text-muted-foreground hover:text-foreground">
                  Skip for now
                </Button>
                <Button onClick={() => handleSubmit(false)} disabled={saving} className="flex-1 bg-primary text-primary-foreground hover:opacity-90">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Complete Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}