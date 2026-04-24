import { useState } from 'react';
import { base44 } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PatientLogs() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: connections, isLoading } = useQuery({
    queryKey: ['doctor-connections', user?.email],
    queryFn: () => base44.entities.ConnectionRequest.filter({ doctor_email: user?.email, status: 'accepted' }),
    initialData: [],
  });

  const filtered = connections.filter(c =>
    c.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.patient_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Patient Logs</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search patients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{isLoading ? 'Loading...' : 'No connected patients found'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((conn, i) => (
            <motion.div key={conn.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/patient/${encodeURIComponent(conn.patient_email)}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {conn.patient_name?.[0]?.toUpperCase() || 'P'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{conn.patient_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{conn.patient_email}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}