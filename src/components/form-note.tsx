"use client";

import { useActionState, type ReactNode } from "react";
import { ActionNotice } from "@/components/action-notice";
import { fieldInvalid } from "@/domain/forms";

type State = { error?: string; ok?: boolean };

export function FormNote({
  action,
  children,
}: {
  action: (state: State, formData: FormData) => Promise<State>;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={`grid gap-4 ${fieldInvalid(state.error)}`.trim()}>
      {children}
      <ActionNotice message={state.error} />
      {state.ok ? <p>Salvato.</p> : null}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Salvo" : "Salva"}
      </button>
    </form>
  );
}
