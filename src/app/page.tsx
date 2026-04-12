import Header from "@/components/Header";
import HeroEntry from "@/components/HeroEntry";
import About from "@/components/About";
import RnD from "@/components/RnD";
import Careers from "@/components/Careers";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroEntry />
        <About />
        <RnD />
        <Careers />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
