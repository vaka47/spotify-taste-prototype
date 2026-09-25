import Link from "next/link";
import "./demo.css";

export const metadata = {
  title: "Follow Taste - working product demo",
  description: "A mobile walkthrough of Follow Taste, a human-led discovery layer proposed for Spotify.",
};

export default function DemoPage() {
  return (
    <main className="demoPage">
      <section className="demoStage" aria-labelledby="demo-title">
        <div className="demoContent">
          <Link className="demoBrand" href="/pitch" aria-label="Open the Follow Taste product proposal">
            <span className="demoBrandMark" aria-hidden="true" />
            <span>
              <strong>Follow Taste</strong>
              <small>Product proposal for Spotify</small>
            </span>
          </Link>

          <div className="demoCopy">
            <span>WORKING PRODUCT DEMO</span>
            <h1 id="demo-title">Follow the taste of people who shape culture.</h1>
            <p>A 41-second walkthrough of the native artist profile, listening history, Taste queue and social discovery feed.</p>
          </div>

          <nav className="demoLinks" aria-label="Follow Taste resources">
            <Link className="demoPrimaryAction" href="/pitch">View product proposal</Link>
            <Link href="/tastemaker/travis-scott">Try the live prototype</Link>
            <a href="https://github.com/vaka47/spotify-taste-prototype" target="_blank" rel="noreferrer">Review the implementation</a>
          </nav>

          <div className="demoMeta">
            <p className="demoDisclosure">Celebrity listening shown in the concept is illustrative. Real listener profiles use authorized Spotify data.</p>
            <address className="demoContact">
              <span>Concept and prototype by Ivan Safonov</span>
              <a href="mailto:safonov47@gmail.com">safonov47@gmail.com</a>
              <a href="https://www.linkedin.com/in/safonovivan/" target="_blank" rel="noreferrer">LinkedIn</a>
            </address>
          </div>
        </div>

        <video
          className="demoVideo"
          autoPlay
          controls
          loop
          muted
          playsInline
          preload="metadata"
          poster="/demo/follow-taste-poster.png"
          aria-label="Follow Taste mobile product walkthrough"
        >
          <source src="/demo/follow-taste-mobile-demo.mp4" type="video/mp4" />
          Your browser does not support embedded video.
        </video>
      </section>
    </main>
  );
}
