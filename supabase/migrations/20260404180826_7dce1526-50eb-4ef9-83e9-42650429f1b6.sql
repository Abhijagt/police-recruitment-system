-- Create participants table
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  district TEXT NOT NULL,
  category TEXT NOT NULL,
  batch_no TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create running_tests table
CREATE TABLE public.running_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES public.participants(participant_id) ON DELETE CASCADE,
  running_time NUMERIC NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('Qualified', 'Disqualified')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.running_tests ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can view participants" ON public.participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert participants" ON public.participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update participants" ON public.participants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete participants" ON public.participants FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view running_tests" ON public.running_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert running_tests" ON public.running_tests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update running_tests" ON public.running_tests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete running_tests" ON public.running_tests FOR DELETE TO authenticated USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();