import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Stethoscope, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Onboarding() {
  const { user, checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('user');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    age: '', weight: '', height: '',
    medical_license: '', specialisation: ''
  });

  const handleField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    const data = { role, onboarding_complete: true };
    if (role === 'user') {
      data.age = Number(formData.age);
      data.weight = Number(formData.weight);
      data.height = Number(formData.height);
    } else {
      data.age = Number(formData.age);
      data.medical_license = formData.medical_license;
      data.specialisation = formData.specialisation;
    }
    await apiClient.auth.updateMe(data);
    await checkUserAuth();
    navigate(role === 'doctor' ? '/doctor-dashboard' : '/find-doctor');
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
              <Button onClick={() => setStep(2)} className="w-full mt-4" size="lg">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
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
                <Button onClick={handleSubmit} disabled={saving} className="flex-1">
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