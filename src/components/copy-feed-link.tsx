"use client";

import { useState } from "react";

export function CopyFeedLink({ url }: { url: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="grid gap-2">
      <button className="btn" type="button" onClick={copy}>
        Copia indirizzo
      </button>
      {state === "copied" ? (
        <p role="status">Indirizzo copiato. Ora incollalo nel calendario.</p>
      ) : null}
      {state === "failed" ? (
        <p role="status">Non sono riuscito a copiare. Riprova.</p>
      ) : null}
    </div>
  );
}
