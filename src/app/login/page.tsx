"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionNotice } from "@/components/action-notice";
import { fieldInvalid } from "@/domain/forms";
import { createBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  async function onSubmit(formData: FormData) {
    setError("");
    if (!configured) {
      setError("Il gestionale non è ancora collegato.");
      return;
    }
    setPending(true);
    const supabase = createBrowser();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    setPending(false);
    if (signError) {
      setError("Email o password non valide.");
      return;
    }
    router.replace("/app");
    router.refresh();
  }

  return (
    <main className="mx-auto grid min-h-[100dvh] max-w-md content-center px-5">
      <h1 className="text-4xl">Elleboro</h1>
      <p className="mt-2 text-[var(--muted)]">Accesso per chi cura i giardini.</p>
      <form action={onSubmit} className={`mt-8 grid gap-4 ${fieldInvalid(error)}`.trim()}>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <ActionNotice message={error} />
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Entro" : "Entra"}
        </button>
      </form>
    </main>
  );
}
