
-- =========================================
-- ROLES & PROFILES
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Trigger: create profile + bootstrap first user as admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email));

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO is_first;

  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- SERVICES
-- =========================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_min INTEGER NOT NULL DEFAULT 30,
  category TEXT NOT NULL DEFAULT 'outros',
  color TEXT NOT NULL DEFAULT '#D9A441',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services public read" ON public.services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Services admin insert" ON public.services FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Services admin update" ON public.services FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Services admin delete" ON public.services FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- STAFF
-- =========================================
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  avatar_color TEXT NOT NULL DEFAULT '#D9A441',
  service_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.staff TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff public read" ON public.staff FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff admin insert" ON public.staff FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff admin update" ON public.staff FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff admin delete" ON public.staff FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- APPOINTMENTS
-- =========================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  date DATE NOT NULL,
  start_time TEXT NOT NULL, -- "HH:mm"
  duration_min INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.appointments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
-- Public can create bookings
CREATE POLICY "Appointments public insert" ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Admins can view all
CREATE POLICY "Appointments admin read" ON public.appointments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Appointments admin update" ON public.appointments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Appointments admin delete" ON public.appointments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Public booking flow needs to know occupied slots without exposing client PII.
CREATE OR REPLACE FUNCTION public.get_busy_slots(_from DATE, _to DATE)
RETURNS TABLE (staff_id UUID, date DATE, start_time TEXT, duration_min INTEGER, status TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT staff_id, date, start_time, duration_min, status
  FROM public.appointments
  WHERE date BETWEEN _from AND _to AND status <> 'cancelado'
$$;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(DATE, DATE) TO anon, authenticated;

-- Client lookup by phone for "Meus agendamentos"
CREATE OR REPLACE FUNCTION public.get_appointments_by_phone(_phone TEXT)
RETURNS SETOF public.appointments
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.appointments
  WHERE regexp_replace(client_phone, '\D', '', 'g') = regexp_replace(_phone, '\D', '', 'g')
  ORDER BY date, start_time
$$;
GRANT EXECUTE ON FUNCTION public.get_appointments_by_phone(TEXT) TO anon, authenticated;

-- Client cancellation by phone+id (anonymous)
CREATE OR REPLACE FUNCTION public.cancel_appointment_by_phone(_id UUID, _phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  updated INTEGER;
BEGIN
  UPDATE public.appointments
  SET status = 'cancelado'
  WHERE id = _id
    AND regexp_replace(client_phone, '\D', '', 'g') = regexp_replace(_phone, '\D', '', 'g')
    AND status NOT IN ('cancelado', 'finalizado');
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.cancel_appointment_by_phone(UUID, TEXT) TO anon, authenticated;

-- =========================================
-- BLOCKED SLOTS
-- =========================================
CREATE TABLE public.blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blocked_slots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_slots TO authenticated;
GRANT ALL ON public.blocked_slots TO service_role;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blocked public read" ON public.blocked_slots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Blocked admin insert" ON public.blocked_slots FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Blocked admin update" ON public.blocked_slots FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Blocked admin delete" ON public.blocked_slots FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- SETTINGS (single row, key = 'default')
-- =========================================
CREATE TABLE public.settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  salon_name TEXT NOT NULL DEFAULT 'Atelier Estúdio',
  buffer_min INTEGER NOT NULL DEFAULT 0,
  business_hours JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings public read" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Settings admin insert" ON public.settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Settings admin update" ON public.settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- SEED
-- =========================================
INSERT INTO public.settings (id, salon_name, buffer_min, business_hours) VALUES (
  'default', 'Atelier Estúdio', 0,
  '[
    {"weekday":0,"open":false,"start":"09:00","end":"18:00"},
    {"weekday":1,"open":true,"start":"09:00","end":"19:00"},
    {"weekday":2,"open":true,"start":"09:00","end":"19:00"},
    {"weekday":3,"open":true,"start":"09:00","end":"19:00"},
    {"weekday":4,"open":true,"start":"09:00","end":"20:00"},
    {"weekday":5,"open":true,"start":"09:00","end":"20:00"},
    {"weekday":6,"open":true,"start":"08:00","end":"17:00"}
  ]'::jsonb
);

-- Seed services & staff
DO $$
DECLARE
  s1 UUID; s2 UUID; s3 UUID; s4 UUID; s5 UUID; s6 UUID;
BEGIN
  INSERT INTO public.services (name, description, price, duration_min, category, color) VALUES
    ('Corte masculino','Tesoura + máquina, finalização com produto.',60,30,'cabelo','#D9A441') RETURNING id INTO s1;
  INSERT INTO public.services (name, description, price, duration_min, category, color) VALUES
    ('Barba','Modelagem completa com toalha quente.',45,30,'barba','#7B5E3B') RETURNING id INTO s2;
  INSERT INTO public.services (name, description, price, duration_min, category, color) VALUES
    ('Corte + barba','Combo completo.',95,60,'combo','#A87C3B') RETURNING id INTO s3;
  INSERT INTO public.services (name, description, price, duration_min, category, color) VALUES
    ('Sobrancelha','Design e alinhamento.',25,15,'estetica','#5A8DA8') RETURNING id INTO s4;
  INSERT INTO public.services (name, description, price, duration_min, category, color) VALUES
    ('Pigmentação','Cobertura de fios brancos.',120,60,'cabelo','#8E5A8C') RETURNING id INTO s5;
  INSERT INTO public.services (name, description, price, duration_min, category, color) VALUES
    ('Corte feminino','Lavagem, corte e finalização.',110,75,'cabelo','#C56E8E') RETURNING id INTO s6;

  INSERT INTO public.staff (name, role, avatar_color, service_ids) VALUES
    ('Rafael Souza', 'Barbeiro Sênior', '#D9A441', ARRAY[s1, s2, s3, s4]),
    ('Marina Lopes', 'Cabeleireira', '#C56E8E', ARRAY[s5, s6, s4]),
    ('Diego Alves', 'Barbeiro', '#5A8DA8', ARRAY[s1, s2, s3]);
END $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
