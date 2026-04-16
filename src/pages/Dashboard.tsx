import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { supabase } from '@/integrations/supabase/client';
import { Users, CheckCircle, XCircle, Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface RecentEntry {
  participant_id: string;
  name: string;
  batch_no: string;
  running_time: number | null;
  result: string | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, qualified: 0, disqualified: 0, batches: 0 });
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchRecent();
  }, []);

  const fetchStats = async () => {
    const { data: participants } = await supabase.from('participants').select('batch_no');
    const { data: tests } = await supabase.from('running_tests').select('result');

    const total = participants?.length || 0;
    const qualified = tests?.filter(t => t.result === 'Qualified').length || 0;
    const disqualified = tests?.filter(t => t.result === 'Disqualified').length || 0;
    const batches = new Set(participants?.map(p => p.batch_no)).size;

    setStats({ total, qualified, disqualified, batches });
  };

  const fetchRecent = async () => {
    const { data: participants } = await supabase
      .from('participants')
      .select('participant_id, name, batch_no')
      .order('created_at', { ascending: false })
      .limit(5);

    if (participants) {
      const entries: RecentEntry[] = [];
      for (const p of participants) {
        const { data: test } = await supabase
          .from('running_tests')
          .select('running_time, result')
          .eq('participant_id', p.participant_id)
          .maybeSingle();
        entries.push({
          ...p,
          running_time: test?.running_time ?? null,
          result: test?.result ?? null,
        });
      }
      setRecentEntries(entries);
    }
  };

  return (
    <AppLayout title="Police Recruitment Running Test Management">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Participants"
            value={stats.total.toLocaleString()}
            icon={<Users className="h-4 w-4 text-primary" />}
            change="+15%"
            changeType="positive"
          />
          <StatCard
            title="Qualified Candidates"
            value={stats.qualified.toLocaleString()}
            icon={<CheckCircle className="h-4 w-4 text-primary" />}
            change="+10%"
            changeType="positive"
          />
          <StatCard
            title="Disqualified Candidates"
            value={stats.disqualified.toLocaleString()}
            icon={<XCircle className="h-4 w-4 text-destructive" />}
            change="-5%"
            changeType="negative"
          />
          <StatCard
            title="Running Batches"
            value={stats.batches}
            icon={<Layers className="h-4 w-4 text-primary" />}
            change="+2%"
            changeType="positive"
          />
        </div>

        {/* Recent Entries */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="font-semibold text-foreground">Recent Running Test Entries</h2>
            <div className="flex gap-2">
              <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate('/add-participant')}>
                <Plus className="h-4 w-4 mr-1" /> New Entry
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chest No.</TableHead>
                <TableHead>Participant Name</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No entries yet. Add participants and record test results.
                  </TableCell>
                </TableRow>
              ) : (
                recentEntries.map((entry) => (
                  <TableRow key={entry.participant_id}>
                    <TableCell className="font-semibold text-primary">#{entry.participant_id}</TableCell>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>{entry.batch_no}</TableCell>
                    <TableCell>
                      {entry.result ? (
                        <Badge variant={entry.result === 'Qualified' ? 'default' : 'destructive'}>
                          {entry.result}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
