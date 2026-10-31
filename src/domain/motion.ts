export const motionEase = [0.16, 1, 0.3, 1] as const;

export function screenMotion(path: string, reduced: boolean) {
  if (reduced) return { instant: true as const };
  if (path.startsWith("/app") || path === "/login") {
    if (path.includes("/clienti/") || path.includes("/richieste/")) {
      return { x: 28, duration: 0.22, opacity: 1 as const };
    }
    return { opacity: 0.92, duration: 0.18 };
  }
  return { y: 16, duration: 0.4, opacity: 1 as const };
}

export function openingMotion(reduced: boolean) {
  if (reduced) return { instant: true as const };
  return { y: 16, duration: 0.7, opacity: 1 as const };
}
