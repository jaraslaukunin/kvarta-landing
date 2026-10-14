import type { MetadataRoute } from "next";

import { siteUpdated } from "@/lib/site";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kvarta-minsk.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      // фиксированная дата: страница статическая, «сейчас» здесь смысла не имеет
      lastModified: new Date(siteUpdated),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
