import { describe, expect, it } from "vitest";
import { toPublicTestimonial } from "@/domain/testimonials";

describe("testimonianze", () => {
  it("senza voci visibili non restituisce nulla da mostrare", () => {
    expect(
      toPublicTestimonial({
        quote: "Un giardino ordinato.",
        author: "Chiara Neri",
        context: "cliente",
        visible: false,
      }),
    ).toBeNull();
  });

  it("una testimonianza pubblica non ha un id cliente", () => {
    const published = toPublicTestimonial({
      quote: "Ha seguito il terrazzo con cura.",
      author: "Chiara Neri",
      context: "terrazzo",
      visible: true,
      clientId: "should-not-leak",
    });
    expect(published).toEqual({
      quote: "Ha seguito il terrazzo con cura.",
      author: "Chiara Neri",
      context: "terrazzo",
    });
    expect(published).not.toHaveProperty("clientId");
  });
});
