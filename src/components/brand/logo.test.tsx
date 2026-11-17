import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

describe("logo", () => {
  it("il componente dichiara le stesse dimensioni del file", async () => {
    const meta = await sharp("public/brand/logo.jpg").metadata();
    const source = readFileSync("src/components/brand/Logo.tsx", "utf8");
    expect(source).toContain(`width={${meta.width}}`);
    expect(source).toContain(`height={${meta.height}}`);
  });
});
