import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, Lock, User, UserCircle, Stethoscope, Loader2, 
  Building2, CheckCircle2, Search, ChevronDown, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('user'); // default to patient
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitals, setSelectedHospitals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const data = await apiClient.entities.hospitals.filter();
        setHospitals(data || []);
      } catch (err) {
        console.error('Failed to fetch hospitals:', err);
      }
    };
    fetchHospitals();
  }, []);

  const filteredHospitals = useMemo(() => {
    if (!searchQuery.trim()) return hospitals;
    const q = searchQuery.toLowerCase();
    return hospitals.filter(h => 
      h.name.toLowerCase().includes(q) || 
      h.location.toLowerCase().includes(q)
    );
  }, [hospitals, searchQuery]);

  const toggleHospital = (id) => {
    setSelectedHospitals(prev => 
      prev.includes(id) ? prev.filter(hId => hId !== id) : [...prev, id]
    );
  };

  const removeHospital = (id) => {
    setSelectedHospitals(prev => prev.filter(hId => hId !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedHospitals.length === 0) {
      toast.error('Please select at least one hospital');
      return;
    }
    setLoading(true);
    try {
      await register({ ...formData, role, hospital_ids: selectedHospitals });
      toast.success('Account created successfully!');
      navigate('/onboarding');
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

        <Card className="border-white/40 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-200/50 overflow-visible">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-heading font-semibold">Create Account</CardTitle>
            <CardDescription>Select your role, details and hospitals</CardDescription>
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

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  Register in Hospitals
                </Label>
                
                <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      role="combobox" 
                      aria-expanded={isDropdownOpen}
                      className="w-full justify-between bg-white/50 hover:bg-white transition-colors font-normal text-slate-600 h-11"
                    >
                      <span className="truncate">
                        {selectedHospitals.length > 0 
                          ? `${selectedHospitals.length} hospital${selectedHospitals.length > 1 ? 's' : ''} selected`
                          : "Select hospitals..."}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Search Brisbane hospitals..." 
                          className="pl-8 h-9 border-none focus-visible:ring-0"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                      {filteredHospitals.length === 0 ? (
                        <p className="text-center py-4 text-sm text-slate-400">No hospitals found.</p>
                      ) : (
                        filteredHospitals.map(hospital => (
                          <button
                            key={hospital.id}
                            type="button"
                            onClick={() => toggleHospital(hospital.id)}
                            className="flex items-center justify-between w-full p-2.5 rounded-lg text-left hover:bg-slate-50 transition-colors group"
                          >
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${selectedHospitals.includes(hospital.id) ? 'text-primary' : 'text-slate-700'}`}>
                                {hospital.name}
                              </span>
                              <span className="text-[10px] text-slate-400">{hospital.location}</span>
                            </div>
                            {selectedHospitals.includes(hospital.id) && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                  <AnimatePresence>
                    {selectedHospitals.map(id => {
                      const h = hospitals.find(h => h.id === id);
                      if (!h) return null;
                      return (
                        <motion.div
                          key={id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Badge 
                            variant="secondary" 
                            className="bg-primary/10 text-primary hover:bg-primary/20 border-none flex items-center gap-1 py-1 px-2"
                          >
                            <span className="max-w-[150px] truncate text-[11px]">{h.name}</span>
                            <button 
                              type="button" 
                              onClick={() => removeHospital(id)}
                              className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 mt-2 shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Create Account'}
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


