import Image from "next/image";
import Link from "next/link";
import { mailHref, phoneHref } from "@/domain/card";
import { portraitSrc, publicBlocks, publicWorkSrc, sharePreview } from "@/domain/public-page";
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

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-20 md:grid-cols-[0.8fr_1.2fr] md:items-center">
        <div className="portrait-frame" data-portrait>
          <Image
            src={portraitSrc(site.portraitPath, process.env.NEXT_PUBLIC_SUPABASE_URL)}
            alt={site.portraitAlt}
            width={900}
            height={1100}
            className="portrait-photo h-auto w-full object-cover"
          />
        </div>
        <div className="max-w-[62ch]" data-rise>
          <h2 className="text-4xl">{site.ownerName}</h2>
          <p className="mt-4 text-lg">{site.bio}</p>
        </div>
      </section>

      <section className="bg-[var(--surface)]">
        <div className="mx-auto flex max-w-3xl flex-col gap-12 px-5 py-20">
          {site.services.map((service, index) => (
            <article key={index} data-rise>
              <h2 className={index === 0 ? "text-5xl" : "text-3xl"}>{service.title}</h2>
              <p className="mt-3 max-w-[42ch] text-lg">{service.body}</p>
            </article>
          ))}
        </div>
      </section>

      {blocks.works ? (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-4xl">Lavori</h2>
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

      <section className="mx-auto max-w-6xl px-5 py-20" data-rise>
        <h2 className="text-4xl">Contatti</h2>
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
        <section className="mx-auto max-w-3xl px-5 py-20" data-rise>
          <h2 className="text-4xl">Testimonianze</h2>
          <div className="mt-8 grid gap-10">
            {quotes.map((quote, index) => (
              <blockquote key={index} className="text-2xl leading-snug">
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
      ) : null}

      <footer className="site-entry">
        <Link href="/login">Accesso</Link>
      </footer>

      {call ? (
        <a className="phone-dock md:hidden" href={call}>
          {site.phone}
        </a>
      ) : null}
    </main>
    </SiteMotion>
  );
}
