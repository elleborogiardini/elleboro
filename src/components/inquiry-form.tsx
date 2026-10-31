"use client";

import { useActionState, useEffect, useState } from "react";
import { ActionNotice } from "@/components/action-notice";
import { fieldInvalid, inquiryField } from "@/domain/forms";
import { submitInquiryAction } from "@/server/actions";

export function InquiryReceived() {
  return (
    <p className="action-notice text-2xl leading-snug">
      Ho ricevuto la richiesta. Ti ricontatto io.
    </p>
  );
}

const places = [
  ["giardino", "Giardino"],
  ["balcone", "Balcone"],
  ["terrazzo", "Terrazzo"],
  ["altro", "Altro"],
] as const;

const needs = [
  ["progetto", "Progetto"],
  ["cura", "Cura"],
  ["entrambi", "Progetto e cura"],
] as const;

export function InquiryForm() {
  const [state, action, pending] = useActionState(submitInquiryAction, {
    ok: false,
    error: undefined,
  });
  const [startedAt, setStartedAt] = useState(0);

  useEffect(() => setStartedAt(Date.now()), []);

  if (state.ok) return <InquiryReceived />;

  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="started_at" value={startedAt} />
      <label className="field">
        <span>Nome</span>
        <input
          name="name"
          required
          autoComplete="name"
          className={inquiryField(state.error) === "name" ? fieldInvalid(state.error) : undefined}
        />
      </label>
      {inquiryField(state.error) === "name" ? <ActionNotice message={state.error} /> : null}
      <label className="field">
        <span>Telefono o email</span>
        <input
          name="contact"
          required
          autoComplete="tel"
          className={inquiryField(state.error) === "contact" ? fieldInvalid(state.error) : undefined}
        />
      </label>
      {inquiryField(state.error) === "contact" ? <ActionNotice message={state.error} /> : null}
      <fieldset className="grid gap-2 border-0 p-0">
        <legend>Tipo di luogo</legend>
        <div className="choice">
          {places.map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="place_kind"
                value={value}
                defaultChecked={value === "giardino"}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {inquiryField(state.error) === "place" ? <ActionNotice message={state.error} /> : null}
      <fieldset className="grid gap-2 border-0 p-0">
        <legend>Cosa serve</legend>
        <div className="choice">
          {needs.map(([value, label]) => (
            <label key={value}>
              <input type="radio" name="need" value={value} defaultChecked={value === "cura"} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {inquiryField(state.error) === "need" ? <ActionNotice message={state.error} /> : null}
      <label className="field">
        <span>Zona</span>
        <input name="area" autoComplete="address-level2" />
      </label>
      <label className="field">
        <span>Messaggio</span>
        <textarea
          name="message"
          required
          className={inquiryField(state.error) === "message" ? fieldInvalid(state.error) : undefined}
        />
      </label>
      {inquiryField(state.error) === "message" ? <ActionNotice message={state.error} /> : null}
      <div className="absolute left-[-999px]" aria-hidden="true">
        <input name="company" tabIndex={-1} aria-hidden="true" autoComplete="off" />
      </div>
      {inquiryField(state.error) ? null : <ActionNotice message={state.error} />}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Invio" : "Richiedi un sopralluogo"}
      </button>
    </form>
  );
}
