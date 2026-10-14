import type { MetadataRoute } from "next";

export const dynamic = "force-static";

import { BASE_PATH } from "@/lib/asset";
import { siteUpdated } from "@/lib/site";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kvarta-minsk.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}${BASE_PATH}/`,
      // фиксированная дата: страница статическая, «сейчас» здесь смысла не имеет
      lastModified: new Date(siteUpdated),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
