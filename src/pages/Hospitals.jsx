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
import { Building2, Search, Plus, X, MapPin, ChevronDown, CheckCircle2, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function Hospitals() {
  const { user, checkUserAuth } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdown, setOpenDropdown] = useState(false);

  const [expandedHospitalId, setExpandedHospitalId] = useState(null);

  // 1. Fetch all available hospitals
  const { data: allHospitals = [], isLoading: loadingHospitals } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => apiClient.entities.hospitals.filter(),
  });

  // 2. Fetch all doctors
  const { data: allDoctors = [] } = useQuery({
    queryKey: ['all-doctors'],
    queryFn: () => apiClient.entities.users.filter({ role: 'doctor' }),
  });

  const connectedHospitals = useMemo(() => {
    const ids = (user?.hospital_ids || []).map(id => Number(id));
    return allHospitals.filter(h => ids.includes(Number(h.id)));
  }, [allHospitals, user]);

  // 4. Fetch connections for status badges
  const { data: connections = [] } = useQuery({
    queryKey: ['my-connections', user?.email],
    queryFn: () => apiClient.entities.ConnectionRequest.filter({ 
      patient_email: user?.email, 
      status: 'accepted' 
    }),
    enabled: !!user?.email && user?.role === 'user',
  });

  const availableToJoin = useMemo(() => {
    const connectedIds = (user?.hospital_ids || []).map(id => Number(id));
    return allHospitals
      .filter(h => !connectedIds.includes(Number(h.id)))
      .filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  }, [allHospitals, user, searchQuery]);

  // 5. Mutation to update user's hospital list
  const updateHospitals = useMutation({
    mutationFn: async (newIds) => {
      // Perform a single update to the 'users' collection.
      // Sequential updates prevent race conditions in the file-based DB.
      return await apiClient.entities.users.update(user.id, { hospital_ids: newIds });
    },
    onSuccess: async () => {
      // Refresh the auth state to get the updated user object with new hospital_ids
      await checkUserAuth();
      toast.success('Hospitals updated successfully');
      setSearchQuery('');
      setOpenDropdown(false);
    },
    onError: () => {
      toast.error('Failed to update hospitals');
    }
  });

  const handleJoinHospital = (id) => {
    const currentIds = user?.hospital_ids || [];
    if (currentIds.includes(id)) return;
    updateHospitals.mutate([...currentIds, id]);
  };

  const handleLeaveHospital = (id) => {
    const currentIds = user?.hospital_ids || [];
    updateHospitals.mutate(currentIds.filter(hid => hid !== id));
    if (expandedHospitalId === id) setExpandedHospitalId(null);
  };

  const getDoctorsInHospital = (hospitalId) => {
    const hid = Number(hospitalId);
    return allDoctors.filter(doc => 
      (doc.hospital_ids || []).some(id => Number(id) === hid)
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-4xl mx-auto"
    >
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-bold text-slate-900">Hospitals</h1>
        <p className="text-slate-500 mt-2 text-lg">Manage the medical institutions you are registered with</p>
      </div>

      <div className="space-y-12">
        {/* Connected Hospitals Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Hospitals Connected</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {connectedHospitals.length === 0 ? (
              <Card className="col-span-full p-12 text-center border-dashed bg-slate-50/30">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-10 text-slate-900" />
                <p className="text-slate-500 font-medium">You are not connected to any hospitals yet</p>
                <p className="text-xs text-slate-400 mt-1">Search above to find and join medical institutions</p>
              </Card>
            ) : (
              <AnimatePresence mode="popLayout">
                {connectedHospitals.map((hospital, idx) => {
                  const isExpanded = expandedHospitalId === hospital.id;
                  const hospitalDoctors = getDoctorsInHospital(hospital.id);
                  
                  return (
                    <motion.div
                      key={hospital.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      <Card className={`group border-white/60 bg-white shadow-sm hover:shadow-md transition-all ${isExpanded ? 'ring-2 ring-primary/20 border-primary/20' : 'hover:border-primary/20'} overflow-hidden relative`}>
                        <div 
                          className="cursor-pointer"
                          onClick={() => setExpandedHospitalId(isExpanded ? null : hospital.id)}
                        >
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-1 transition-colors group-hover:bg-primary/5">
                                <Building2 className={`w-5 h-5 transition-colors ${isExpanded ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`} />
                              </div>
                              <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
                            </div>
                            <CardTitle className="text-lg font-bold text-slate-800 mt-2">{hospital.name}</CardTitle>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                              <CardDescription className="flex items-center gap-1 text-sm">
                                <MapPin className="w-3.5 h-3.5" />
                                {hospital.location}
                              </CardDescription>
                              <CardDescription className="flex items-center gap-1 text-sm font-medium text-primary/80">
                                <Users className="w-3.5 h-3.5" />
                                {hospitalDoctors.length} Doctors Registered
                              </CardDescription>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pb-6">
                            <div className="flex items-center justify-between gap-4 mb-4">
                              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-bold px-2 py-0.5">
                                ACTIVE CONNECTION
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[10px] font-bold text-slate-400 hover:text-destructive hover:bg-destructive/5 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeaveHospital(hospital.id);
                                }}
                              >
                                <X className="w-3 h-3 mr-1" />
                                DISCONNECT
                              </Button>
                            </div>
                            
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="border-t pt-6 mt-2 overflow-hidden"
                                >
                                  <div className="flex items-center gap-2 mb-4">
                                    <Users className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Registered Doctors</h3>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {hospitalDoctors.length === 0 ? (
                                      <p className="text-sm text-slate-400 italic py-4 col-span-full text-center bg-slate-50 rounded-xl border border-dashed">
                                        No doctors registered at this hospital yet.
                                      </p>
                                    ) : (
                                      hospitalDoctors.map(doctor => {
                                        const isConnected = connections.some(c => 
                                          c.doctor_email.toLowerCase() === doctor.email.toLowerCase()
                                        );
                                        
                                        return (
                                          <div key={doctor.email} className={`p-4 rounded-xl border transition-all group/doc relative overflow-hidden ${isConnected ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-slate-50/50 hover:bg-white hover:border-slate-300'}`}>
                                            {isConnected && (
                                              <div className="absolute top-0 right-0">
                                                <div className="bg-primary text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg">
                                                  CONNECTED
                                                </div>
                                              </div>
                                            )}
                                            <div className="flex items-center gap-3">
                                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${isConnected ? 'bg-primary text-white' : 'bg-white border text-primary'}`}>
                                                {doctor.full_name ? doctor.full_name[0].toUpperCase() : 'D'}
                                              </div>
                                              <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 group-hover/doc:text-primary transition-colors truncate">
                                                  {doctor.full_name || 'Medical Professional'}
                                                </p>
                                                <p className="text-[11px] text-slate-500 font-medium truncate uppercase tracking-tight">
                                                  {doctor.specialisation || 'General Practitioner'}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </section>

        <hr className="border-slate-100" />

        {/* Find New Hospitals Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Find Hospitals</h2>
          </div>

          <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-primary/30 transition-all duration-300">
            <CardContent className="pt-8">
              <div className="max-w-md w-full space-y-4">
                <Label className="text-sm font-semibold text-slate-600 ml-1">Connect to an Institution</Label>
                <Popover open={openDropdown} onOpenChange={setOpenDropdown}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-14 text-lg font-normal bg-white border-slate-200 shadow-sm hover:border-primary/40"
                    >
                      <div className="flex items-center gap-3 text-slate-400">
                        <Search className="w-5 h-5 opacity-50" />
                        <span>Search hospitals...</span>
                      </div>
                      <ChevronDown className="ml-2 h-5 w-5 shrink-0 opacity-40" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-slate-100 rounded-2xl overflow-hidden" align="start">
                    <div className="p-3 border-b bg-slate-50/80">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Type hospital name..." 
                          className="pl-10 h-11 border-none focus-visible:ring-0 bg-transparent text-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                      {loadingHospitals ? (
                        <div className="py-12 text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary opacity-50" />
                        </div>
                      ) : availableToJoin.length === 0 ? (
                        <div className="py-10 text-center space-y-2">
                          <Building2 className="w-8 h-8 text-slate-200 mx-auto" />
                          <p className="text-sm text-slate-400">No new hospitals found</p>
                        </div>
                      ) : (
                        availableToJoin.map(hospital => (
                          <button
                            key={hospital.id}
                            onClick={() => handleJoinHospital(hospital.id)}
                            className="flex items-center justify-between w-full p-4 rounded-xl hover:bg-primary/5 group transition-all text-left"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-900 group-hover:text-primary">{hospital.name}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {hospital.location}
                                </p>
                                <p className="text-xs text-primary/70 font-medium flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {getDoctorsInHospital(hospital.id).length} Doctors
                                </p>
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </motion.div>
  );
}
