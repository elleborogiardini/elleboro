import sharp from "sharp";

export function signedPhotoSeconds(): number {
  return 600;
}

export async function stripPrivateExif(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes).rotate().jpeg({ quality: 82 }).toBuffer();
}
