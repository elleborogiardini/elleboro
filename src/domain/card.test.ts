import { describe, expect, it } from "vitest";
import { buildVcard, mailHref, phoneHref, showPhone } from "@/domain/card";

describe("biglietto da visita", () => {
  it("senza telefono non mostra un numero", () => {
    expect(showPhone(null)).toBe(false);
    expect(showPhone("")).toBe(false);
    expect(showPhone("   ")).toBe(false);
    expect(phoneHref(null)).toBeNull();
    expect(phoneHref("  ")).toBeNull();
  });

  it("con un telefono il link e tel e il vCard lo include", () => {
    expect(phoneHref("333 445 5667")).toBe("tel:3334455667");
    const card = buildVcard({
      name: "Hasith Conthrath",
      phone: "333 445 5667",
      email: "studio@example.com",
      area: "Bologna",
    });
    expect(card).toContain("FN:Hasith Conthrath");
    expect(card).toContain("ORG:Elleboro Giardini");
    expect(card).toContain("TEL:3334455667");
    expect(card).toContain("EMAIL:studio@example.com");
    expect(card).toContain("Bologna");
    expect(card).not.toContain("Via ");
  });

  it("una parola non è un telefono e il vCard non ha TEL", () => {
    expect(showPhone("ciao")).toBe(false);
    expect(phoneHref("ciao")).toBeNull();
    const card = buildVcard({
      name: "Hasith Conthrath",
      phone: "ciao",
      email: null,
      area: null,
    });
    expect(card).not.toContain("TEL:");
  });

  it("senza telefono il vCard non inventa un TEL", () => {
    const card = buildVcard({
      name: "Hasith Conthrath",
      phone: null,
      email: null,
      area: null,
    });
    expect(card).not.toContain("TEL:");
  });

  it("senza email non apre un messaggio", () => {
    expect(mailHref(null)).toBeNull();
    expect(mailHref("  ")).toBeNull();
    expect(mailHref("non è una mail")).toBeNull();
  });

  it("con un indirizzo il link apre la posta", () => {
    expect(mailHref(" studio@example.com ")).toBe("mailto:studio@example.com");
  });

  it("un a capo nell'indirizzo non aggiunge un campo alla posta", () => {
    expect(mailHref("studio@example.com\nBCC:altro@example.com")).toBeNull();
  });

  it("un a capo nel testo non aggiunge un telefono", () => {
    const card = buildVcard({
      name: "Hasith\nTEL:000",
      phone: null,
      email: "studio@example.com\r\nTEL:111",
      area: "Bologna\nTEL:222",
    });
    const lines = card.split("\r\n");
    expect(lines.some((line) => line.startsWith("TEL:"))).toBe(false);
    expect(lines.some((line) => line.startsWith("EMAIL:"))).toBe(true);
    expect(lines.filter((line) => line.startsWith("FN:")).length).toBe(1);
  });

  it("un punto e virgola nel nome resta nel nome", () => {
    const card = buildVcard({
      name: "Hasith;Conthrath",
      phone: null,
      email: null,
      area: "Milano, centro",
    });
    const lines = card.split("\r\n");
    expect(lines).toContain("FN:Hasith\\;Conthrath");
    expect(lines).toContain("NOTE:Milano\\, centro");
    expect(lines.filter((line) => line.startsWith("FN:")).length).toBe(1);
    expect(lines.some((line) => line.startsWith("TEL:"))).toBe(false);
  });

  it("una riga del contatto non supera settantacinque ottetti", () => {
    const name = "Hasith Conthrath del giardino lungo";
    const full = `${name} ${name} ${name}`;
    const card = buildVcard({
      name: full,
      phone: null,
      email: null,
      area: null,
    });
    const lines = card.split("\r\n");
    expect(lines.every((line) => Buffer.byteLength(line, "utf8") <= 75)).toBe(true);
    const unfolded = lines.reduce<string[]>((rows, line) => {
      if (line.startsWith(" ")) rows[rows.length - 1] += line.slice(1);
      else rows.push(line);
      return rows;
    }, []);
    expect(unfolded).toContain(`FN:${full}`);
  });
});
