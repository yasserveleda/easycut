GRANT INSERT ON public.appointments TO anon;
GRANT INSERT ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

DROP POLICY IF EXISTS "Appointments public insert" ON public.appointments;
CREATE POLICY "Appointments public insert"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);