import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function action(name: string, next: string): string {
  const source = readFileSync("src/server/actions.ts", "utf8");
  const start = source.indexOf(`export async function ${name}`);
  return source.slice(start, source.indexOf(`export async function ${next}`));
}

describe("archivio", () => {
  it("se il cliente non si archivia, non sparisce dalla lista", () => {
    const body = action("archiveClientAction", "createPlaceAction");
    const check = body.indexOf("if (error)");
    expect(check).toBeGreaterThan(0);
    expect(check).toBeLessThan(body.indexOf('redirect("/app")'));
    expect(body).toContain("Non sono riuscito ad archiviare.");
  });

  it("se la nota non si archivia, resta visibile con l'errore", () => {
    const body = action("archiveNoteAction", "createAppointmentAction");
    const check = body.indexOf("if (error)");
    expect(check).toBeGreaterThan(0);
    expect(check).toBeLessThan(body.indexOf("revalidatePath"));
    expect(body).toContain("Le note sono riservate al proprietario.");
  });
});
