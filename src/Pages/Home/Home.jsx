import React from "react";
import Container from "../../Components/Container";
import PromoMosaic from "./components/PromoMosaic";
import BrandBannersRow from "./components/BrandBannersRow";
import BigDealGrid from "./components/BigDealGrid";
import ProductRail from "./components/ProductRail";
import HeroWithRail from "./components/HeroWithRail";
// Use the components we just added
import RailSection from "./components/RailSection";
import RailWithBanner from "./components/RailWithBanner";
import DepartmentScroller from "./components/DepartmentScroller";
import SupportBanner from "./components/SupportBanner";

export default function Home() {
  // ✅ Replace these with API data later (from /api/home)



  // ---------------- Demo data (replace with API later) ----------------




  // -------------------------------------------------------------------

  return (
    <div className="bg-base-100">
      <Container>
        <div className="py-5 space-y-10">
           <PromoMosaic className="mb-10" />

          <BrandBannersRow title="Brands for you"  />

          <BigDealGrid title="This week’s highlights"  />

          <ProductRail
            railKey="baby-musts"
            
          />

          <HeroWithRail
            sectionKey="gifts-holiday"
          />

          {/* ✅ “Save it for next season” (rail + banner on right) */}
          <RailWithBanner
            sectionKey="save-for-season"
          />

          {/* ✅ Shop by department */}
          <DepartmentScroller
            
          />

          {/* ✅ Trending in your area */}
          <RailSection
            sectionKey="weekly-flyer"
          />

          {/* ✅ Support banner */}
          <SupportBanner />

          {/* ✅ Rollbacks-style large promo mosaic (use your existing promo grid later)
              For now, keep this as another rail section or add your PromoMosaic here. */}
          <RailSection
            sectionKey="save-for-weekends"
          />

          

          {/* ✅ Brand partner (rail + big banner on right like your screenshot) */}
          <RailWithBanner
            sectionKey="beautypeak-partner"
          />

          {/* ✅ Gift cards rail */}
          <RailSection
            sectionKey="gift-cards"
          />
        </div>
      </Container>
    </div>
  );
}
