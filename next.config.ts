import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Twitch clip/VOD thumbnails.
      // [VERIFY] Twitch serves thumbnails from several CDN hosts; these are the
      // commonly observed ones. Confirm against a live Helix response and add
      // any additional host encountered before relying on this in production.
      {
        protocol: "https",
        hostname: "clips-media-assets2.twitch.tv",
      },
      {
        protocol: "https",
        hostname: "*.jtvnw.net",
      },
      // YouTube thumbnails.
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      // PTCG binder card images — verified from live binder.json imageUrl values.
      {
        protocol: "https",
        hostname: "images.pokemontcg.io",
      },
    ],
  },
};

export default nextConfig;
