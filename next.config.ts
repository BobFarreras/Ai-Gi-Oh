// next.config.ts - Configuración global de Next.js para optimización de imágenes y build.
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [28, 40, 45, 55, 75],
  },
};

export default nextConfig;
