-- database.sql
-- Run this in your Supabase SQL Editor to create the required tables and security rules

CREATE TABLE IF NOT EXISTS public.officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    police_id TEXT UNIQUE NOT NULL
);

-- Enable RLS and create a policy to allow reading the officers table during signup verification
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access to verify officers during signup"
ON public.officers
FOR SELECT
TO public, anon
USING (true);

-- You can also run this to insert a test officer
/*
INSERT INTO public.officers (name, email, police_id) 
VALUES ('Test Officer', 'officer@police.gov.in', 'POLICE-12345');
*/
