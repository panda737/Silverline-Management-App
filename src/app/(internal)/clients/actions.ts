"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

const clientSchema = z.object({
  company_name: z.string().trim().min(2, "Enter the company name"),
  industry: optionalText,
  address: optionalText,
  notes: optionalText,
});

export type ClientFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"company_name" | "industry" | "address" | "notes", string[]>>;
};

export async function createClientCompany(
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  // Client companies are managed by admins (RLS enforces the same rule).
  const profile = await getProfile();
  if (!profile || profile.role !== "admin" || !profile.active) {
    return { error: "Only admins can add clients." };
  }

  const parsed = clientSchema.safeParse({
    company_name: formData.get("company_name"),
    industry: formData.get("industry") ?? "",
    address: formData.get("address") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ClientFormState["fieldErrors"],
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...parsed.data, created_by: profile.id })
    .select("id")
    .single();
  if (error) {
    return { error: `Could not add client: ${error.message}` };
  }

  await supabase.from("activity_log").insert({
    actor_id: profile.id,
    action: "client_created",
    details: { company_name: parsed.data.company_name, client_id: data.id },
  });

  revalidatePath("/clients");
  return { success: `${parsed.data.company_name} added.` };
}

const contactSchema = z.object({
  client_id: z.string().uuid(),
  name: z.string().trim().min(2, "Enter the contact's name"),
  email: optionalText,
  phone: optionalText,
  role_title: optionalText,
  is_primary: z.coerce.boolean(),
});

export type ContactFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "phone" | "role_title", string[]>>;
};

export async function addContact(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin" || !profile.active) {
    return { error: "Only admins can add contacts." };
  }

  const parsed = contactSchema.safeParse({
    client_id: formData.get("client_id"),
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    role_title: formData.get("role_title") ?? "",
    is_primary: formData.get("is_primary") === "on",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ContactFormState["fieldErrors"],
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("client_contacts").insert(parsed.data);
  if (error) {
    return { error: `Could not add contact: ${error.message}` };
  }

  revalidatePath(`/clients/${parsed.data.client_id}`);
  return { success: "Contact added." };
}
