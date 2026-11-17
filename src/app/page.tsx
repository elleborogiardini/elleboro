import Image from "next/image";
import Link from "next/link";
import { mailHref, phoneHref } from "@/domain/card";
import { portraitSrc, publicBlocks, publicWorkSrc, sharePreview } from "@/domain/public-page";
import { Botanica, Filo } from "@/components/botanica";
import { Logo } from "@/components/logo";
import { Rise } from "@/components/rise";
import { SiteMotion } from "@/components/site-motion";
import { getPublicQuotes, getPublicSite, getPublicWorks } from "@/lib/data";

export async function generateMetadata() {
  const site = await getPublicSite();
  if (!site) return { title: "Elleboro Giardini", description: "Elleboro Giardini." };
  return sharePreview(site);
}

export default async function HomePage() {
  const site = await getPublicSite();
  if (!site) {
    return (
      <main className="overflow-x-clip">
        <section className="hero">
          <div className="hero-frame">
            <Logo />
            <h1>Elleboro Giardini</h1>
            <p>Il sito non è ancora visibile.</p>
          </div>
        </section>
        <footer className="site-entry">
          <Link href="/login">Accesso</Link>
        </footer>
      </main>
    );
  }
  const works = await getPublicWorks();
  const quotes = await getPublicQuotes();
  const blocks = publicBlocks({
    works: works.length,
    quotes: quotes.length,
    phone: site.phone,
  });
  const call = blocks.phone ? phoneHref(site.phone) : null;
  const mail = mailHref(site.email);
  return (
    <SiteMotion>
    <main className="overflow-x-clip">
      <section className="hero">
        <Botanica plant="ramo" className="hero-botanica" />
        <div className="hero-frame">
          <Rise className="hero-mark">
            <Logo />
          </Rise>
          <div className="hero-copy">
            <Rise>
              <h1>{site.heroTitle}</h1>
            </Rise>
            <span className="hero-rule" aria-hidden="true" />
            <Rise delay={0.08}>
              <p className="hero-lead">{site.heroLead}</p>
            </Rise>
            {call ? (
              <Rise delay={0.24}>
                <a className="hero-phone" href={call}>
                  {site.phone}
                </a>
              </Rise>
            ) : null}
            <Rise delay={0.32}>
              <div className="hero-actions">
                <a className="btn btn-paper" href="/contatto">
                  Salva il contatto
                </a>
                <Link className="btn btn-line" href="/richiesta">
                  Richiedi un sopralluogo
                </Link>
              </div>
            </Rise>
          </div>
        </div>
      </section>

      <section className="bio mx-auto grid max-w-6xl gap-10 px-5 py-24 md:grid-cols-[0.8fr_1.2fr] md:items-center md:gap-16 md:py-32">
        <div className="bio-figure">
          <Botanica plant="mazzo" className="bio-botanica" />
          <div className="portrait-frame" data-portrait>
            <Image
              src={portraitSrc(site.portraitPath, process.env.NEXT_PUBLIC_SUPABASE_URL)}
              alt={site.portraitAlt}
              width={900}
              height={1100}
              className="portrait-photo h-auto w-full object-cover"
            />
          </div>
        </div>
        <div className="max-w-[62ch]" data-rise>
          <p className="eyebrow">Chi sono</p>
          <h2 className="section-title">{site.ownerName}</h2>
          <p className="mt-5 text-lg md:text-xl">{site.bio}</p>
        </div>
      </section>

      <section className="services">
        <div className="services-frame mx-auto grid max-w-6xl gap-12 px-5 py-24 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:py-32">
          <div className="services-aside">
            <p className="eyebrow">Servizi</p>
            <Botanica plant="fiore" className="services-botanica" />
          </div>
          <div className="flex flex-col">
            {site.services.map((service, index) => (
              <article key={index} className="service" data-rise>
                <span className="service-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2 className={index === 0 ? "service-title service-title-lead" : "service-title"}>
                    {service.title}
                  </h2>
                  <p className="mt-3 max-w-[42ch] text-lg">{service.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {blocks.works ? (
        <section className="mx-auto max-w-6xl px-5 py-24">
          <p className="eyebrow">Portfolio</p>
          <h2 className="section-title">Lavori</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {works.map((work) => (
              <figure key={work.id}>
                {publicWorkSrc(work.path, process.env.NEXT_PUBLIC_SUPABASE_URL) ? (
                  <div className="work-frame" data-work>
                    <Image
                      src={publicWorkSrc(work.path, process.env.NEXT_PUBLIC_SUPABASE_URL)}
                      alt={work.alt}
                      width={1200}
                      height={900}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                ) : null}
                {work.caption ? <figcaption className="mt-2">{work.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <Filo />

      <section className="contact mx-auto max-w-6xl px-5 py-24" data-rise>
        <Botanica plant="mazzo" className="contact-botanica" />
        <p className="eyebrow">Contatti</p>
        <h2 className="section-title">Parliamo del tuo giardino</h2>
        <div className="mt-6 grid gap-2 text-xl">
          {call ? <a href={call}>{site.phone}</a> : null}
          {site.area ? <p>{site.area}</p> : null}
        </div>
        {mail ? (
          <a className="mail-write" href={mail}>
            <span>Scrivi una mail</span>
            {site.email}
          </a>
        ) : null}
        <Link className="btn mt-8" href="/richiesta">
          Richiedi un sopralluogo
        </Link>
      </section>

      {blocks.quotes ? (
        <>
        <Filo />
        <section className="mx-auto max-w-3xl px-5 py-24" data-rise>
          <p className="eyebrow">Testimonianze</p>
          <div className="mt-8 grid gap-14">
            {quotes.map((quote, index) => (
              <blockquote key={index} className="quote text-2xl leading-snug md:text-3xl">
                <p className="line-clamp-3">“{quote.quote}”</p>
                <footer className="mt-3 text-base text-[var(--muted)]">
                  {quote.author}
                  <br />
                  {quote.context}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
        </>
      ) : null}

      <div className="site-foot">
        <Botanica plant="bordura" className="foot-botanica" />
        <footer className="site-entry">
          <Link href="/login">Accesso</Link>
        </footer>
      </div>

      {call ? (
        <a className="phone-dock md:hidden" href={call}>
          {site.phone}
        </a>
      ) : null}
    </main>
    </SiteMotion>
  );
}
