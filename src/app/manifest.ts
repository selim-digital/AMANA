import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AMANA — Décharger. Clarifier. Avancer.",
    short_name: "AMANA",
    description:
      "Partenaire de progression adaptative : dépose ce qui encombre ton esprit, clarifie ce qui compte, avance une action à la fois.",
    start_url: "/aujourdhui",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F1E8",
    theme_color: "#F5F1E8",
    lang: "fr",
    categories: ["productivity", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
