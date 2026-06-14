import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["images.pokemontcg.io"],
  },
  allowedDevOrigins: ["anyone-survey-tinker.ngrok-free.dev"],
};

export default nextConfig;