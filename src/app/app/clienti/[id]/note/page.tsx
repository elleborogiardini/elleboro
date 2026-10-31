import { notFound } from "next/navigation";
import { ActionNotice } from "@/components/action-notice";
import { fieldInvalid, noteField } from "@/domain/forms";
import { getRole } from "@/lib/data";
import { listNotes } from "@/lib/records";
import { archiveNoteAction, saveNoteAction } from "@/server/actions";

export default async function NotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ errore?: string; nota?: string }>;
}) {
  const { id } = await params;
  const { errore, nota } = await searchParams;
  const role = await getRole();
  if (role !== "owner") notFound();
  const notes = await listNotes(id);

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <h2 className="text-3xl">Note</h2>
      {noteField(errore) ? null : <ActionNotice message={errore} />}
      <p>Scrivi quello che ti serve ricordare. Puoi aggiungere più sezioni.</p>
      {notes.length === 0 ? <p>Nessuna nota. La prima è qui sotto.</p> : null}
      {notes.map((note) => (
        <form
          key={note.id}
          action={saveNoteAction}
          className="grid gap-3"
        >
          <input type="hidden" name="client_id" value={id} />
          <input type="hidden" name="return_to" value={`/app/clienti/${id}/note`} />
          <input type="hidden" name="id" value={note.id} />
          <label className="field">
            <span>Titolo</span>
            <input
              name="title"
              defaultValue={note.title}
              className={nota === note.id && noteField(errore) === "title" ? "field-invalid" : undefined}
            />
          </label>
          {nota === note.id && noteField(errore) === "title" ? <ActionNotice message={errore} /> : null}
          <label className="field">
            <span>Testo</span>
            <textarea name="body" defaultValue={note.body} />
          </label>
          <button className="btn" type="submit">
            Aggiorna
          </button>
        </form>
      ))}
      {notes.map((note) => (
        <form
          key={`${note.id}-archive`}
          action={archiveNoteAction}
        >
          <input type="hidden" name="client_id" value={id} />
          <input type="hidden" name="return_to" value={`/app/clienti/${id}/note`} />
          <input type="hidden" name="id" value={note.id} />
          <button className="btn ghost" type="submit">
            Archivia {note.title}
          </button>
        </form>
      ))}
      <h3 className="text-xl">Nuova sezione</h3>
      <form
        action={saveNoteAction}
        className={`grid gap-3 ${noteField(errore) || nota ? "" : fieldInvalid(errore)}`.trim()}
      >
        <input type="hidden" name="client_id" value={id} />
        <input type="hidden" name="return_to" value={`/app/clienti/${id}/note`} />
        <div className={noteField(errore) === "title" && !nota ? "field-invalid" : undefined}>
          <label className="field">
            <span>Titolo</span>
            <input name="title" />
          </label>
          {noteField(errore) === "title" && !nota ? <ActionNotice message={errore} /> : null}
        </div>
        <label className="field">
          <span>Testo</span>
          <textarea name="body" />
        </label>
        <button className="btn" type="submit">
          Aggiungi
        </button>
      </form>
    </div>
  );
}
