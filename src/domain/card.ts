export function showPhone(phone: string | null | undefined): boolean {
  return Boolean(phone && /\d/.test(phone));
}

export function phoneHref(phone: string | null | undefined): string | null {
  if (!showPhone(phone)) return null;
  const compact = phone!.trim().replace(/[^\d+]/g, "");
  if (!compact) return null;
  return `tel:${compact}`;
}

export function mailHref(email: string | null | undefined): string | null {
  const value = email?.trim() ?? "";
  if (!value || /[\r\n]/.test(email ?? "")) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return `mailto:${value}`;
}

function digits(phone: string): string {
  return phone.trim().replace(/[^\d+]/g, "");
}

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function cardText(value: string): string {
  return oneLine(value).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function foldLine(line: string): string[] {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return [line];
  const parts: string[] = [];
  let offset = 0;
  let width = 75;
  while (offset < bytes.length) {
    let end = Math.min(offset + width, bytes.length);
    if (end < bytes.length) {
      while (end > offset && (bytes[end] & 0xc0) === 0x80) end -= 1;
      if (end === offset) end = Math.min(offset + width, bytes.length);
    }
    const chunk = bytes.subarray(offset, end).toString("utf8");
    parts.push(parts.length === 0 ? chunk : ` ${chunk}`);
    offset = end;
    width = 74;
  }
  return parts;
}

export function buildVcard(input: {
  name: string;
  phone: string | null;
  email: string | null;
  area: string | null;
}): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${cardText(input.name)}`,
    "ORG:Elleboro Giardini",
  ];
  if (showPhone(input.phone)) lines.push(`TEL:${digits(input.phone!)}`);
  if (input.email && oneLine(input.email)) lines.push(`EMAIL:${cardText(input.email)}`);
  if (input.area && oneLine(input.area)) lines.push(`NOTE:${cardText(input.area)}`);
  lines.push("END:VCARD");
  return lines.flatMap(foldLine).join("\r\n");
}
