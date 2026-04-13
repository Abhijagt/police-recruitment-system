import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/StatCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TestResult {
  participant_id: string;
  name: string;
  district: string;
  running_time: number;
  result: string;
}

export default function Reports() {
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [qualified, setQualified] = useState(0);
  const [avgTime, setAvgTime] = useState('0:00');
  const [qualificationRate, setQualificationRate] = useState(0);
  const [districtData, setDistrictData] = useState<{ name: string; count: number }[]>([]);
  const [qualifiedList, setQualifiedList] = useState<TestResult[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data: participants } = await supabase.from('participants').select('*');
    const { data: tests } = await supabase.from('running_tests').select('*');

    const total = participants?.length || 0;
    setTotalParticipants(total);

    const qualTests = tests?.filter(t => t.result === 'Qualified') || [];
    setQualified(qualTests.length);

    if (total > 0 && tests && tests.length > 0) {
      setQualificationRate(Math.round((qualTests.length / tests.length) * 100));
    }

    if (tests && tests.length > 0) {
      const avg = tests.reduce((sum, t) => sum + Number(t.running_time), 0) / tests.length;
      const mins = Math.floor(avg / 60);
      const secs = Math.round(avg % 60);
      setAvgTime(`${mins}:${secs.toString().padStart(2, '0')}s`);
    }

    // District-wise
    const districtMap: Record<string, number> = {};
    participants?.forEach(p => {
      districtMap[p.district] = (districtMap[p.district] || 0) + 1;
    });
    setDistrictData(Object.entries(districtMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));

    // Qualified list with names
    if (tests && participants) {
      const pMap = new Map(participants.map(p => [p.participant_id, p]));
      const list: TestResult[] = tests.map(t => {
        const p = pMap.get(t.participant_id);
        return {
          participant_id: t.participant_id,
          name: p?.name || 'Unknown',
          district: p?.district || 'Unknown',
          running_time: Number(t.running_time),
          result: t.result,
        };
      });
      setQualifiedList(list);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const downloadCsv = (status: 'Qualified' | 'Disqualified') => {
    const rows = qualifiedList.filter((r) => r.result === status);
    const header = ['Chest No.', 'Name', 'District', 'Time', 'Result'];
    const csvData = [header.join(',')].concat(
      rows.map((r) => [
        r.participant_id,
        r.name,
        r.district,
        formatTime(r.running_time),
        r.result,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
      )
    );

    const blob = new Blob([csvData.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${status.toLowerCase()}-candidates.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPdf = (status: 'Qualified' | 'Disqualified') => {
    const rows = qualifiedList.filter((r) => r.result === status);
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    doc.setFontSize(16);
    doc.text(`${status} Candidates Report`, 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 56);

    const headers = ['Chest No.', 'Name', 'District', 'Time', 'Result'];
    const columnWidths = [80, 160, 120, 70, 90];
    const rowHeight = 16;
    let y = 84;

    const drawRow = (cells: string[], yPos: number) => {
      let x = 40;
      cells.forEach((cell, index) => {
        doc.text(cell, x, yPos);
        x += columnWidths[index];
      });
    };

    drawRow(headers, y);
    y += rowHeight;

    rows.forEach((row) => {
      if (y > 740) {
        doc.addPage();
        y = 40;
        drawRow(headers, y);
        y += rowHeight;
      }

      drawRow([
        row.participant_id,
        row.name,
        row.district,
        formatTime(row.running_time),
        row.result,
      ], y);
      y += rowHeight;
    });

    doc.save(`${status.toLowerCase()}-candidates-report.pdf`);
  };

  const COLORS = ['hsl(160, 70%, 36%)', 'hsl(0, 72%, 51%)', 'hsl(38, 92%, 50%)'];
  const pieData = [
    { name: 'Qualified', value: qualified },
    { name: 'Disqualified', value: qualifiedList.filter(q => q.result === 'Disqualified').length },
  ];

  return (
    <AppLayout title="Reports & Analytics">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Participants" value={totalParticipants.toLocaleString()} icon={<Users className="h-4 w-4 text-primary" />} />
          <StatCard title="Qualified" value={qualified.toLocaleString()} icon={<CheckCircle className="h-4 w-4 text-primary" />} />
          <StatCard title="Qualification Rate" value={`${qualificationRate}%`} icon={<BarChart3 className="h-4 w-4 text-primary" />} />
          <StatCard title="Avg. 1.6km Time" value={avgTime} icon={<Clock className="h-4 w-4 text-primary" />} />
        </div>

        {/* Qualification Rate Progress */}
        <div className="stat-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Qualification Rate</h3>
          <div className="flex items-center gap-4">
            <Progress value={qualificationRate} className="flex-1 h-3" />
            <span className="text-2xl font-bold text-foreground">{qualificationRate}%</span>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* District Chart */}
          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-4">District-wise Participants</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={districtData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(160, 15%, 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(160, 70%, 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-4">Result Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Qualified Candidates List */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-5 border-b flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-foreground">All Test Results</h3>
              <p className="text-xs text-muted-foreground mt-1">Live data from automatic timing RFID systems</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadCsv('Qualified')}>
                Export Qualified
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadCsv('Disqualified')}>
                Export Disqualified
              </Button>
              <Button size="sm" onClick={() => downloadPdf('Qualified')}>
                PDF Qualified
              </Button>
              <Button size="sm" onClick={() => downloadPdf('Disqualified')}>
                PDF Disqualified
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chest No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qualifiedList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No test results recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                qualifiedList.map((r) => (
                  <TableRow key={r.participant_id}>
                    <TableCell className="font-semibold text-primary">{r.participant_id}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.district}</TableCell>
                    <TableCell>{formatTime(r.running_time)}</TableCell>
                    <TableCell>
                      <Badge variant={r.result === 'Qualified' ? 'default' : 'destructive'}>
                        {r.result}
                      </Badge>
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
