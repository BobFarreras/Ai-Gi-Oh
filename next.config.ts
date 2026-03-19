// next.config.ts - Configuración global de Next.js para optimización de imágenes y build.
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [28, 40, 45, 55, 75],
  },
  async redirects() {
    return [
      { source: "/hub/training", destination: "/hub/academy", permanent: false },
      { source: "/hub/training/arena", destination: "/hub/academy/training/arena", permanent: false },
      { source: "/hub/training/tutorial", destination: "/hub/academy/training/tutorial", permanent: false },
      { source: "/hub/tutorial", destination: "/hub/academy/tutorial", permanent: false },
      { source: "/hub/tutorial/arsenal", destination: "/hub/academy/tutorial/arsenal", permanent: false },
      { source: "/hub/tutorial/market", destination: "/hub/academy/tutorial/market", permanent: false },
      { source: "/hub/tutorial/reward", destination: "/hub/academy/tutorial/reward", permanent: false },
    ];
  },
};

export default nextConfig;
