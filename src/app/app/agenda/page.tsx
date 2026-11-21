import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { agendaLocalInput, agendaPlaceLabel, agendaSpan } from "@/domain/calendar";
import { ActionNotice } from "@/components/action-notice";
import { AgendaBoard } from "@/components/agenda-board";
import { CopyFeedLink } from "@/components/copy-feed-link";
import { agendaField, fieldInvalid } from "@/domain/forms";
import { getRole, listClients } from "@/lib/data";
import { listAppointments, listPlaceOptions } from "@/lib/records";
import { createAppointmentAction, moveAppointmentAction, setAppointmentStatusAction } from "@/server/actions";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string; sposta?: string; mese?: string; giorno?: string }>;
}) {
  const { errore, sposta, mese, giorno } = await searchParams;
  const role = await getRole();
  if (role !== "owner") notFound();
  const [appointments, clients, places] = await Promise.all([
    listAppointments(),
    listClients(""),
    listPlaceOptions(),
  ]);
  const token = process.env.CALENDAR_FEED_TOKEN;
  const headerList = await headers();
  const host = headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const feedUrl = token && host ? `${proto}://${host}/feed/${token}` : null;
  const now = new Date();

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      {agendaField(errore) ? null : <ActionNotice message={errore} />}
      <AgendaBoard
        now={now.toISOString()}
        month={mese}
        day={giorno}
        entries={appointments.map((item) => ({
          id: item.id,
          startsAt: item.starts_at,
          title: item.title,
          place: agendaPlaceLabel(item.clients?.full_name ?? "", item.places?.label ?? ""),
        }))}
      />
      <section className="owner-section is-grove">
      <h2 className="text-2xl">I prossimi appuntamenti</h2>
      {appointments.length === 0 ? (
        <p>Nessun appuntamento. Il primo si crea qui sotto.</p>
      ) : (
        <ul className="grid gap-4">
          {appointments.map((item) => (
            <li key={item.id} className="grid gap-1">
              <strong>{item.title}</strong>
              <span>
                {agendaSpan(item.starts_at, item.ends_at)}
              </span>
              <span className="text-[var(--muted)]">
                {agendaPlaceLabel(item.clients?.full_name ?? "", item.places?.label ?? "")}
              </span>
              <form
                action={setAppointmentStatusAction}
                className="flex gap-2"
              >
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="return_to" value="/app/agenda" />
                <button className="btn ghost" name="status" value="fatto" type="submit">
                  Fatto
                </button>
                <button className="btn ghost" name="status" value="annullato" type="submit">
                  Annulla
                </button>
              </form>
              <form action={moveAppointmentAction} className={`grid gap-2 ${agendaField(errore) === "move" && sposta === item.id ? "field-invalid" : ""}`.trim()}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="return_to" value="/app/agenda" />
                <label className="field">
                  <span>Nuovo inizio</span>
                  <input
                    name="starts_at"
                    type="datetime-local"
                    required
                    defaultValue={agendaLocalInput(item.starts_at)}
                  />
                </label>
                <label className="field">
                  <span>Nuova fine</span>
                  <input
                    name="ends_at"
                    type="datetime-local"
                    required
                    defaultValue={agendaLocalInput(item.ends_at)}
                  />
                </label>
                {agendaField(errore) === "move" && sposta === item.id ? <ActionNotice message={errore} /> : null}
                <button className="btn ghost" type="submit">
                  Sposta
                </button>
              </form>
              {item.status === "fatto" ? (
                <Link href={`/app/clienti/${item.client_id}`}>Apri l&apos;intervento nel fascicolo</Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      </section>
      <section className="owner-section">
      <h2 className="text-2xl">Nuovo appuntamento</h2>
      <form
        action={createAppointmentAction}
        className={`grid gap-3 ${agendaField(errore) === "title" ? "field-invalid" : agendaField(errore) ? "" : fieldInvalid(errore)}`.trim()}
      >
        <input type="hidden" name="return_to" value="/app/agenda" />
        <label className="field">
          <span>Titolo</span>
          <input name="title" required />
        </label>
        <label className="field">
          <span>Cliente</span>
          <select name="client_id" required defaultValue="">
            <option value="" disabled>
              Scegli
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Luogo</span>
          <select name="place_id" defaultValue="">
            <option value="">Senza luogo</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {agendaPlaceLabel(
                  clients.find((client) => client.id === place.client_id)?.full_name ?? "",
                  place.label,
                )}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Inizio</span>
          <input name="starts_at" type="datetime-local" required />
        </label>
        <label className="field">
          <span>Fine</span>
          <input name="ends_at" type="datetime-local" required />
        </label>
        {agendaField(errore) === "title" ? <ActionNotice message={errore} /> : null}
        <label className="flex items-center gap-2">
          <input name="include_address" type="checkbox" />
          Mostra indirizzo nel calendario
        </label>
        <button className="btn" type="submit">
          Salva
        </button>
      </form>
      </section>
      <section className="owner-section is-grove">
        <h2 className="text-2xl">Anche sul tuo calendario</h2>
        {feedUrl ? (
          <>
            <p>
              Gli appuntamenti possono comparire anche nel calendario che hai già sul telefono o sul computer.
              Si aggiornano da soli.
            </p>
            <p>
              Se li sposti da quel calendario, in questa pagina restano dov&apos;erano.
              Gli spostamenti si fanno qui.
            </p>
            <CopyFeedLink url={feedUrl} />
            <p>Dopo averlo copiato, incollalo in uno di questi punti.</p>
            <div className="feed-steps">
              <div>
                <h3 className="text-lg">iPhone</h3>
                <p>
                  Apri l&apos;app Calendario. In basso tocca Calendari. Tocca Aggiungi calendario, poi Aggiungi calendario da abbonamento.
                  Incolla e tocca Iscriviti.
                </p>
              </div>
              <div>
                <h3 className="text-lg">Mac</h3>
                <p>
                  Apri Calendario. Nel menu File scegli Nuovo abbonamento calendario.
                  Incolla e conferma.
                </p>
              </div>
              <div>
                <h3 className="text-lg">Android</h3>
                <p>
                  L&apos;app del telefono non accetta l&apos;indirizzo. Apri il browser e vai su calendar.google.com.
                  Accedi, poi segui i passi di Google qui sotto. Da quel momento l&apos;app Google Calendar sul telefono mostra gli appuntamenti.
                </p>
              </div>
              <div>
                <h3 className="text-lg">Google</h3>
                <p>
                  Apri Google Calendar dal computer. A sinistra, accanto ad Altri calendari, premi +.
                  Scegli Da URL. Incolla e premi Aggiungi calendario.
                </p>
              </div>
            </div>
          </>
        ) : (
          <p>Il calendario da copiare non è ancora pronto.</p>
        )}
      </section>
    </div>
  );
}
