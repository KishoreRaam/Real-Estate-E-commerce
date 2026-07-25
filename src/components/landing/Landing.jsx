import Nav from "./Nav";
import Hero from "./Hero";
import PaperTrail from "./PaperTrail";
import HowWeVerify from "./HowWeVerify";
import Agents from "./Agents";
import Footer from "./Footer";

export default function Landing() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <PaperTrail />
        <HowWeVerify />
        <Agents />
      </main>
      <Footer />
    </>
  );
}
