CREATE OR REPLACE FUNCTION public.create_public_appointment(
  _service_id uuid,
  _staff_id uuid,
  _client_name text,
  _client_phone text,
  _client_email text,
  _date date,
  _start_time text,
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_duration integer;
  appointment_id uuid;
BEGIN
  SELECT duration_min
  INTO service_duration
  FROM public.services
  WHERE id = _service_id
    AND active = true;

  IF service_duration IS NULL THEN
    RAISE EXCEPTION 'Serviço indisponível para agendamento';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.staff
    WHERE id = _staff_id
      AND _service_id = ANY(service_ids)
  ) THEN
    RAISE EXCEPTION 'Profissional indisponível para este serviço';
  END IF;

  INSERT INTO public.appointments (
    service_id,
    staff_id,
    client_name,
    client_phone,
    client_email,
    date,
    start_time,
    duration_min,
    status,
    notes
  ) VALUES (
    _service_id,
    _staff_id,
    btrim(_client_name),
    btrim(_client_phone),
    NULLIF(btrim(COALESCE(_client_email, '')), ''),
    _date,
    btrim(_start_time),
    service_duration,
    'pendente',
    NULLIF(btrim(COALESCE(_notes, '')), '')
  )
  RETURNING id INTO appointment_id;

  RETURN appointment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_appointment(uuid, uuid, text, text, text, date, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_appointment(uuid, uuid, text, text, text, date, text, text) TO anon, authenticated;

COMMENT ON FUNCTION public.create_public_appointment(uuid, uuid, text, text, text, date, text, text)
IS 'Creates public appointments after validating active service and eligible staff, without exposing appointment rows publicly.';