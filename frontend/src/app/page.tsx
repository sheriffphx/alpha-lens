import Navbar from "@/components/Navbar";
import Hero from "@/sections/Hero";
import Stats from "@/sections/Stats";
import Features from "@/sections/Features";
import HowItWorks from "@/sections/HowItWorks";
import CTA from "@/sections/CTA";
import Footer from "@/sections/Footer";

export default function Home() {
  return (
    <>
      <div className="bg-[rgb(0,0,0)] text-white flex flex-col overflow-hidden">
        <Navbar />
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <CTA />
        <Footer />
      </div>
    </>
  );
}
