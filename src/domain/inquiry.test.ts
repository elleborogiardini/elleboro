import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { emptyInquiries, inquiryFacts, inquiryOpenStamp, inquiryStatusChoices, inquirySummary, recentInquiryCount, reviewInquiry, throttleMark } from "@/domain/inquiry";

const started = 1_000_000;

const draft = {
  name: "Luca Ferri",
  contact: "3331112223",
  placeKind: "balcone" as const,
  need: "cura" as const,
  area: "Bologna",
  message: "Vorrei una visita in settimana.",
  company: "",
  startedAt: started,
};

describe("richiesta pubblica", () => {
  it("salva una richiesta e non crea un fascicolo", () => {
    const result = reviewInquiry(draft, started + 4_000, 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inquiry).toMatchObject({
      name: "Luca Ferri",
      contact: "3331112223",
      placeKind: "balcone",
      need: "cura",
      area: "Bologna",
      message: "Vorrei una visita in settimana.",
    });
    expect(result).not.toHaveProperty("client");
    expect(result.inquiry).not.toHaveProperty("address");
    expect(result.inquiry).not.toHaveProperty("clientId");
  });

  it("rifiuta il campo nascosto, l'invio troppo rapido e il tetto orario", () => {
    expect(reviewInquiry({ ...draft, company: "bot" }, started + 4_000, 0).ok).toBe(
      false,
    );
    expect(reviewInquiry(draft, started + 500, 0).ok).toBe(false);
    expect(reviewInquiry({ ...draft, startedAt: 0 }, started + 4_000, 0).ok).toBe(false);
    const capped = reviewInquiry(draft, started + 4_000, 5);
    expect(capped.ok).toBe(false);
    if (!capped.ok) expect(capped.error).toBe("Troppe richieste. Riprova più tardi.");
  });

  it("l'orario di apertura lo scrive il server e un valore vuoto non anticipa l'invio", () => {
    expect(inquiryOpenStamp(undefined, 5_000)).toBe("5000");
    expect(inquiryOpenStamp("0", 5_000)).toBe("5000");
    expect(inquiryOpenStamp("9000", 5_000)).toBe("5000");
    expect(inquiryOpenStamp("1000", 5_000)).toBe("1000");
  });

  it("se il conteggio non si legge, la richiesta non parte", () => {
    expect(recentInquiryCount(null, { message: "permesso" })).toBeNull();
    expect(recentInquiryCount(null, null)).toBeNull();
    expect(recentInquiryCount(2, null)).toBe(2);
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function submitInquiryAction"),
      action.indexOf("export async function setInquiryStatusAction"),
    );
    expect(body).not.toContain("count ?? 0");
    expect(body).toContain("recentInquiryCount");
  });

  it("il tetto si segna prima di accettare la richiesta", () => {
    expect(throttleMark({ message: "scrittura" }).ok).toBe(false);
    expect(throttleMark(null).ok).toBe(true);
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function submitInquiryAction"),
      action.indexOf("export async function setInquiryStatusAction"),
    );
    const mark = body.indexOf('from("inquiry_throttle").insert');
    const saved = body.indexOf('from("inquiries").insert');
    expect(mark).toBeGreaterThan(-1);
    expect(mark).toBeLessThan(saved);
    expect(body).toContain("throttleMark");
  });

  it("la richiesta aperta segna solo lo stato attuale", () => {
    const current = inquiryStatusChoices("in corso");
    expect(current.map((choice) => choice.value)).toEqual(["nuova", "in corso", "chiusa"]);
    expect(current.filter((choice) => choice.pressed).map((choice) => choice.value)).toEqual(["in corso"]);
    expect(inquiryStatusChoices("sconosciuto").some((choice) => choice.pressed)).toBe(false);
    const page = readFileSync("src/app/app/richieste/[id]/page.tsx", "utf8");
    expect(page).toContain("inquiryStatusChoices");
    expect(page).toContain("aria-pressed={choice.pressed}");
    expect(page).toContain('className="choice"');
  });

  it("l'elenco vuoto dice che le richieste arrivano da /richiesta", () => {
    expect(emptyInquiries()).toContain("/richiesta");
    expect(emptyInquiries()).not.toMatch(/fase/i);
  });

  it("elenco e scheda usano le stesse parole del modulo", () => {
    expect(
      inquirySummary({ area: "Bologna", placeKind: "giardino", status: "nuova" }),
    ).toBe("Bologna, Giardino, Nuova");
    expect(inquirySummary({ area: " ", placeKind: "terrazzo", status: "in corso" })).toBe(
      "Terrazzo, In corso",
    );
    expect(
      inquiryFacts({ placeKind: "balcone", need: "entrambi", area: "Milano" }),
    ).toBe("Balcone, Progetto e cura, Milano");
    expect(inquiryFacts({ placeKind: "giardino", need: "cura", area: "" })).toBe("Giardino, Cura");
    const list = readFileSync("src/app/app/richieste/page.tsx", "utf8");
    const detail = readFileSync("src/app/app/richieste/[id]/page.tsx", "utf8");
    expect(list).toContain("inquirySummary");
    expect(list).not.toContain("{item.place_kind}");
    expect(detail).toContain("inquiryFacts");
    expect(detail).not.toContain("{inquiry.place_kind}");
  });
});
