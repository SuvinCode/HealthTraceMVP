import { useState, useMemo } from 'react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User, ChevronRight, Building2, ChevronDown, ChevronUp, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedHospital, setExpandedHospital] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');

  // 1. Fetch Doctor's accepted connections
  const { data: connections = [] } = useQuery({
    queryKey: ['connection-requests', user?.email, 'accepted'],
    queryFn: () => apiClient.entities.ConnectionRequest.filter({ doctor_email: user?.email, status: 'accepted' }),
  });

  // 2. Fetch all hospitals to get names/locations
  const { data: allHospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => apiClient.entities.hospitals.filter(),
  });

  // 3. Fetch patients to check their hospital_ids (since connections only has emails)
  const { data: allPatients = [] } = useQuery({
    queryKey: ['all-patients'],
    queryFn: () => apiClient.entities.patients.filter(),
  });

  // 4. Filter hospitals to only those the doctor is registered in
  const doctorHospitals = useMemo(() => {
    const doctorHospitalIds = user?.hospital_ids || [];
    return allHospitals.filter(h => doctorHospitalIds.includes(h.id));
  }, [allHospitals, user]);

  // 5. Group connected patients by hospital
  const hospitalData = useMemo(() => {
    const grouped = {};
    
    doctorHospitals.forEach(hospital => {
      // Find connected patients in this hospital
      const patientsInHospital = allPatients.filter(p => {
        const isConnected = connections.some(conn => conn.patient_email === p.email);
        const inHospital = (p.hospital_ids || []).includes(hospital.id);
        return isConnected && inHospital;
      });

      grouped[hospital.id] = {
        hospital,
        patients: patientsInHospital
      };
    });

    return grouped;
  }, [doctorHospitals, allPatients, connections]);

  const handleDisconnect = async (patientEmail) => {
    const conn = connections.find(r => r.patient_email === patientEmail);
    if (!conn) return;

    try {
      await apiClient.entities.ConnectionRequest.delete(conn.id);
      toast.success('Disconnected successfully');
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const toggleHospital = (id) => {
    setExpandedHospital(expandedHospital === id ? null : id);
    setPatientSearch('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Patient Logs</h1>
          <p className="text-muted-foreground mt-1.5 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Manage patients across your registered hospitals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {doctorHospitals.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">No hospitals registered to your profile</p>
            <p className="text-sm text-muted-foreground mt-1">Please update your profile in settings</p>
          </Card>
        ) : (
          doctorHospitals.map((hospital, idx) => {
            const data = hospitalData[hospital.id] || { patients: [] };
            const isExpanded = expandedHospital === hospital.id;
            
            // Filter and limit patients
            const filteredPatients = data.patients
              .filter(p => 
                p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
                p.email?.toLowerCase().includes(patientSearch.toLowerCase())
              )
              .slice(0, 10);

            return (
              <motion.div 
                key={hospital.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card 
                  className={`overflow-hidden transition-all duration-300 border-2 ${
                    isExpanded ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <button 
                    onClick={() => toggleHospital(hospital.id)}
                    className="w-full text-left p-6 flex items-center justify-between bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        isExpanded ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                      }`}>
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-none">{hospital.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1.5">{hospital.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
                        <Users className="w-3 h-3 mr-1.5" />
                        {data.patients.length} Patient{data.patients.length !== 1 ? 's' : ''}
                      </Badge>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t bg-slate-50/30"
                      >
                        <div className="p-6 pt-4 space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              placeholder={`Search patients in ${hospital.name}...`}
                              value={patientSearch}
                              onChange={(e) => setPatientSearch(e.target.value)}
                              className="pl-10 bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {filteredPatients.length === 0 ? (
                              <div className="col-span-full py-8 text-center text-muted-foreground bg-white/50 rounded-xl border border-dashed">
                                <p className="text-sm">No patients found in this hospital</p>
                              </div>
                            ) : (
                              filteredPatients.map((patient) => (
                                <div key={patient.email} className="group relative">
                                  <Link 
                                    to={`/patient/${encodeURIComponent(patient.email)}`}
                                    className="block"
                                  >
                                    <Card className="hover:border-primary transition-all bg-white group-hover:shadow-md group-hover:-translate-y-0.5">
                                      <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                          <span className="text-xs font-bold text-primary">
                                            {patient.full_name?.[0]?.toUpperCase() || 'P'}
                                          </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{patient.full_name}</p>
                                          <p className="text-[11px] text-muted-foreground truncate">{patient.email}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                                      </CardContent>
                                    </Card>
                                  </Link>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDisconnect(patient.email);
                                    }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-destructive hover:border-destructive transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
                                    title="Disconnect"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                          {data.patients.length > 10 && (
                            <p className="text-center text-[11px] text-muted-foreground italic">
                              Showing first 10 patients. Use search to find others.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}