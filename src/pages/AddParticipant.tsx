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

// ── Validation rules ──────────────────────────────────────────────────────────
const PARTICIPANT_ID_REGEX = /^PR-\d{4}-\d{1,6}$/;
const NAME_REGEX = /^[A-Za-z\s.'-]{3,60}$/;
const BATCH_NO_REGEX = /^B-\d{1,3}$/;

interface FormErrors {
  participant_id?: string;
  name?: string;
  age?: string;
  gender?: string;
  district?: string;
  category?: string;
  batch_no?: string;
}

function validateForm(form: {
  participant_id: string;
  name: string;
  age: string;
  gender: string;
  district: string;
  category: string;
  batch_no: string;
}): FormErrors {
  const errors: FormErrors = {};

  // Participant ID
  if (!form.participant_id.trim()) {
    errors.participant_id = 'Participant ID is required.';
  } else if (!PARTICIPANT_ID_REGEX.test(form.participant_id.trim())) {
    errors.participant_id = 'Format must be PR-YYYY-NNNN (e.g. PR-2024-8892).';
  }

  // Name
  if (!form.name.trim()) {
    errors.name = 'Full name is required.';
  } else if (!NAME_REGEX.test(form.name.trim())) {
    errors.name = 'Name must be 3–60 characters, letters only (spaces, hyphens, apostrophes allowed).';
  }

  // Age
  if (!form.age) {
    errors.age = 'Age is required.';
  } else {
    const ageNum = Number(form.age);
    if (!Number.isInteger(ageNum) || form.age.includes('.')) {
      errors.age = 'Age must be a whole number.';
    } else if (ageNum < 18 || ageNum > 40) {
      errors.age = 'Age must be between 18 and 40.';
    }
  }

  // Gender
  if (!form.gender) {
    errors.gender = 'Please select a gender.';
  }

  // District
  if (!form.district) {
    errors.district = 'Please select a home district.';
  }

  // Category
  if (!form.category) {
    errors.category = 'Please select a category.';
  }

  // Batch Number
  if (!form.batch_no.trim()) {
    errors.batch_no = 'Batch number is required.';
  } else if (!BATCH_NO_REGEX.test(form.batch_no.trim())) {
    errors.batch_no = 'Format must be B-N or B-NN (e.g. B-12).';
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────

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
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
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

  // Validate a single field on blur
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateForm(form));
  };

  // Live-validate only already-touched fields
  const handleChange = (field: string, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) {
      setErrors(validateForm(updated));
    }
  };

  // Select fields mark themselves touched immediately on change
  const handleSelectChange = (field: string, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateForm(updated));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched so every error shows
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix the errors before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing) {
        const { error } = await supabase.from('participants').update({
          participant_id: form.participant_id.trim(),
          name: form.name.trim(),
          age: parseInt(form.age),
          gender: form.gender,
          district: form.district,
          category: form.category,
          batch_no: form.batch_no.trim(),
        }).eq('participant_id', originalId);

        if (error) throw error;
        toast.success('Participant updated successfully!');
      } else {
        const { error } = await supabase.from('participants').insert({
          participant_id: form.participant_id.trim(),
          name: form.name.trim(),
          age: parseInt(form.age),
          gender: form.gender,
          district: form.district,
          category: form.category,
          batch_no: form.batch_no.trim(),
        });

        if (error) throw error;
        toast.success('Participant added successfully!');
      }

      setForm({ participant_id: '', name: '', age: '', gender: '', district: '', category: '', batch_no: '' });
      setErrors({});
      setTouched({});
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
    setErrors({});
    setTouched({});
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
    setErrors({});
    setTouched({});
    setIsEditing(false);
    setOriginalId('');
  };

  // Helper: error message below a field
  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

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

          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-6">
              {/* Identification */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Participant ID <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="e.g. PR-2024-8892"
                      value={form.participant_id}
                      onChange={(e) => handleChange('participant_id', e.target.value)}
                      onBlur={() => handleBlur('participant_id')}
                      maxLength={20}
                      className={touched.participant_id && errors.participant_id ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    <FieldError msg={touched.participant_id ? errors.participant_id : undefined} />
                    <p className="text-xs text-muted-foreground">Format: PR-YYYY-NNNN</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Full Legal Name <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Enter as per Aadhaar/ID"
                      value={form.name}
                      onChange={(e) => {
                        // Block digits from being typed in the name field
                        const val = e.target.value.replace(/[0-9]/g, '');
                        handleChange('name', val);
                      }}
                      onBlur={() => handleBlur('name')}
                      maxLength={60}
                      className={touched.name && errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    <FieldError msg={touched.name ? errors.name : undefined} />
                    <p className="text-xs text-muted-foreground">Letters only, 3–60 characters</p>
                  </div>
                </div>
              </div>

              {/* Demographics */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Age <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      placeholder="18 – 40"
                      value={form.age}
                      onChange={(e) => handleChange('age', e.target.value)}
                      onBlur={() => handleBlur('age')}
                      min={18}
                      max={40}
                      step={1}
                      className={touched.age && errors.age ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    <FieldError msg={touched.age ? errors.age : undefined} />
                    <p className="text-xs text-muted-foreground">Must be between 18 and 40</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender <span className="text-red-500">*</span></Label>
                    <Select value={form.gender} onValueChange={(v) => handleSelectChange('gender', v)}>
                      <SelectTrigger className={touched.gender && errors.gender ? 'border-red-500 focus:ring-red-500' : ''}>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FieldError msg={touched.gender ? errors.gender : undefined} />
                  </div>
                  <div className="space-y-2">
                    <Label>Home District <span className="text-red-500">*</span></Label>
                    <Select value={form.district} onValueChange={(v) => handleSelectChange('district', v)}>
                      <SelectTrigger className={touched.district && errors.district ? 'border-red-500 focus:ring-red-500' : ''}>
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FieldError msg={touched.district ? errors.district : undefined} />
                  </div>
                </div>
              </div>

              {/* Classification */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category <span className="text-red-500">*</span></Label>
                    <Select value={form.category} onValueChange={(v) => handleSelectChange('category', v)}>
                      <SelectTrigger className={touched.category && errors.category ? 'border-red-500 focus:ring-red-500' : ''}>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FieldError msg={touched.category ? errors.category : undefined} />
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Number <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="e.g. B-12"
                      value={form.batch_no}
                      onChange={(e) => handleChange('batch_no', e.target.value.toUpperCase())}
                      onBlur={() => handleBlur('batch_no')}
                      maxLength={6}
                      className={touched.batch_no && errors.batch_no ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    <FieldError msg={touched.batch_no ? errors.batch_no : undefined} />
                    <p className="text-xs text-muted-foreground">Format: B-N or B-NN (e.g. B-12)</p>
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
