import { apiClient } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ConnectionRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['connection-requests', user?.email],
    queryFn: () => apiClient.entities.ConnectionRequest.filter({ doctor_email: user?.email }),
    initialData: [],
  });

  const updateRequest = useMutation({
    mutationFn: ({ id, status }) => apiClient.entities.ConnectionRequest.update(id, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      toast.success(status === 'accepted' ? 'Patient connected!' : 'Request rejected');
    },
  });

  const pending = requests.filter(r => r.status === 'pending');
  const handled = requests.filter(r => r.status !== 'pending');

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Connection Requests</h1>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pending</h2>
          <div className="space-y-3">
            {pending.map((req, i) => (
              <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{req.patient_name}</p>
                      <p className="text-sm text-muted-foreground">{req.patient_email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateRequest.mutate({ id: req.id, status: 'accepted' })}>
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateRequest.mutate({ id: req.id, status: 'rejected' })}>
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {handled.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">History</h2>
          <div className="space-y-2">
            {handled.map(req => (
              <Card key={req.id} className="opacity-75">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{req.patient_name}</p>
                  </div>
                  <Badge variant={req.status === 'accepted' ? 'default' : 'secondary'}>
                    {req.status === 'accepted' ? 'Connected' : 'Rejected'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && !isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No connection requests yet</p>
        </div>
      )}
    </div>
  );
}