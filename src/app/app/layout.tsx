import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { RegisterSw, Shell } from "@/components/shell";
import { getRole } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }
  const role = await getRole();
  if (!role) redirect("/login");
  return (
    <>
      <RegisterSw />
      <Shell role={role}>{children}</Shell>
    </>
  );
}
