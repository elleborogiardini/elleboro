"use client";

import {
  CalendarBlank,
  FlowerTulip,
  Tray,
  Users,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { shellChrome, tabCurrent, tabsFor } from "@/domain/shell";

const icons = {
  Clienti: Users,
  Agenda: CalendarBlank,
  Richieste: Tray,
  Sito: FlowerTulip,
} as const;

export function Shell({
  role,
  children,
}: {
  role: "owner" | "technician";
  children: ReactNode;
}) {
  const path = usePathname();
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  const visible = tabsFor(role);
  const chrome = shellChrome(path);

  return (
    <div className="app-shell">
      <header className="app-top">
        {chrome.back ? (
          <Link href={chrome.back} aria-label="Indietro">
            Indietro
          </Link>
        ) : null}
        <h1>{chrome.title}</h1>
      </header>
      <main className="app-main">
        {online ? null : (
          <p className="mb-4">Senza rete i dati non si aggiornano.</p>
        )}
        {children}
      </main>
      <nav className="app-tabbar" aria-label="Gestionale">
        {visible.map((tab) => {
          const current = tabCurrent(tab.href, path);
          const Icon = icons[tab.label];
          return (
            <Link key={tab.href} href={tab.href} aria-current={current ? "page" : undefined}>
              <Icon size={22} weight="regular" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function RegisterSw() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  return null;
}
