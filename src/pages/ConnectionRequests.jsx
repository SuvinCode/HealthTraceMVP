import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, User, Clock, UserPlus, Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConnectionRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['connection-requests', user?.email],
    queryFn: () => apiClient.entities.ConnectionRequest.filter({ doctor_email: user?.email }),
    initialData: [],
  });

  const updateRequest = useMutation({
    mutationFn: ({ id, status }) => apiClient.entities.ConnectionRequest.update(id, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
      toast.success(status === 'accepted' ? 'Patient connected!' : 'Request rejected');
    },
  });

  const handleSearch = async (e, isManual = false, isFocus = false) => {
    if (e) e.preventDefault();
    const query = searchName.trim().toLowerCase();
    
    // If focusing an empty field, we show all. If typing and clearing, we hide (behavior choice).
    // User specifically asked to display all users when clicking the input tab.
    if (!query && !isFocus && !isManual) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await apiClient.entities.patients.filter();
      
      let usersList = [];
      if (Array.isArray(response)) {
        usersList = response;
      } else if (response && typeof response === 'object') {
        usersList = response.patients || response.users || response.data || [];
      }
      
      const matched = query 
        ? usersList.filter(p => {
            const name = (p.full_name || p.name || "").toLowerCase();
            return name.startsWith(query);
          })
        : usersList; // Show all if query is empty (as on focus)
      
      setSearchResults(matched);
      
      if (isManual) {
        if (matched.length > 0) {
          toast.success("Patient can be found");
        } else {
          toast.error("Patient cannot be found");
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      if (isManual) {
        if (error.status === 401) {
          toast.error('Session expired. Please log in again.');
        } else {
          toast.error('Search unavailable at the moment');
        }
      }
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(null, false); // Quiet search for live typing
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchName]);

  const handleConnect = async (patient) => {
    // Check if already connected
    const existing = requests.find(r => r.patient_email === patient.email && r.status === 'accepted');
    if (existing) {
      toast.error('You are already connected with this patient.');
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

      toast.success(`Successfully connected with ${patient.full_name}`);
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
    } catch (error) {
      toast.error('Failed to connect');
    }
  };

  const handleDisconnect = async (patientEmail) => {
    const conn = requests.find(r => r.patient_email === patientEmail && r.status === 'accepted');
    if (!conn) return;

    try {
      await apiClient.entities.ConnectionRequest.delete(conn.id);
      toast.success('Disconnected successfully');
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const handled = requests.filter(r => r.status !== 'pending');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Connect with Patients</h1>
          <p className="text-muted-foreground mt-1.5">Manage your network and add new patients</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Search & Add */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Find New Patient
              </CardTitle>
              <CardDescription>Search by name to discover and connect with patients.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={e => handleSearch(e, true)} className="flex gap-2">
                <div className="flex-1 relative text-left">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                  <Input
                    placeholder="Search by patient name..."
                    value={searchName}
                    onChange={e => setSearchName(e.target.value)}
                    onFocus={() => handleSearch(null, false, true)}
                    className="pl-9 h-12 text-lg shadow-sm"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSearching} 
                  className="h-12 w-12 p-0 shrink-0 shadow-lg hover:shadow-xl transition-all"
                  variant="default"
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </Button>
              </form>

              {/* Search Results */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t space-y-3"
                  >
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Patients</p>
                    {searchResults.map((patient, i) => {
                      const isConnected = requests.some(r => r.patient_email === patient.email && r.status === 'accepted');
                      return (
                        <motion.div 
                          key={patient.email} 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{patient.full_name}</p>
                              <p className="text-xs text-muted-foreground">{patient.email}</p>
                            </div>
                          </div>
                          {isConnected ? (
                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDisconnect(patient.email)}>
                              <X className="w-3.5 h-3.5 mr-1" /> Disconnect
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleConnect(patient)}>
                              <Plus className="w-3.5 h-3.5 mr-1" /> Connect
                            </Button>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Pending Requests (mostly legacy now, but still useful to handle) */}
          {pending.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 px-1">
                <Clock className="w-4 h-4" />
                Pending Incoming Requests
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {pending.map((req, i) => (
                  <motion.div key={req.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                    <Card className="hover:border-primary/40 transition-colors">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{req.patient_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{req.patient_email}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => updateRequest.mutate({ id: req.id, status: 'accepted' })}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => updateRequest.mutate({ id: req.id, status: 'rejected' })}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}