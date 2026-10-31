export function copySetCookies(cookies: string[], headers: Headers): void {
  for (const cookie of cookies) {
    if (cookie.trim()) headers.append("set-cookie", cookie);
  }
}
