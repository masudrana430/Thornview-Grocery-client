import { lazy } from "react";

import Container from "../../Components/Container";
import ViewportSection from "../../Components/ViewportSection";

// Above-the-fold sections: load immediately.
import PromoMosaic from "./components/PromoMosaic";
import BrandBannersRow from "./components/BrandBannersRow";
import BigDealGrid from "./components/BigDealGrid";

// Below-the-fold sections: separate JavaScript chunks.
const ProductRail = lazy(() =>
  import("./components/ProductRail")
);

const HeroWithRail = lazy(() =>
  import("./components/HeroWithRail")
);

const RailSection = lazy(() =>
  import("./components/RailSection")
);

const RailWithBanner = lazy(() =>
  import("./components/RailWithBanner")
);

const DepartmentScroller = lazy(() =>
  import("./components/DepartmentScroller")
);

const SupportBanner = lazy(() =>
  import("./components/SupportBanner")
);

export default function Home() {
  return (
    <main className="bg-base-100">
      <Container>
        <div className="space-y-10 py-5">
          {/* Critical visible content */}
          <PromoMosaic className="mb-10" />

          <BrandBannersRow title="Brands for you" />

          <BigDealGrid title="This week’s highlights" />

          {/* Near-viewport progressive sections */}
          <ViewportSection
            minHeight={360}
            ariaLabel="Baby must-have products"
          >
            <ProductRail railKey="baby-musts" />
          </ViewportSection>

          <ViewportSection
            minHeight={480}
            ariaLabel="Holiday gifts"
          >
            <HeroWithRail sectionKey="gifts-holiday" />
          </ViewportSection>

          <ViewportSection
            minHeight={420}
            ariaLabel="Save for next season"
          >
            <RailWithBanner sectionKey="save-for-season" />
          </ViewportSection>

          <ViewportSection
            minHeight={260}
            ariaLabel="Shop by department"
          >
            <DepartmentScroller />
          </ViewportSection>

          <ViewportSection
            minHeight={360}
            ariaLabel="Weekly flyer"
          >
            <RailSection sectionKey="weekly-flyer" />
          </ViewportSection>

          <ViewportSection
            minHeight={220}
            ariaLabel="Customer support"
          >
            <SupportBanner />
          </ViewportSection>

          <ViewportSection
            minHeight={360}
            ariaLabel="Weekend savings"
          >
            <RailSection sectionKey="save-for-weekends" />
          </ViewportSection>

          <ViewportSection
            minHeight={420}
            ariaLabel="Beauty partner products"
          >
            <RailWithBanner sectionKey="beautypeak-partner" />
          </ViewportSection>

          <ViewportSection
            minHeight={360}
            ariaLabel="Gift cards"
          >
            <RailSection sectionKey="gift-cards" />
          </ViewportSection>
        </div>
      </Container>
    </main>
  );
}