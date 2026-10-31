import { timingSafeEqual } from "node:crypto";

export function feedTokenMatches(token: string): boolean {
  const expected = process.env.CALENDAR_FEED_TOKEN ?? "";
  const left = Buffer.from(expected);
  const right = Buffer.from(token);
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
