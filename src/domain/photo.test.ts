import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { signedPhotoSeconds, stripPrivateExif } from "@/domain/photo";

describe("fascicolo, foto", () => {
  it("toglie i dati EXIF prima di salvare la foto del luogo", async () => {
    const marked = await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 20, g: 80, b: 40 } },
    })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Copyright: "segreto del cliente" } } })
      .toBuffer();
    const clean = await stripPrivateExif(marked);
    const meta = await sharp(clean).metadata();
    expect(meta.exif).toBeUndefined();
    expect(clean.includes(Buffer.from("segreto del cliente"))).toBe(false);
  });

  it("il link della foto privata dura pochi minuti", () => {
    expect(signedPhotoSeconds()).toBe(600);
    expect(signedPhotoSeconds()).toBeLessThan(60 * 60);
    const records = readFileSync("src/lib/records.ts", "utf8");
    expect(records).toContain("signedPhotoSeconds()");
    expect(records).not.toContain("60 * 10");
  });
});
