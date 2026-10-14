import { Assortment } from "@/components/Assortment";
import { Delivery } from "@/components/Delivery";
import { Faq } from "@/components/Faq";
import { Freshness } from "@/components/Freshness";
import { Hero } from "@/components/Hero";
import { LeadForm } from "@/components/LeadForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Story } from "@/components/Story";
import { Subscription } from "@/components/Subscription";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Story />
        <Freshness />
        <Assortment />
        <Subscription />
        <Delivery />
        <Faq />
        <LeadForm />
      </main>
      <SiteFooter />
    </>
  );
}
