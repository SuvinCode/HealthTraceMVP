import { useState } from 'react';
import { base44 } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Stethoscope, UserPlus, Check, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function FindDoctor() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => base44.entities.User.filter({ role: 'doctor', onboarding_complete: true }),
    initialData: [],
  });

  const { data: myRequests } = useQuery({
    queryKey: ['my-requests', user?.email],
    queryFn: () => base44.entities.ConnectionRequest.filter({ patient_email: user?.email }),
    initialData: [],
  });

  const sendRequest = useMutation({
    mutationFn: (doctor) => base44.entities.ConnectionRequest.create({
      patient_email: user.email,
      patient_name: user.full_name,
      doctor_email: doctor.email,
      doctor_name: doctor.full_name,
      status: 'pending',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      toast.success('Connection request sent!');
    },
  });

  const getRequestStatus = (doctorEmail) => {
    const req = myRequests?.find(r => r.doctor_email === doctorEmail);
    return req?.status;
  };

  const filtered = doctors.filter(d =>
    d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialisation?.toLowerCase().includes(search.toLowerCase())
  );

  const hasConnected = myRequests?.some(r => r.status === 'accepted');

  return (
    <div className="min-h-screen bg-background font-body p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Find Your Doctor</h1>
          <p className="text-muted-foreground mt-1">Search and connect with a doctor to get started</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or specialisation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading doctors...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No doctors found</div>
          ) : (
            filtered.map((doctor, i) => {
              const status = getRequestStatus(doctor.email);
              return (
                <motion.div key={doctor.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{doctor.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doctor.specialisation && (
                            <Badge variant="secondary" className="text-xs">{doctor.specialisation}</Badge>
                          )}
                        </div>
                      </div>
                      {status === 'accepted' ? (
                        <Badge className="bg-accent text-accent-foreground"><Check className="w-3 h-3 mr-1" /> Connected</Badge>
                      ) : status === 'pending' ? (
                        <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
                      ) : (
                        <Button size="sm" onClick={() => sendRequest.mutate(doctor)} disabled={sendRequest.isPending}>
                          <UserPlus className="w-4 h-4 mr-1" /> Connect
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {hasConnected && (
          <div className="mt-8 text-center">
            <Link to="/health-form">
              <Button size="lg">
                Continue to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}