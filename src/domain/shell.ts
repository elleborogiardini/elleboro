export type AppTab = {
  href: "/app" | "/app/agenda" | "/app/richieste" | "/app/sito";
  label: "Clienti" | "Agenda" | "Richieste" | "Sito";
  owner: boolean;
};

const tabs: AppTab[] = [
  { href: "/app", label: "Clienti", owner: false },
  { href: "/app/agenda", label: "Agenda", owner: true },
  { href: "/app/richieste", label: "Richieste", owner: false },
  { href: "/app/sito", label: "Sito", owner: false },
];

const appPath = /^\/app(?:\/[A-Za-z0-9-]+){0,3}$/;

export function tabCurrent(href: string, path: string): boolean {
  if (href === "/app") return path === "/app" || path.startsWith("/app/clienti");
  return path === href || path.startsWith(`${href}/`);
}

export function safeReturn(value: string): string | null {
  return appPath.test(value) ? value : null;
}

export function ownerDossierLinks(role: "owner" | "technician" | null, clientId: string) {
  if (role !== "owner") return [];
  return [
    { href: `/app/clienti/${clientId}/preferenze`, label: "Preferenze e specifiche" },
    { href: `/app/clienti/${clientId}/note`, label: "Note" },
  ];
}

export function tabsFor(role: "owner" | "technician"): AppTab[] {
  return tabs.filter((tab) => !tab.owner || role === "owner");
}

export function shellChrome(path: string): { title: string; back: string | null } {
  const roots = new Set(["/app", "/app/agenda", "/app/richieste", "/app/sito"]);
  let title = "Clienti";
  if (path.startsWith("/app/agenda")) title = "Agenda";
  else if (path.startsWith("/app/richieste")) title = "Richieste";
  else if (path.startsWith("/app/sito")) title = "Sito";
  else if (path.includes("/preferenze")) title = "Preferenze";
  else if (path.includes("/note")) title = "Note";
  else if (path.startsWith("/app/clienti")) title = "Fascicolo";
  if (roots.has(path)) return { title, back: null };
  if (path.startsWith("/app/richieste/")) return { title, back: "/app/richieste" };
  if (path.includes("/clienti/")) {
    const parts = path.split("/");
    const back = parts.length > 4 ? `/app/clienti/${parts[3]}` : "/app";
    return { title, back };
  }
  return { title, back: "/app" };
}
