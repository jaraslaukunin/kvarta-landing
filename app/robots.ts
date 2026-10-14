import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/lib/asset";

// нужно для статического экспорта на GitHub Pages
export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kvarta-minsk.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${siteUrl}${BASE_PATH}/sitemap.xml`,
    host: siteUrl,
  };
}
