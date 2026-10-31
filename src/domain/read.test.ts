import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rowOrFail, rowsOrFail } from "@/domain/read";

describe("liste del gestionale", () => {
  it("un errore di lettura non diventa una lista vuota", () => {
    expect(() => rowsOrFail({ message: "permesso" }, [])).toThrow(
      "Non sono riuscito a caricare questa schermata.",
    );
    expect(rowsOrFail(null, null)).toEqual([]);
    expect(rowsOrFail(null, [{ id: "a" }])).toEqual([{ id: "a" }]);
    expect(() => rowOrFail({ message: "permesso" }, null)).toThrow(
      "Non sono riuscito a caricare questa schermata.",
    );
    expect(rowOrFail(null, null)).toBeNull();
    expect(rowOrFail(null, { id: "a" })).toEqual({ id: "a" });

    const records = readFileSync("src/lib/records.ts", "utf8");
    expect(records).not.toContain("const { data } = await supabase");
    const data = readFileSync("src/lib/data.ts", "utf8");
    const clients = data.slice(data.indexOf("export async function listClients"));
    expect(clients).toContain("rowsOrFail");
    expect(clients).toContain("rowOrFail");
  });
});
