import { createClient } from "@supabase/supabase-js";
import { hasServiceRole } from "@/lib/supabase/env";

export function createAdmin() {
  if (!hasServiceRole()) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
