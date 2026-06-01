DROP POLICY IF EXISTS "Appointments public insert" ON public.appointments;
REVOKE INSERT ON public.appointments FROM anon;
REVOKE INSERT ON public.appointments FROM authenticated;
DROP FUNCTION IF EXISTS public.create_public_appointment(uuid, uuid, text, text, text, date, text, text);