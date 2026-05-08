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

interface TimeErrors {
  minutes?: string;
  seconds?: string;
}

const TARGET_TIME = '06:30.00';

// ── Validation ────────────────────────────────────────────────────────────────
function validateTime(minutes: string, seconds: string): TimeErrors {
  const errors: TimeErrors = {};

  if (minutes === '' || minutes === null) {
    errors.minutes = 'Minutes are required.';
  } else {
    const m = Number(minutes);
    if (!Number.isInteger(m) || String(minutes).includes('.')) {
      errors.minutes = 'Must be a whole number.';
    } else if (m < 0 || m > 30) {
      errors.minutes = 'Minutes must be between 0 and 30.';
    }
  }

  if (seconds === '' || seconds === null) {
    errors.seconds = 'Seconds are required.';
  } else {
    const s = Number(seconds);
    if (!Number.isInteger(s) || String(seconds).includes('.')) {
      errors.seconds = 'Must be a whole number.';
    } else if (s < 0 || s > 59) {
      errors.seconds = 'Seconds must be between 0 and 59.';
    }
  }

  return errors;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function RunningTest() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [search, setSearch] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [timeErrors, setTimeErrors] = useState<TimeErrors>({});
  const [timeTouched, setTimeTouched] = useState<{ minutes: boolean; seconds: boolean }>({ minutes: false, seconds: false });
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

  const handleMinutesChange = (val: string) => {
    setMinutes(val);
    if (timeTouched.minutes) {
      setTimeErrors(validateTime(val, seconds));
    }
  };

  const handleSecondsChange = (val: string) => {
    setSeconds(val);
    if (timeTouched.seconds) {
      setTimeErrors(validateTime(minutes, val));
    }
  };

  const handleMinutesBlur = () => {
    setTimeTouched((prev) => ({ ...prev, minutes: true }));
    setTimeErrors(validateTime(minutes, seconds));
  };

  const handleSecondsBlur = () => {
    setTimeTouched((prev) => ({ ...prev, seconds: true }));
    setTimeErrors(validateTime(minutes, seconds));
  };

  const handleRecordTime = async () => {
    // Touch all fields
    setTimeTouched({ minutes: true, seconds: true });
    const errors = validateTime(minutes, seconds);
    setTimeErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the time errors before saving.');
      return;
    }

    if (!selectedParticipant) return;
    setIsLoading(true);

    const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
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
      handleCloseDialog();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record time');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setSelectedParticipant(null);
    setMinutes('');
    setSeconds('');
    setTimeErrors({});
    setTimeTouched({ minutes: false, seconds: false });
  };

  const totalSeconds =
    minutes !== '' && seconds !== ''
      ? parseInt(minutes || '0') * 60 + parseInt(seconds || '0')
      : null;

  const totalPages = Math.ceil(total / perPage);

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

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
            maxLength={60}
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
        <Dialog open={!!selectedParticipant} onOpenChange={handleCloseDialog}>
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
                    <Label>Minutes <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      placeholder="0 – 30"
                      value={minutes}
                      onChange={(e) => handleMinutesChange(e.target.value)}
                      onBlur={handleMinutesBlur}
                      min={0}
                      max={30}
                      step={1}
                      className={timeTouched.minutes && timeErrors.minutes ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    <FieldError msg={timeTouched.minutes ? timeErrors.minutes : undefined} />
                    <p className="text-xs text-muted-foreground">Whole number, 0–30</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Seconds <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      placeholder="0 – 59"
                      value={seconds}
                      onChange={(e) => handleSecondsChange(e.target.value)}
                      onBlur={handleSecondsBlur}
                      min={0}
                      max={59}
                      step={1}
                      className={timeTouched.seconds && timeErrors.seconds ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    <FieldError msg={timeTouched.seconds ? timeErrors.seconds : undefined} />
                    <p className="text-xs text-muted-foreground">Whole number, 0–59</p>
                  </div>
                </div>

                {totalSeconds !== null && !timeErrors.minutes && !timeErrors.seconds && minutes !== '' && seconds !== '' && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Total: {minutes}m {seconds}s = {totalSeconds}s
                    </p>
                    <Badge
                      variant={totalSeconds <= 360 ? 'default' : 'destructive'}
                      className="mt-1"
                    >
                      {totalSeconds <= 360 ? 'QUALIFIED' : 'DISQUALIFIED'}
                    </Badge>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
              <Button
                className="gradient-primary text-primary-foreground"
                onClick={handleRecordTime}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Result'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
