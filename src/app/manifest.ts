import type { MetadataRoute } from "next";
import { installTarget, launchColors } from "@/domain/pwa";

export default function manifest(): MetadataRoute.Manifest {
  const install = installTarget();
  const colors = launchColors();
  return {
    name: install.name,
    short_name: install.name,
    start_url: install.startUrl,
    display: install.display,
    background_color: colors.light,
    theme_color: colors.light,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
