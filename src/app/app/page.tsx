import Link from "next/link";
import { clientLine, clientListEmpty, mapsDirections } from "@/domain/dossier";
import { ActionNotice } from "@/components/action-notice";
import { clientField, fieldInvalid } from "@/domain/forms";
import { getRole, listClients } from "@/lib/data";
import { createClientAction } from "@/server/actions";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; errore?: string }>;
}) {
  const { q = "", errore } = await searchParams;
  const [clients, role] = await Promise.all([listClients(q), getRole()]);
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <form>
        <label className="field">
          <span>Cerca per nome, telefono o località</span>
          <input name="q" defaultValue={q} />
        </label>
        <button className="btn" type="submit">
          Cerca
        </button>
      </form>
      {clients.length === 0 ? (
        <p>{clientListEmpty(q)}</p>
      ) : (
        <ul className="grid gap-2">
          {clients.map((client) => {
            const maps = mapsDirections(role, client);
            return (
              <li key={client.id}>
                <Link className="block py-3" href={`/app/clienti/${client.id}`}>
                  <strong>{client.full_name}</strong>
                  <span className="mt-1 block text-[var(--muted)]">
                    {clientLine(client)}
                  </span>
                </Link>
                {maps ? (
                  <a className="inline-block py-3" href={maps}>
                    Apri in Mappe
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <h2 className="text-2xl">Nuovo cliente</h2>
      <form
        action={createClientAction}
        className={`grid gap-4 ${clientField(errore) ? "" : fieldInvalid(errore)}`.trim()}
      >
        <input type="hidden" name="return_to" value="/app" />
        {clientField(errore) ? null : <ActionNotice message={errore} />}
        <div className={clientField(errore) === "full_name" ? "field-invalid" : undefined}>
          <label className="field">
            <span>Nome</span>
            <input name="full_name" required />
          </label>
          {clientField(errore) === "full_name" ? <ActionNotice message={errore} /> : null}
        </div>
        <label className="field">
          <span>Telefono</span>
          <input
            name="phone"
            className={clientField(errore) === "phone" ? "field-invalid" : undefined}
          />
        </label>
        {clientField(errore) === "phone" ? <ActionNotice message={errore} /> : null}
        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            className={clientField(errore) === "email" ? "field-invalid" : undefined}
          />
        </label>
        {clientField(errore) === "email" ? <ActionNotice message={errore} /> : null}
        <label className="field">
          <span>Indirizzo</span>
          <input name="address" />
        </label>
        <label className="field">
          <span>Località</span>
          <input name="locality" />
        </label>
        <button className="btn" type="submit">
          Salva
        </button>
      </form>
    </div>
  );
}
