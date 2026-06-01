import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CreateAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  clientName: z.string().trim().min(2).max(120),
  clientPhone: z.string().trim().min(10).max(30),
  clientEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().max(500).optional(),
});

export const createPublicAppointment = createServerFn({ method: "POST" })
  .inputValidator((input) => CreateAppointmentSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("id,duration_min,active")
      .eq("id", data.serviceId)
      .eq("active", true)
      .maybeSingle();

    if (serviceError) throw new Error(serviceError.message);
    if (!service) throw new Error("Serviço indisponível para agendamento");

    const { data: staff, error: staffError } = await supabaseAdmin
      .from("staff")
      .select("id,service_ids")
      .eq("id", data.staffId)
      .maybeSingle();

    if (staffError) throw new Error(staffError.message);
    if (!staff?.service_ids?.includes(data.serviceId)) {
      throw new Error("Profissional indisponível para este serviço");
    }

    const { data: appointment, error } = await supabaseAdmin
      .from("appointments")
      .insert({
        service_id: data.serviceId,
        staff_id: data.staffId,
        client_name: data.clientName.trim(),
        client_phone: data.clientPhone.trim(),
        client_email: data.clientEmail?.trim() || null,
        date: data.date,
        start_time: data.startTime,
        duration_min: service.duration_min,
        status: "pendente",
        notes: data.notes?.trim() || null,
      })
      .select("id,created_at,duration_min,status")
      .single();

    if (error) throw new Error(error.message);

    return {
      id: appointment.id,
      createdAt: appointment.created_at,
      durationMin: appointment.duration_min,
      status: appointment.status,
    };
  });
