import { notFound } from "next/navigation";
import { ActionNotice } from "@/components/action-notice";
import { preferenceCategoryLabel } from "@/domain/dossier";
import { fieldInvalid, preferenceField } from "@/domain/forms";
import { getClient, getRole } from "@/lib/data";
import { getSpecifics, listPreferences } from "@/lib/records";
import { removePreferenceAction, savePrivateAction } from "@/server/actions";

export default async function PreferencesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ errore?: string }>;
}) {
  const { id } = await params;
  const { errore } = await searchParams;
  const role = await getRole();
  if (role !== "owner") notFound();
  const client = await getClient(id);
  if (!client) notFound();
  const [preferences, specifics] = await Promise.all([
    listPreferences(id),
    getSpecifics(id),
  ]);

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <h2 className="text-3xl">Preferenze e specifiche</h2>
      {preferenceField(errore) ? null : <ActionNotice message={errore} />}
      <p>Solo tu le vedi. Servono a ricordare fiori, colori e dettagli del luogo.</p>
      {preferences.length === 0 ? <p>Nessuna preferenza ancora.</p> : null}
      <ul className="grid gap-2">
        {preferences.map((item) => (
          <li key={item.id} className="grid gap-1">
            <strong>{item.label}</strong>
            <span className="text-[var(--muted)]"> {preferenceCategoryLabel(item.category)}</span>
            {item.note ? <span className="block">{item.note}</span> : null}
            <form action={removePreferenceAction}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="client_id" value={id} />
              <input type="hidden" name="return_to" value={`/app/clienti/${id}/preferenze`} />
              <button className="btn ghost" type="submit">
                Togli
              </button>
            </form>
          </li>
        ))}
      </ul>
      <form
        action={savePrivateAction}
        className={`grid gap-4 ${preferenceField(errore) ? "" : fieldInvalid(errore)}`.trim()}
      >
        <input type="hidden" name="client_id" value={id} />
        <input type="hidden" name="return_to" value={`/app/clienti/${id}/preferenze`} />
        <label className="field">
          <span>Specifiche</span>
          <textarea name="specifics" defaultValue={specifics} />
        </label>
        <label className="field">
          <span>Nuova preferenza</span>
          <input name="pref_label" />
        </label>
        <label className="field">
          <span>Categoria</span>
          <select
            name="pref_category"
            className={preferenceField(errore) === "pref_category" ? "field-invalid" : undefined}
            defaultValue="fiore"
          >
            <option value="fiore">Fiore</option>
            <option value="colore">Colore</option>
            <option value="pianta">Pianta</option>
            <option value="evitare">Da evitare</option>
            <option value="altro">Altro</option>
          </select>
        </label>
        {preferenceField(errore) === "pref_category" ? <ActionNotice message={errore} /> : null}
        <label className="field">
          <span>Nota</span>
          <input name="pref_note" />
        </label>
        <button className="btn" type="submit">
          Salva
        </button>
      </form>
    </div>
  );
}
