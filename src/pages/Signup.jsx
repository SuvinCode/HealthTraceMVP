import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Mail, Lock, User, UserCircle, Stethoscope, Loader2, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('user'); // default to patient
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ ...formData, role });
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 font-body">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] bg-teal-400/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-6">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-slate-200/50"
          >
            <img src="/favicon.svg" alt="HealthTrace Logo" className="w-9 h-9" />
          </motion.div>
          <h1 className="font-heading text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">Join HealthTrace</h1>
          <p className="text-slate-500 mt-1">Start your health tracking journey today</p>
        </div>

        <Card className="border-white/40 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-200/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-heading font-semibold">Create Account</CardTitle>
            <CardDescription>Select your role and enter your details</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 ${
                    role === 'user' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/20'
                  }`}
                >
                  <UserCircle className={`w-6 h-6 ${role === 'user' ? 'text-primary' : 'text-slate-400'}`} />
                  <span className={`text-xs font-medium ${role === 'user' ? 'text-primary' : 'text-slate-600'}`}>Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 ${
                    role === 'doctor' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/20'
                  }`}
                >
                  <Stethoscope className={`w-6 h-6 ${role === 'doctor' ? 'text-primary' : 'text-slate-400'}`} />
                  <span className={`text-xs font-medium ${role === 'doctor' ? 'text-primary' : 'text-slate-600'}`}>Doctor</span>
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="full_name" 
                    placeholder="John Doe" 
                    className="pl-10 bg-white/50 focus:bg-white transition-colors"
                    value={formData.full_name}
                    onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    className="pl-10 bg-white/50 focus:bg-white transition-colors"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 bg-white/50 focus:bg-white transition-colors"
                    value={formData.password}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 mt-2 shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Create Account'}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">Or signup with</span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-11 border-slate-200 hover:bg-slate-50 transition-colors"
                onClick={() => apiClient.auth.googleLogin()}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Google
              </Button>
            </CardContent>
            <CardFooter className="pt-2">
              <p className="text-sm text-center w-full text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
