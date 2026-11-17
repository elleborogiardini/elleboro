"use client";

import { useEffect, useState } from "react";
import { ActionNotice } from "@/components/action-notice";
import { fieldInvalid } from "@/domain/forms";
import { createBrowser } from "@/lib/supabase/browser";

export function NewPasswordForm() {
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (!accessToken || !refreshToken) return;
    const supabase = createBrowser();
    void supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(
      ({ error: sessionError }) => {
        if (!sessionError) setReady(true);
      },
    );
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
    const { error: updateError } = await createBrowser().auth.updateUser({ password });
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
    return <p className="mt-6">Apri il link che ti è arrivato per mail.</p>;
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
