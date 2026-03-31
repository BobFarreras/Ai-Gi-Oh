// next.config.ts - Configuración global de Next.js para optimización de imágenes y build.
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [28, 40, 45, 55, 75],
  },
  async redirects() {
    return [
      { source: "/hub/training", destination: "/hub/academy", permanent: true },
      { source: "/hub/training/:path*", destination: "/hub/academy/training/:path*", permanent: true },
      { source: "/hub/tutorial", destination: "/hub/academy/tutorial", permanent: true },
      { source: "/hub/tutorial/:path*", destination: "/hub/academy/tutorial/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
