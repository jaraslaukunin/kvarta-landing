import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // 60 — для крупных декоративных фото, 75 — по умолчанию для next/image
    qualities: [60, 75],
  },
};

export default nextConfig;
