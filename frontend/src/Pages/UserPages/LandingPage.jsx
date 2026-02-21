import Features from "../../Sections/UserSections/Features";
import Footer from "../../Sections/UserSections/Footer";
import Hero from "../../Sections/UserSections/Hero";
import PhotoGrid from "../../Sections/UserSections/PhotoGrid";
import Banner from "../../Sections/UserSections/Banner";
import Contact from "../../Sections/UserSections/Contact";
import Faq from "../../Sections/UserSections/Faq";

const LandingPage = () => {
  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-900">
        <Hero />
        <PhotoGrid />
        <Features />
        <Faq />
        <Contact />
        <Banner />
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;
