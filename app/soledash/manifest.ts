import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wonka Den | AEYE",
    short_name: "Wonka Den",
    description: "AEYE operator workbench on Betsy",
    start_url: "/soledash",
    scope: "/soledash",
    display: "standalone",
    background_color: "#0f1419",
    theme_color: "#0f1419",
    icons: [
      {
        src: "/assets/soledash/branding/soledash-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/assets/soledash/branding/soledash-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
