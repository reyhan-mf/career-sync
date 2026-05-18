import { supabase } from "./client";

export interface RegisterHrInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  companyName: string;
  industry: string | null;
  website: string | null;
}

export async function registerHr(input: RegisterHrInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke("register-hr", {
    body: input,
  });
  if (error) {
    const fnMsg = (data as { error?: string } | null)?.error;
    throw new Error(fnMsg ?? error.message);
  }
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
}
