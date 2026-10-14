import type { NextConfig } from "next";

/**
 * Два режима сборки:
 *  - обычный (Node/Vercel): есть API-роуты, оптимизация картинок, Cache Components;
 *  - статический экспорт для GitHub Pages: `STATIC_EXPORT=1`, без сервера.
 *    Адрес раздачи — /<репозиторий>/, поэтому задаём basePath через NEXT_PUBLIC_BASE_PATH.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Cache Components и PPR здесь не нужны: страница и так статическая,
  // а их включение запрещает segment config `dynamic` в robots/sitemap,
  // без которого не собирается статический экспорт для GitHub Pages.
  ...(isStaticExport ? { output: "export" as const, trailingSlash: true } : {}),
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  images: {
    // 60 — для крупных декоративных фото, 75 — по умолчанию для next/image
    qualities: [60, 75],
    // на статическом хостинге нет оптимизатора картинок
    unoptimized: isStaticExport,
  },
};

export default nextConfig;
