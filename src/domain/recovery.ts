import { mailHref } from "@/domain/card";

export function recoveryRecipient(input: {
  role: string;
  saved: string | null;
  requested: string;
}): string | null {
  if (input.role !== "owner") return null;
  const saved = input.saved?.trim().toLowerCase() ?? "";
  const requested = input.requested.trim().toLowerCase();
  if (!saved || saved !== requested || !mailHref(saved)) return null;
  return saved;
}

export function recoveryLetter(input: { to: string; link: string }): {
  to: string;
  subject: string;
  text: string;
} {
  return {
    to: input.to,
    subject: "Nuova password per Elleboro",
    text: `Per scegliere una nuova password apri questo link:\n${input.link}\n\nSe non hai chiesto tu il recupero, ignora questo messaggio.`,
  };
}

export function recoveryRedirect(origin: string): string | null {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return null;
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) return null;
  if (url.username || url.password) return null;
  return `${url.origin}/login/nuova`;
}
