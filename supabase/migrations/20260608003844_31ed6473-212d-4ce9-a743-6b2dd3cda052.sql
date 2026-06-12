GRANT SELECT ON public.appointments TO anon;
GRANT SELECT ON public.appointments TO authenticated;

DROP POLICY IF EXISTS "Appointments public insert returning" ON public.appointments;
CREATE POLICY "Appointments public insert returning"
ON public.appointments
FOR SELECT
TO anon, authenticated
USING (current_setting('request.method', true) = 'POST');