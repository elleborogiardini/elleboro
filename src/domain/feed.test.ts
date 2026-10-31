import { describe, expect, it } from "vitest";
import { agendaListSelect, appointmentFeedSelect } from "@/domain/feed";
import { feedTokenMatches } from "@/lib/feed-token";

describe("feed calendario", () => {
  it("chiede orario, titolo, cliente e luogo, e non chiede note né preferenze", () => {
    expect(appointmentFeedSelect).toContain("title");
    expect(appointmentFeedSelect).toContain("starts_at");
    expect(appointmentFeedSelect).toContain("ends_at");
    expect(appointmentFeedSelect).toContain("full_name");
    expect(appointmentFeedSelect).toContain("places(label)");
    expect(appointmentFeedSelect).not.toMatch(/note|preference|specific|body/i);
  });

  it("l'agenda in app non carica l'indirizzo di casa", () => {
    expect(agendaListSelect).toContain("full_name");
    expect(agendaListSelect).toContain("places(label)");
    expect(agendaListSelect).toContain("include_address");
    expect(agendaListSelect).not.toContain("full_name, address");
    expect(agendaListSelect).not.toMatch(/note|preference|specific|body/i);
  });

  it("un token diverso non apre il feed e non lo fa cadere", () => {
    const previous = process.env.CALENDAR_FEED_TOKEN;
    process.env.CALENDAR_FEED_TOKEN = "abcd";
    try {
      expect(feedTokenMatches("abcd")).toBe(true);
      expect(feedTokenMatches("abce")).toBe(false);
      expect(feedTokenMatches("ääää")).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.CALENDAR_FEED_TOKEN;
      else process.env.CALENDAR_FEED_TOKEN = previous;
    }
  });
});
