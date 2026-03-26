import Header from "../header";
import Footer from "../footer";
import Hero from "../hero";
import HomeIntro from "./home-intro";
import HomeQuickCards from "./home-quick-cards";
import HomeSchemesSection from "./home-schemes-section";
import HomePostUpdates from "./useful-blogs";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />

      <main className="flex-1 w-full">
        <Hero />
        <div className="max-w-7xl mx-auto w-full px-6 py-12">
          <HomeIntro />
          <HomeQuickCards />
          <HomeSchemesSection />
          <HomePostUpdates />
        </div>
      </main>

      <Footer />
    </div>
  );
}
