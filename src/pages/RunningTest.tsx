import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Timer, Search, Clock, Users, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Participant {
  participant_id: string;
  name: string;
  batch_no: string;
}

const TARGET_TIME = '06:30.00';

export default function RunningTest() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [search, setSearch] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  useEffect(() => {
    fetchParticipants();
  }, [page, search]);

  const fetchParticipants = async () => {
    let query = supabase
      .from('participants')
      .select('participant_id, name, batch_no', { count: 'exact' });

    if (search) {
      query = query.or(`participant_id.ilike.%${search}%,name.ilike.%${search}%,batch_no.ilike.%${search}%`);
    }

    const { data, count } = await query
      .range((page - 1) * perPage, page * perPage - 1)
      .order('created_at', { ascending: false });

    setParticipants(data || []);
    setTotal(count || 0);
  };

  const handleRecordTime = async () => {
    if (!selectedParticipant || !minutes) return;
    if (parseInt(minutes || '0') <= 6 && !seconds) return;
    setIsLoading(true);

    const totalSeconds = parseInt(minutes || '0') * 60 + parseFloat(seconds || '0');
    const result = totalSeconds <= 360 ? 'Qualified' : 'Disqualified';

    try {
      // Upsert: delete existing then insert
      await supabase.from('running_tests').delete().eq('participant_id', selectedParticipant.participant_id);
      const { error } = await supabase.from('running_tests').insert({
        participant_id: selectedParticipant.participant_id,
        running_time: totalSeconds,
        result,
      });

      if (error) throw error;
      toast.success(`Time recorded! Result: ${result}`);
      setSelectedParticipant(null);
      setMinutes('');
      setSeconds('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to record time');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <AppLayout title="Running Test Entry">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Stats */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="stat-card flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase">Total Batch</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{total}</span>
          </div>
          <div className="stat-card flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase">Target Time</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{TARGET_TIME}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Participant ID, Name or Batch"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>

        {/* Participant List */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No participants found.
                  </TableCell>
                </TableRow>
              ) : (
                participants.map((p) => (
                  <TableRow key={p.participant_id}>
                    <TableCell className="font-semibold text-primary">{p.participant_id}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.batch_no}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedParticipant(p)}>
                        <Edit className="h-3 w-3 mr-1" /> Record
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t text-sm text-muted-foreground">
              <span>Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total}</span>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={page === i + 1 ? 'default' : 'outline'}
                    className={page === i + 1 ? 'gradient-primary text-primary-foreground' : ''}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Record Time Dialog */}
        <Dialog open={!!selectedParticipant} onOpenChange={() => setSelectedParticipant(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                Record Running Time
              </DialogTitle>
            </DialogHeader>
            {selectedParticipant && (
              <div className="space-y-4">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-sm"><strong>ID:</strong> {selectedParticipant.participant_id}</p>
                  <p className="text-sm"><strong>Name:</strong> {selectedParticipant.name}</p>
                  <p className="text-sm"><strong>Batch:</strong> {selectedParticipant.batch_no}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minutes</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 6"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      min={0}
                      max={30}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Seconds</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 42"
                      value={seconds}
                      onChange={(e) => setSeconds(e.target.value)}
                      min={0}
                      max={59}
                      step={1}
                    />
                  </div>
                </div>
                {(minutes || seconds) && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Total: {minutes || '0'}m {seconds || '0'}s = {parseInt(minutes || '0') * 60 + parseFloat(seconds || '0')}s
                    </p>
                    <Badge
                      variant={parseInt(minutes || '0') * 60 + parseFloat(seconds || '0') <= 360 ? 'default' : 'destructive'}
                      className="mt-1"
                    >
                      {parseInt(minutes || '0') * 60 + parseFloat(seconds || '0') <= 360 ? 'QUALIFIED' : 'DISQUALIFIED'}
                    </Badge>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedParticipant(null)}>Cancel</Button>
              <Button className="gradient-primary text-primary-foreground" onClick={handleRecordTime} disabled={isLoading || !minutes || (parseInt(minutes || '0') <= 6 && !seconds)}>
                {isLoading ? 'Saving...' : 'Save Result'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
