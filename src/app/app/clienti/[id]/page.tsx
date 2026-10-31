import Link from "next/link";
import { notFound } from "next/navigation";
import { interventionWhen, mapsDirections, photosByPlace, placeKindLabel } from "@/domain/dossier";
import { ownerDossierLinks } from "@/domain/shell";
import { ActionNotice } from "@/components/action-notice";
import { clientField, dossierField, fieldInvalid } from "@/domain/forms";
import { getClient, getRole } from "@/lib/data";
import { listInterventions, listPhotos, listPlaces } from "@/lib/records";
import {
  archiveClientAction,
  updateClientAction,
  archiveInterventionAction,
  createInterventionAction,
  createPlaceAction,
  publishPhotoAction,
  uploadPhotoAction,
} from "@/server/actions";

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ errore?: string; foto?: string }>;
}) {
  const { id } = await params;
  const { errore, foto } = await searchParams;
  const [client, role, places, interventions, photos] = await Promise.all([
    getClient(id),
    getRole(),
    listPlaces(id),
    listInterventions(id),
    listPhotos(id),
  ]);
  if (!client) notFound();
  const privateLinks = ownerDossierLinks(role, id);
  const maps = mapsDirections(role, client);

  return (
    <div className="mx-auto grid max-w-3xl gap-10">
      {dossierField(errore) || clientField(errore) ? null : <ActionNotice message={errore} />}
      <header>
        <h2 className="text-3xl">{client.full_name}</h2>
        <p className="text-[var(--muted)]">
          {[client.locality, client.phone, client.address].filter(Boolean).join(", ")}
        </p>
        {maps ? (
          <a className="mt-3 inline-block py-3" href={maps}>
            Apri in Mappe
          </a>
        ) : null}
        {privateLinks.length > 0 ? (
          <p className="mt-3 flex gap-4">
            {privateLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </p>
        ) : null}
      </header>

      <section className="grid gap-3">
        <h2 className="text-2xl">Anagrafica</h2>
        <form action={updateClientAction} className="grid gap-3">
          <input type="hidden" name="id" value={id} />
          <label className="field">
            <span>Nome</span>
            <input
              name="full_name"
              defaultValue={client.full_name}
              required
              className={clientField(errore) === "full_name" ? "field-invalid" : undefined}
            />
          </label>
          {clientField(errore) === "full_name" ? <ActionNotice message={errore} /> : null}
          <label className="field">
            <span>Telefono</span>
            <input
              name="phone"
              defaultValue={client.phone ?? ""}
              className={clientField(errore) === "phone" ? "field-invalid" : undefined}
            />
          </label>
          {clientField(errore) === "phone" ? <ActionNotice message={errore} /> : null}
          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              defaultValue={client.email ?? ""}
              className={clientField(errore) === "email" ? "field-invalid" : undefined}
            />
          </label>
          {clientField(errore) === "email" ? <ActionNotice message={errore} /> : null}
          <label className="field">
            <span>Indirizzo</span>
            <input name="address" defaultValue={client.address ?? ""} />
          </label>
          <label className="field">
            <span>Località</span>
            <input name="locality" defaultValue={client.locality ?? ""} />
          </label>
          <button className="btn" type="submit">
            Salva
          </button>
        </form>
      </section>

      <section className={`grid gap-3 ${dossierField(errore) || clientField(errore) ? "" : fieldInvalid(errore)}`.trim()}>
        <h2 className="text-2xl">Luoghi</h2>
        {places.length === 0 ? <p>Nessun luogo ancora.</p> : null}
        <ul>
          {places.map((place) => (
            <li key={place.id}>
              {place.label} <span className="text-[var(--muted)]">{placeKindLabel(place.kind)}</span>
            </li>
          ))}
        </ul>
        <form
          action={createPlaceAction}
          className={`grid gap-3 ${dossierField(errore) || clientField(errore) ? "" : fieldInvalid(errore)}`.trim()}
        >
          <input type="hidden" name="client_id" value={id} />
          <label className="field">
            <span>Nome del luogo</span>
            <input
              name="label"
              className={dossierField(errore) === "label" ? "field-invalid" : undefined}
              required
            />
          </label>
          {dossierField(errore) === "label" ? <ActionNotice message={errore} /> : null}
          <label className="field">
            <span>Tipo</span>
            <select name="kind" defaultValue="giardino">
              <option value="giardino">Giardino</option>
              <option value="balcone">Balcone</option>
              <option value="terrazzo">Terrazzo</option>
              <option value="interno">Interno</option>
              <option value="altro">Altro</option>
            </select>
          </label>
          <button className="btn" type="submit">
            Aggiungi luogo
          </button>
        </form>
      </section>

      <section className={`grid gap-3 ${dossierField(errore) || clientField(errore) ? "" : fieldInvalid(errore)}`.trim()}>
        <h2 className="text-2xl">Foto</h2>
        {photos.length === 0 ? <p>Nessuna foto. Dal telefono puoi scattarne una.</p> : null}
        {photosByPlace(places, photos).map((group) => (
          <div key={group.id} className={`grid gap-3 ${dossierField(errore) || clientField(errore) ? "" : fieldInvalid(errore)}`.trim()}>
            <h3 className="text-xl">{group.label}</h3>
            {group.photos.length === 0 ? <p>Nessuna foto per questo luogo.</p> : null}
            <div className="grid grid-cols-2 gap-3">
              {group.photos.map((photo) =>
                photo.url ? (
                  <div key={photo.id} className="grid gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" className="rounded-[12px]" />
                    {photo.interventionId ? (
                      <p>{interventions.find((item) => item.id === photo.interventionId)?.title}</p>
                    ) : null}
                    <form action={publishPhotoAction} className={`grid gap-3 ${dossierField(errore) || clientField(errore) ? "" : fieldInvalid(errore)}`.trim()}>
                      <input type="hidden" name="photo_id" value={photo.id} />
                      <input type="hidden" name="client_id" value={id} />
                      <input type="hidden" name="return_to" value={`/app/clienti/${id}`} />
                      <label className="field">
                        <span>Testo alternativo per il sito</span>
                        <input
                          name="alt"
                          className={dossierField(errore) === "alt" && foto === photo.id ? "field-invalid" : undefined}
                        />
                      </label>
                      {dossierField(errore) === "alt" && foto === photo.id ? <ActionNotice message={errore} /> : null}
                      <label className="field">
                        <span>Didascalia</span>
                        <input name="caption" />
                      </label>
                      <button className="btn ghost" type="submit">
                        Pubblica nel sito
                      </button>
                    </form>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        ))}
        {photos.some((photo) => photo.url && !places.some((place) => place.id === photo.placeId)) ? (
          <div className="grid grid-cols-2 gap-3">
            {photos
              .filter((photo) => photo.url && !places.some((place) => place.id === photo.placeId))
              .map((photo) => (
                <div key={photo.id} className="grid gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="rounded-[12px]" />
                  {photo.interventionId ? (
                    <p>{interventions.find((item) => item.id === photo.interventionId)?.title}</p>
                  ) : null}
                  <form action={publishPhotoAction} className={`grid gap-3 ${dossierField(errore) || clientField(errore) ? "" : fieldInvalid(errore)}`.trim()}>
                    <input type="hidden" name="photo_id" value={photo.id} />
                    <input type="hidden" name="client_id" value={id} />
                    <input type="hidden" name="return_to" value={`/app/clienti/${id}`} />
                    <label className="field">
                      <span>Testo alternativo per il sito</span>
                      <input
                        name="alt"
                        className={dossierField(errore) === "alt" && foto === photo.id ? "field-invalid" : undefined}
                      />
                    </label>
                    {dossierField(errore) === "alt" && foto === photo.id ? <ActionNotice message={errore} /> : null}
                    <label className="field">
                      <span>Didascalia</span>
                      <input name="caption" />
                    </label>
                    <button className="btn ghost" type="submit">
                      Pubblica nel sito
                    </button>
                  </form>
                </div>
              ))}
          </div>
        ) : null}
        <form
          action={uploadPhotoAction}
          className={`grid gap-3 ${dossierField(errore) || clientField(errore) ? "" : fieldInvalid(errore)}`.trim()}
        >
          <input type="hidden" name="client_id" value={id} />
          {places.length > 0 ? (
            <label className="field">
              <span>Luogo</span>
              <select name="place_id" defaultValue="">
                <option value="">Senza luogo</option>
                {places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {interventions.length > 0 ? (
            <label className="field">
              <span>Intervento</span>
              <select name="intervention_id" defaultValue="">
                <option value="">Senza intervento</option>
                {interventions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="field">
            <span>Foto del luogo</span>
            <input name="photo" type="file" accept="image/*" capture="environment" />
          </label>
          <button className="btn" type="submit">
            Carica
          </button>
        </form>
      </section>

      <section className={`grid gap-3 ${dossierField(errore) || clientField(errore) ? "" : fieldInvalid(errore)}`.trim()}>
        <h2 className="text-2xl">Interventi</h2>
        {interventions.length === 0 ? <p>Nessun intervento registrato.</p> : null}
        <ul className={`grid gap-3 ${dossierField(errore) || clientField(errore) ? "" : fieldInvalid(errore)}`.trim()}>
          {interventions.map((item) => {
            const placeLabel = places.find((place) => place.id === item.place_id)?.label;
            return (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span className="block text-[var(--muted)]">
                  {placeLabel
                    ? `${interventionWhen(item.happened_on)}, ${placeLabel}`
                    : interventionWhen(item.happened_on)}
                </span>
                {item.notes ? <p>{item.notes}</p> : null}
                <form action={archiveInterventionAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="client_id" value={id} />
                  <input type="hidden" name="return_to" value={`/app/clienti/${id}`} />
                  <button className="btn ghost" type="submit">Archivia</button>
                </form>
              </li>
            );
          })}
        </ul>
        <form
          action={createInterventionAction}
          className={`grid gap-3 ${dossierField(errore) || clientField(errore) ? "" : fieldInvalid(errore)}`.trim()}
        >
          <input type="hidden" name="client_id" value={id} />
          {places.length > 0 ? (
            <label className="field">
              <span>Luogo</span>
              <select name="place_id" defaultValue="">
                <option value="">Senza luogo</option>
                {places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="field">
            <span>Data</span>
            <input
              name="happened_on"
              type="date"
              required
              className={dossierField(errore) === "date" ? "field-invalid" : undefined}
            />
          </label>
          {dossierField(errore) === "date" ? <ActionNotice message={errore} /> : null}
          <label className="field">
            <span>Cosa hai fatto</span>
            <input
              name="title"
              className={dossierField(errore) === "title" ? "field-invalid" : undefined}
              required
            />
          </label>
          {dossierField(errore) === "title" ? <ActionNotice message={errore} /> : null}
          <label className="field">
            <span>Note di lavoro</span>
            <textarea name="notes" />
          </label>
          <button className="btn" type="submit">
            Registra intervento
          </button>
        </form>
      </section>

      <form
        action={archiveClientAction}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="client_id" value={id} />
        <input type="hidden" name="return_to" value={`/app/clienti/${id}`} />
        <button className="btn ghost" type="submit">
          Archivia cliente
        </button>
      </form>
    </div>
  );
}
