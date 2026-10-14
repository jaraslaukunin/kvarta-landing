import type { Metadata, Viewport } from "next";
import { Bitter, Golos_Text, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Bitter({
  subsets: ["cyrillic", "latin"],
  variable: "--font-bitter",
  display: "swap",
});

const body = Golos_Text({
  subsets: ["cyrillic", "latin"],
  variable: "--font-golos",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["cyrillic", "latin"],
  variable: "--font-mono-jet",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kvarta-minsk.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Кварта — обжарка кофе в Минске. Обжариваем по четвергам, привозим по пятницам",
    template: "%s — Кварта",
  },
  description:
    "Мастерская обжарки на ул. Короля, 9. Партии по 5 кг, обжарка в четверг, доставка по Минску в пятницу. Зерно у вас на 1–3 день после обжарки. Подписка 54 BYN в месяц.",
  keywords: [
    "кофе Минск",
    "обжарка кофе",
    "свежеобжаренный кофе",
    "подписка на кофе",
    "кофе в зерне Минск",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "Обжарка «Кварта»",
    title: "Кварта — обжарка кофе в Минске",
    description:
      "Обжариваем по четвергам, развозим по Минску по пятницам. Зерно у вас на 1–3 день после обжарки.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Обжарка «Кварта»: обжариваем по четвергам, привозим по пятницам",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Кварта — обжарка кофе в Минске",
    description: "Обжариваем по четвергам, развозим по пятницам. Свежесть видно по дате на пачке.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f2ebdd",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
