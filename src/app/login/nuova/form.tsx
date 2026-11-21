"use client";

import { useEffect, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ActionNotice } from "@/components/action-notice";
import { fieldInvalid } from "@/domain/forms";
import { recoveryHash } from "@/domain/recovery";

let recoveryClient: SupabaseClient | null = null;

function recoveryBrowser() {
  if (recoveryClient) return recoveryClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  recoveryClient = createClient(url, key, {
    auth: { flowType: "implicit", detectSessionInUrl: true, persistSession: true },
  });
  return recoveryClient;
}

export function NewPasswordForm() {
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const arrival = recoveryHash(window.location.hash);
    if (arrival.kind === "expired") {
      setError("Questo link non è più valido.");
      return;
    }
    if (arrival.kind !== "ready") return;
    const supabase = recoveryBrowser();
    if (!supabase) {
      setError("Non riesco ad aprire questo link.");
      return;
    }
    void supabase.auth
      .setSession({ access_token: arrival.accessToken, refresh_token: arrival.refreshToken })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          setError("Non riesco ad aprire questo link.");
          return;
        }
        setReady(true);
      });
  }, []);

  async function onSubmit(formData: FormData) {
    setError("");
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (password.length < 6) {
      setError("La password è troppo corta.");
      return;
    }
    if (password !== confirm) {
      setError("Le due password non coincidono.");
      return;
    }
    const supabase = recoveryBrowser();
    if (!supabase) {
      setError("Non riesco ad aprire questo link.");
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Non sono riuscito a salvare la password.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="mt-6">
        Password aggiornata. <a href="/app">Entra</a>
      </p>
    );
  }
  if (!ready) {
    return <p className="mt-6">{error || "Apri il link che ti è arrivato per mail."}</p>;
  }
  return (
    <form action={onSubmit} className={`mt-8 grid gap-4 ${fieldInvalid(error)}`.trim()}>
      <label className="field">
        <span>Nuova password</span>
        <input name="password" type="password" autoComplete="new-password" required />
      </label>
      <label className="field">
        <span>Ripeti la password</span>
        <input name="confirm" type="password" autoComplete="new-password" required />
      </label>
      <ActionNotice message={error} />
      <button className="btn" type="submit">
        Salva la password
      </button>
    </form>
  );
}
