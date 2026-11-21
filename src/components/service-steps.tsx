"use client";

import { useRef, useState, type FormEvent } from "react";
import { ActionNotice } from "@/components/action-notice";
import { actionNotice } from "@/domain/forms";
import { saveServicesAction } from "@/server/actions";

type Step = { key: string; title: string; body: string };

export function ServiceSteps({
  steps,
  message,
}: {
  steps: { title: string; body: string }[];
  message?: string;
}) {
  const [rows, setRows] = useState<Step[]>(() =>
    steps.map((step, index) => ({
      key: `step-${index}`,
      title: step.title,
      body: step.body,
    })),
  );
  const nextKey = useRef(steps.length);
  const [localError, setLocalError] = useState<string | undefined>();
  const shown = localError ?? message;
  const invalid = actionNotice(shown) !== null;

  function add() {
    setLocalError(undefined);
    const key = `step-${nextKey.current}`;
    nextKey.current += 1;
    setRows((current) => [...current, { key, title: "", body: "" }]);
  }

  function remove(key: string) {
    setLocalError(undefined);
    setRows((current) => (current.length < 2 ? current : current.filter((row) => row.key !== key)));
  }

  function change(key: string, field: "title" | "body", value: string) {
    setLocalError(undefined);
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = rows.some((row) => !row.title.trim() || !row.body.trim());
    if (rows.length < 1 || missing) {
      setLocalError("Ogni passo ha un titolo e una frase.");
      return;
    }
    await saveServicesAction(new FormData(event.currentTarget));
  }

  return (
    <form className={invalid ? "field-invalid grid gap-4" : "grid gap-4"} onSubmit={submit}>
      <input type="hidden" name="return_to" value="/app/sito" />
      {rows.map((row, index) => (
        <fieldset key={row.key} className="service-step">
          <legend>Servizio {String(index + 1).padStart(2, "0")}</legend>
          <label className="field">
            <span>Titolo che si legge sul sito</span>
            <input
              name={`service_title_${index}`}
              value={row.title}
              onChange={(event) => change(row.key, "title", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Frase sotto il titolo</span>
            <input
              name={`service_body_${index}`}
              value={row.body}
              onChange={(event) => change(row.key, "body", event.target.value)}
            />
          </label>
          {rows.length > 1 ? (
            <button className="btn ghost service-remove" type="button" onClick={() => remove(row.key)}>
              Togli questo servizio
            </button>
          ) : null}
        </fieldset>
      ))}
      {invalid ? <ActionNotice message={shown} /> : null}
      <button className="btn ghost" type="button" onClick={add}>
        Aggiungi un servizio
      </button>
      <button className="btn" type="submit">
        Salva servizi
      </button>
    </form>
  );
}
