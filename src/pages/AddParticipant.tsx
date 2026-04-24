import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { UserPlus, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const districts = ["Ahilyanagar", "Akola", "Amravati", "Chhatrapati Sambhajinagar", "Beed",
  "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli",
  "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur",
  "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur",
  "Nanded", "Nandurbar", "Nashik", "Osmanabad",
  "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri",
  "Sangli", "Satara", "Sindhudurg", "Solapur",
  "Thane", "Wardha", "Washim", "Yavatmal"];
const categories = ['General', 'OBC', 'SC', 'ST', 'EWS'];
const genders = ['Male', 'Female', 'Other'];

export default function AddParticipant() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    participant_id: '',
    name: '',
    age: '',
    gender: '',
    district: '',
    category: '',
    batch_no: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [originalId, setOriginalId] = useState('');

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false });
    setParticipants(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing) {
        const { error } = await supabase.from('participants').update({
          participant_id: form.participant_id,
          name: form.name,
          age: parseInt(form.age),
          gender: form.gender,
          district: form.district,
          category: form.category,
          batch_no: form.batch_no,
        }).eq('participant_id', originalId);

        if (error) throw error;
        toast.success('Participant updated successfully!');
      } else {
        const { error } = await supabase.from('participants').insert({
          participant_id: form.participant_id,
          name: form.name,
          age: parseInt(form.age),
          gender: form.gender,
          district: form.district,
          category: form.category,
          batch_no: form.batch_no,
        });

        if (error) throw error;
        toast.success('Participant added successfully!');
      }
      
      setForm({ participant_id: '', name: '', age: '', gender: '', district: '', category: '', batch_no: '' });
      setIsEditing(false);
      setOriginalId('');
      fetchParticipants();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save participant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (p: any) => {
    setForm({
      participant_id: p.participant_id,
      name: p.name,
      age: p.age.toString(),
      gender: p.gender,
      district: p.district,
      category: p.category,
      batch_no: p.batch_no,
    });
    setOriginalId(p.participant_id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this participant?')) return;
    try {
      const { error } = await supabase.from('participants').delete().eq('participant_id', id);
      if (error) throw error;
      toast.success('Participant deleted successfully!');
      fetchParticipants();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete participant');
    }
  };

  const handleReset = () => {
    setForm({ participant_id: '', name: '', age: '', gender: '', district: '', category: '', batch_no: '' });
    setIsEditing(false);
    setOriginalId('');
  };

  return (
    <AppLayout title={isEditing ? "Edit Participant" : "Add New Participant"}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {isEditing ? "Edit Participant" : "Add New Participant"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isEditing ? "Update candidate details." : "Register a candidate for the 2026 Physical Endurance Test."}
                </p>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Identification */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Participant ID</Label>
                    <Input
                      placeholder="e.g. PR-2024-8892"
                      value={form.participant_id}
                      onChange={(e) => setForm({ ...form, participant_id: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Legal Name</Label>
                    <Input
                      placeholder="Enter as per Aadhaar/ID"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Demographics */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      placeholder="Years"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      required
                      min={18}
                      max={40}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                      <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                      <SelectContent>
                        {genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Home District</Label>
                    <Select value={form.district} onValueChange={(v) => setForm({ ...form, district: v })}>
                      <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                      <SelectContent>
                        {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Classification */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Number</Label>
                    <Input
                      placeholder="e.g. B-12"
                      value={form.batch_no}
                      onChange={(e) => setForm({ ...form, batch_no: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={handleReset}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gradient-primary text-primary-foreground font-semibold" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (isEditing ? '✓ Update Participant' : '✓ Save Participant')}
                </Button>
              </div>

              {!isEditing && (
                <div className="bg-secondary rounded-lg p-3 text-xs text-muted-foreground">
                  <p>⚠ Ensure all details are cross-verified with physical documents. Participant ID must be unique for the current recruitment cycle. Once saved, the participant will be eligible for the next scheduled running heat.</p>
                </div>
              )}
            </CardContent>
          </form>
        </Card>

        {/* Existing Participants List */}
        <Card className="shadow-lg">
          <CardHeader>
            <h3 className="text-lg font-bold text-foreground">Registered Participants</h3>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                        No participants registered yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    participants.map((p) => (
                      <TableRow key={p.participant_id}>
                        <TableCell className="font-medium text-primary">{p.participant_id}</TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.batch_no}</TableCell>
                        <TableCell>{p.district}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(p)}>
                              <Edit2 className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(p.participant_id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
