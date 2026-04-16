import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserPlus, Hash, User, Calendar, MapPin, Tag, Layers } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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
      setForm({ participant_id: '', name: '', age: '', gender: '', district: '', category: '', batch_no: '' });
      navigate('/running-test');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add participant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ participant_id: '', name: '', age: '', gender: '', district: '', category: '', batch_no: '' });
  };

  return (
    <AppLayout title="Add New Participant">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Add New Participant</h2>
                <p className="text-sm text-muted-foreground">Register a candidate for the 2026 Physical Endurance Test.</p>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Identification */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-3">
                  {/* <Hash className="h-4 w-4" /> Identification & Name */}
                </h3>
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
                {/* <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" /> Demographics
                </h3> */}
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
                {/* <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4" /> Test Classification
                </h3> */}
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
                  {isLoading ? 'Saving...' : '✓ Save Participant'}
                </Button>
              </div>

              <div className="bg-secondary rounded-lg p-3 text-xs text-muted-foreground">
                <p>⚠ Ensure all details are cross-verified with physical documents. Participant ID must be unique for the current recruitment cycle. Once saved, the participant will be eligible for the next scheduled running heat.</p>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
