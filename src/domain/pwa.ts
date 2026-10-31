export function launchColors() {
  return { light: "#f3f8f4", dark: "#0f1911" };
}

export function installTarget() {
  return {
    name: "Elleboro",
    startUrl: "/app",
    display: "standalone" as const,
  };
}

export function shouldCacheAsset(mode: string, pathname: string): boolean {
  if (mode === "navigate") return false;
  if (pathname.startsWith("/app") || pathname.startsWith("/login")) return false;
  return pathname.startsWith("/icons/") || pathname.startsWith("/_next/static/");
}
