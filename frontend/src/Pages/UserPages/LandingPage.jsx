import Features from "../../Sections/UserSections/Features";
import Footer from "../../Sections/UserSections/Footer";
import Hero from "../../Sections/UserSections/Hero";
import PhotoGrid from "../../Sections/UserSections/PhotoGrid";
import Banner from "../../Sections/UserSections/Banner";
import SupportBanner from "../../Sections/UserSections/SupportBanner";
import Faq from "../../Sections/UserSections/Faq";
import PlatformRatingsTestimonials from "../../Sections/UserSections/PlatformRatingsTestimonials";

const LandingPage = () => {
  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-900">
        <Hero />
        <PhotoGrid />
        <Features />
        <Faq />
        <section className="w-full py-16 md:py-20 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-5xl mx-auto px-4 md:px-6 grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch xl:auto-rows-fr">
            <div className="min-h-0 flex w-full xl:h-full">
              <SupportBanner compact />
            </div>
            <div className="min-h-0 flex w-full xl:h-full">
              <Banner compact />
            </div>
          </div>
        </section>
        <PlatformRatingsTestimonials />
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;
