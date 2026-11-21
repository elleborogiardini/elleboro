import { draftSite } from "@/domain/draft";
import { editorServices } from "@/domain/public-page";
import { ActionNotice } from "@/components/action-notice";
import { ServiceSteps } from "@/components/service-steps";
import { fieldInvalid, noticeField, quoteField, workField } from "@/domain/forms";
import { publicWorkSrc } from "@/domain/public-page";
import { getEditorSite } from "@/lib/data";
import { listEditorTestimonials, listPortfolioEditor } from "@/lib/records";
import {
  saveSiteAction,
  saveTestimonialAction,
  setWorkVisibilityAction,
  uploadWorkAction,
  signOutAction,
  uploadPortraitAction,
} from "@/server/actions";

export default async function SiteEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string; voce?: string }>;
}) {
  const { errore, voce } = await searchParams;
  const site = await getEditorSite();
  const quotes = await listEditorTestimonials();
  const works = await listPortfolioEditor();
  const services = editorServices(site.services, draftSite.services);

  return (
    <div className="mx-auto grid max-w-3xl gap-10">
      <p className="flex gap-4">
        <a href="/" target="_blank" rel="noreferrer">
          Vedi il sito
        </a>
        <form
          action={signOutAction}
        >
          <button type="submit">Esci</button>
        </form>
      </p>
      {noticeField(errore) || quoteField(errore) || workField(errore) ? null : <ActionNotice message={errore} />}
      <section className="owner-section">
      <h2 className="text-2xl">Testi</h2>
      <form
        action={saveSiteAction}
        className={`grid gap-4 ${noticeField(errore) || quoteField(errore) || workField(errore) ? "" : fieldInvalid(errore)}`.trim()}
      >
        <input type="hidden" name="return_to" value="/app/sito" />
        <div className={noticeField(errore) === "owner_name" ? "field-invalid" : undefined}>
          <label className="field">
            <span>Nome</span>
            <input name="owner_name" defaultValue={site.ownerName} />
          </label>
          {noticeField(errore) === "owner_name" ? <ActionNotice message={errore} /> : null}
        </div>
        <div className={noticeField(errore) === "hero_title" ? "field-invalid" : undefined}>
          <label className="field">
            <span>Titolo</span>
            <input name="hero_title" defaultValue={site.heroTitle} />
          </label>
          {noticeField(errore) === "hero_title" ? <ActionNotice message={errore} /> : null}
        </div>
        <div className={noticeField(errore) === "hero_lead" ? "field-invalid" : undefined}>
          <label className="field">
            <span>Frase</span>
            <input name="hero_lead" defaultValue={site.heroLead} />
          </label>
          {noticeField(errore) === "hero_lead" ? <ActionNotice message={errore} /> : null}
        </div>
        <div className={noticeField(errore) === "bio" ? "field-invalid" : undefined}>
          <label className="field">
            <span>Chi sono</span>
            <textarea name="bio" defaultValue={site.bio} />
          </label>
          {noticeField(errore) === "bio" ? <ActionNotice message={errore} /> : null}
        </div>
        <div className={noticeField(errore) === "contact_phone" ? "field-invalid" : undefined}>
          <label className="field">
            <span>Telefono</span>
            <input name="contact_phone" defaultValue={site.phone ?? ""} />
          </label>
          {noticeField(errore) === "contact_phone" ? <ActionNotice message={errore} /> : null}
        </div>
        <div className={noticeField(errore) === "contact_email" ? "field-invalid" : undefined}>
          <label className="field">
            <span>Email</span>
            <input name="contact_email" defaultValue={site.email ?? ""} />
          </label>
          {noticeField(errore) === "contact_email" ? <ActionNotice message={errore} /> : null}
        </div>
        <label className="field">
          <span>Zona</span>
          <input name="service_area" defaultValue={site.area ?? ""} />
        </label>
        <div className={noticeField(errore) === "portrait_alt" ? "field-invalid" : undefined}>
          <label className="field">
            <span>Testo alternativo del ritratto</span>
            <input name="portrait_alt" defaultValue={site.portraitAlt} />
          </label>
          {noticeField(errore) === "portrait_alt" ? <ActionNotice message={errore} /> : null}
        </div>
        <label className="flex items-center gap-2">
          <input name="published" type="checkbox" defaultChecked={site.published} />
          Visibile sul sito
        </label>
        <button className="btn" type="submit">
          Salva testi
        </button>
      </form>
      </section>

      <section className="owner-section is-grove">
        <h2 className="text-2xl">Servizi</h2>
        <p>
          Nella home questi servizi si leggono uno sotto l'altro, nell'ordine di questa lista. Quelli già scritti restano finché non li cambi.
        </p>
        <ServiceSteps
          steps={services}
          message={noticeField(errore) === "services" ? errore : undefined}
        />
      </section>

      <section className="owner-section">
      <h2 className="text-2xl">Ritratto</h2>
      <form
        action={uploadPortraitAction}
        className={`grid gap-3 ${noticeField(errore) || quoteField(errore) || workField(errore) ? "" : fieldInvalid(errore)}`.trim()}
      >
        <input type="hidden" name="return_to" value="/app/sito" />
        <label className="field">
          <span>Cambia ritratto</span>
          <input name="portrait" type="file" accept="image/*" />
        </label>
        <button className="btn ghost" type="submit">
          Carica ritratto
        </button>
      </form>
      </section>

      <section className="owner-section is-works">
        <h2 className="text-2xl">Lavori</h2>
        <p>Carica una foto di un lavoro finito. Compare sul sito se la lasci visibile.</p>
        <form action={uploadWorkAction} className="grid gap-3">
          <input type="hidden" name="return_to" value="/app/sito" />
          <label className="field">
            <span>Foto del lavoro</span>
            <input name="work" type="file" accept="image/*" />
          </label>
          <div className={workField(errore) === "work_alt" ? "field-invalid" : undefined}>
            <label className="field">
              <span>Cosa si vede</span>
              <input name="alt" className={workField(errore) === "work_alt" ? "field-invalid" : undefined} />
            </label>
            {workField(errore) === "work_alt" ? <ActionNotice message={errore} /> : null}
          </div>
          <label className="field">
            <span>Didascalia</span>
            <input name="caption" />
          </label>
          <label className="flex items-center gap-2">
            <input name="visible" type="checkbox" defaultChecked />
            Visibile sul sito
          </label>
          <button className="btn" type="submit">
            Pubblica lavoro
          </button>
        </form>
        {works.length === 0 ? <p>Nessun lavoro.</p> : null}
        {works.map((work) => {
          const src = publicWorkSrc(work.public_path, process.env.NEXT_PUBLIC_SUPABASE_URL);
          return (
          <form key={work.id} action={setWorkVisibilityAction} className="grid gap-3">
            <input type="hidden" name="return_to" value="/app/sito" />
            <input type="hidden" name="id" value={work.id} />
            {src ? <img src={src} alt={work.alt} className="rounded-[12px]" /> : null}
            <p>{work.alt}</p>
            <label className="flex items-center gap-2">
              <input name="visible" type="checkbox" defaultChecked={work.published} />
              Pubblicata
            </label>
            <button className="btn ghost" type="submit">
              Aggiorna
            </button>
          </form>
          );
        })}
      </section>

      <section className="owner-section is-grove">
        <h2 className="text-2xl">Testimonianze</h2>
        <p>Pubblicale solo se la persona è d&apos;accordo. Non sono collegate al fascicolo.</p>
        {quotes.length === 0 ? <p>Nessuna testimonianza.</p> : null}
        {quotes.map((quote) => (
          <form
            key={quote.id}
            action={saveTestimonialAction}
            className={`grid gap-3 ${quoteField(errore) === "quote" && voce === quote.id ? "field-invalid" : noticeField(errore) || quoteField(errore) || workField(errore) ? "" : fieldInvalid(errore)}`.trim()}
          >
            <input type="hidden" name="return_to" value="/app/sito" />
            <input type="hidden" name="id" value={quote.id} />
            <label className="field">
              <span>Citazione</span>
              <textarea
                name="quote"
                className={quoteField(errore) === "quote" && voce === quote.id ? "field-invalid" : undefined}
                defaultValue={quote.quote}
              />
            </label>
            {quoteField(errore) === "quote" && voce === quote.id ? <ActionNotice message={errore} /> : null}
            <label className="field">
              <span>Nome</span>
              <input
                name="author"
                className={quoteField(errore) === "author" && voce === quote.id ? "field-invalid" : undefined}
                defaultValue={quote.author}
              />
            </label>
            <label className="field">
              <span>Contesto</span>
              <input
                name="context"
                className={quoteField(errore) === "author" && voce === quote.id ? "field-invalid" : undefined}
                defaultValue={quote.context}
              />
            </label>
            {quoteField(errore) === "author" && voce === quote.id ? <ActionNotice message={errore} /> : null}
            <label className="flex items-center gap-2">
              <input name="visible" type="checkbox" defaultChecked={quote.visible} />
              Visibile sul sito
            </label>
            <button className="btn ghost" type="submit">
              Aggiorna
            </button>
          </form>
        ))}
        <h3 className="text-xl">Nuova</h3>
        <form
          action={saveTestimonialAction}
          className={`grid gap-3 ${quoteField(errore) === "quote" && !voce ? "field-invalid" : noticeField(errore) || quoteField(errore) || workField(errore) ? "" : fieldInvalid(errore)}`.trim()}
        >
          <input type="hidden" name="return_to" value="/app/sito" />
          <label className="field">
            <span>Citazione</span>
            <textarea
              name="quote"
              className={quoteField(errore) === "quote" && !voce ? "field-invalid" : undefined}
            />
          </label>
          {quoteField(errore) === "quote" && !voce ? <ActionNotice message={errore} /> : null}
          <label className="field">
            <span>Nome</span>
            <input
              name="author"
              className={quoteField(errore) === "author" && !voce ? "field-invalid" : undefined}
            />
          </label>
          <label className="field">
            <span>Contesto</span>
            <input
              name="context"
              className={quoteField(errore) === "author" && !voce ? "field-invalid" : undefined}
            />
          </label>
          {quoteField(errore) === "author" && !voce ? <ActionNotice message={errore} /> : null}
          <label className="flex items-center gap-2">
            <input name="visible" type="checkbox" />
            Visibile sul sito
          </label>
          <button className="btn" type="submit">
            Aggiungi
          </button>
        </form>
      </section>
    </div>
  );
}
