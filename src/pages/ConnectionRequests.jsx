import { useState, useMemo } from 'react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, X, User, Clock, Loader2, Plus, Search, Building2, ChevronDown, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConnectionRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [searchQueries, setSearchQueries] = useState({});

  // 1. Fetch Doctor's connections
  const { data: requests = [] } = useQuery({
    queryKey: ['connection-requests', user?.email],
    queryFn: () => apiClient.entities.ConnectionRequest.filter({ doctor_email: user?.email }),
  });

  // 2. Fetch all hospitals
  const { data: allHospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => apiClient.entities.hospitals.filter(),
  });

  // 3. Fetch all patients
  const { data: allPatients = [] } = useQuery({
    queryKey: ['all-patients'],
    queryFn: () => apiClient.entities.patients.filter(),
  });

  const doctorHospitals = useMemo(() => {
    const ids = user?.hospital_ids || [];
    return allHospitals.filter(h => ids.includes(h.id));
  }, [allHospitals, user]);

  const updateRequest = useMutation({
    mutationFn: ({ id, status }) => apiClient.entities.ConnectionRequest.update(id, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
      toast.success(status === 'accepted' ? 'Patient connected!' : 'Request rejected');
    },
  });

  const handleConnect = async (patient) => {
    const isConnected = requests.some(r => r.patient_email === patient.email && r.status === 'accepted');
    if (isConnected) {
      toast.error('Already connected with this patient');
      return;
    }

    try {
      await apiClient.entities.ConnectionRequest.create({
        doctor_email: user.email,
        doctor_name: user.full_name,
        patient_email: patient.email,
        patient_name: patient.full_name,
        status: 'accepted',
      });

      toast.success(`Connected with ${patient.full_name}`);
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
      setOpenDropdownId(null);
    } catch (error) {
      toast.error('Failed to connect');
    }
  };

  const handleSearchChange = (hospitalId, query) => {
    setSearchQueries(prev => ({ ...prev, [hospitalId]: query }));
  };

  const pending = requests.filter(r => r.status === 'pending');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-bold text-slate-900">Connect with Patients</h1>
        <p className="text-slate-500 mt-2 text-lg">Find and add new patients from your registered institutions</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {doctorHospitals.map((hospital, idx) => {
          const searchQuery = searchQueries[hospital.id] || '';
          
          const filteredPatients = allPatients.filter(p => {
            const inHospital = (p.hospital_ids || []).includes(hospital.id);
            const q = searchQuery.toLowerCase().trim();
            const nameMatch = q ? (p.full_name || "").toLowerCase().includes(q) : true;
            return inHospital && nameMatch;
          });

          return (
            <motion.div 
              key={hospital.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-white/60 bg-white/70 backdrop-blur-xl shadow-xl shadow-slate-200/40 overflow-visible border-2 hover:border-primary/20 transition-all">
                <CardHeader className="bg-slate-50/50 pb-6 border-b border-slate-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-800">{hospital.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-1">
                        {hospital.location}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="max-w-md w-full space-y-4">
                    <Label className="text-sm font-semibold text-slate-600 ml-1">Find patients</Label>
                    <Popover 
                      open={openDropdownId === hospital.id} 
                      onOpenChange={(open) => setOpenDropdownId(open ? hospital.id : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          role="combobox" 
                          className="w-full justify-between h-14 text-lg font-normal bg-white border-slate-200 shadow-sm hover:border-primary/40 hover:bg-white"
                        >
                          <div className="flex items-center gap-3 text-slate-400">
                            <Search className="w-5 h-5 opacity-50" />
                            <span>Find patients...</span>
                          </div>
                          <ChevronDown className="ml-2 h-5 w-5 shrink-0 opacity-40" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-slate-100 rounded-2xl overflow-hidden" align="start">
                        <div className="p-3 border-b bg-slate-50/80">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                              placeholder={`Type a name...`} 
                              className="pl-10 h-11 border-none focus-visible:ring-0 bg-transparent text-sm"
                              value={searchQuery}
                              onChange={(e) => handleSearchChange(hospital.id, e.target.value)}
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-[320px] overflow-y-auto p-2 space-y-1">
                          {filteredPatients.length === 0 ? (
                            <div className="py-12 text-center space-y-3">
                              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                <User className="w-6 h-6 text-slate-200" />
                              </div>
                              <p className="text-sm text-slate-400 font-medium">No results for "{searchQuery}"</p>
                            </div>
                          ) : (
                            filteredPatients.map(patient => {
                              const isConnected = requests.some(r => r.patient_email === patient.email && r.status === 'accepted');
                              return (
                                <div
                                  key={patient.email}
                                  className={`flex items-center justify-between w-full p-3.5 rounded-xl transition-all ${
                                    isConnected ? 'bg-slate-50/50 border border-slate-100' : 'hover:bg-primary/5 group border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-3.5">
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                                      isConnected ? 'bg-slate-100' : 'bg-primary/10 group-hover:bg-primary/20'
                                    }`}>
                                      <span className={`text-sm font-bold ${isConnected ? 'text-slate-400' : 'text-primary'}`}>
                                        {patient.full_name?.[0]?.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="text-left">
                                      <p className={`text-sm font-bold ${isConnected ? 'text-slate-500' : 'text-slate-900 group-hover:text-primary'}`}>
                                        {patient.full_name}
                                      </p>
                                      <p className="text-[11px] text-slate-400 font-medium">{patient.email}</p>
                                    </div>
                                  </div>
                                  {isConnected ? (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none flex items-center gap-1.5 py-1 px-2.5 text-[10px] font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      CONNECTED
                                    </Badge>
                                  ) : (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-9 rounded-lg text-primary hover:bg-primary/10 hover:text-primary font-bold text-xs"
                                        onClick={() => handleConnect(patient)}
                                      >
                                        <Plus className="w-4 h-4 mr-1.5" />
                                        CONNECT
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Pending Requests Section */}
        {pending.length > 0 && (
          <div className="mt-12 space-y-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-slate-200"></span>
              Incoming Requests
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none ml-1">{pending.length}</Badge>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pending.map((req) => (
                <Card key={req.id} className="border-amber-200/50 bg-amber-50/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-amber-200/50 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-amber-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{req.patient_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{req.patient_email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="icon" className="bg-amber-600 hover:bg-amber-700 h-9 w-9 rounded-lg shadow-sm" onClick={() => updateRequest.mutate({ id: req.id, status: 'accepted' })}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-slate-400 hover:bg-white" onClick={() => updateRequest.mutate({ id: req.id, status: 'rejected' })}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}