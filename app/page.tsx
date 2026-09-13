import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import {
  FinalCtaSection,
  HeroSection,
  IntegrationsSection,
  MarqueeSection,
  PlansSection,
  RolesSliderSection,
  StatsSection,
  StickyTabsSection,
  UnstoppableSection,
} from "@/components/marketing/landing";

/**
 * fathom.ai landing page rebuilt from the live DOM with Fathom's own assets
 * (see public/fathom): hero composition, G2 badge, customer logos, marquee
 * ship, planet video, feature tab imagery, product overview, integration
 * icons, role illustrations, CTA background.
 */
export default function LandingPage() {
  return (
    <div className="bg-black font-sans text-off-white">
      <MarketingNav />
      <HeroSection />
      <MarqueeSection />
      <PlansSection />
      <StickyTabsSection />
      <StatsSection />
      <UnstoppableSection />
      <IntegrationsSection />
      <RolesSliderSection />
      <FinalCtaSection />
      <MarketingFooter />
    </div>
  );
}
