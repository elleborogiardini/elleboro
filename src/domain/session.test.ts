import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { copySetCookies } from "@/domain/session";

describe("sessione", () => {
  it("un passaggio non perde i cookie rinnovati", () => {
    const headers = new Headers();
    copySetCookies(
      [
        "sb-access-token=rinnovato; HttpOnly; Path=/; SameSite=Lax",
        "sb-refresh-token=rinnovato; HttpOnly; Path=/",
      ],
      headers,
    );
    expect(headers.getSetCookie()).toEqual([
      "sb-access-token=rinnovato; HttpOnly; Path=/; SameSite=Lax",
      "sb-refresh-token=rinnovato; HttpOnly; Path=/",
    ]);
    const source = readFileSync("src/proxy.ts", "utf8");
    const after = source.slice(source.indexOf("supabase.auth.getUser"));
    expect(after).toContain("copySetCookies(");
    expect(after).not.toContain("return NextResponse.redirect");
  });
});
