import { showPhone } from "@/domain/card";
import type { PublicSite } from "@/domain/draft";

export type EditorSite = PublicSite & { published: boolean };

export function siteForEditor(row: EditorSite | null, fallback: PublicSite): EditorSite {
  if (!row) return { ...fallback, published: false };
  return row;
}

export function siteForVisitor(
  row: PublicSite | null,
  connected: boolean,
  fallback: PublicSite,
): PublicSite | null {
  if (!connected) return fallback;
  return row;
}

export function publishedServices(
  steps: { title: string; body: string }[],
  fallback: { title: string; body: string }[],
): { title: string; body: string }[] {
  return steps.length ? steps : fallback;
}

export function editorServices(
  steps: { title: string; body: string }[],
  fallback: { title: string; body: string }[],
): { title: string; body: string }[] {
  const source = steps.length ? steps : fallback;
  return source.map((step) => ({ title: step.title, body: step.body }));
}

export function workVisibility(checked: string | null): boolean {
  return checked === "on";
}

export function sharePreview(site: { ownerName: string; heroTitle: string; phone: string | null }) {
  const title = site.heroTitle.trim();
  const named = `${site.ownerName.trim()}, ${title}`;
  const phone = site.phone && showPhone(site.phone) ? site.phone.trim() : null;
  const description = phone ? `${named}. ${phone}` : `${named}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: "/brand/share.jpg", width: 1200, height: 630, alt: title }],
    },
  };
}

function publicFile(path: string | null | undefined): path is string {
  return typeof path === "string" && path.length > 0 && !/[\\/%]|\.\./.test(path);
}

export function portraitSrc(path: string | null | undefined, base: string | null | undefined): string {
  if (!publicFile(path) || !base) return "/brand/portrait.jpg";
  return `${base}/storage/v1/object/public/portfolio/${path}`;
}

export function publicWorkSrc(path: string | null | undefined, base: string | null | undefined): string {
  if (!publicFile(path) || !base) return "";
  return `${base}/storage/v1/object/public/portfolio/${path}`;
}

export function publicBlocks(input: { works: number; quotes: number; phone: string | null }) {
  return {
    works: input.works > 0,
    quotes: input.quotes > 0,
    phone: showPhone(input.phone),
  };
}
