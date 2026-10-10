import { ReactNode } from "react";
import HeroBgShape2 from "@app/assets/login-back.svg";

interface HeroSectionProps {
  // Left column: title, description, CTA/form — content differs per hero variant
  children: ReactNode;
  // Right column visual (see HeroAnimation.tsx for the SVG/PNG switch point)
  animation: ReactNode;
}

/**
 * Shared hero shell (section chrome, animated background circles, right-side
 * visual slot, bottom shape image) used by both HeroThree (regular landing)
 * and PreReleaseHero (coming-soon landing).
 */
export default function HeroSection({ children, animation }: HeroSectionProps) {
  return (
    <section className="hero-section hero-section-3 ptb-100">
      <div className="circles">
        <div className="point animated-point-1"></div>
        <div className="point animated-point-2"></div>
        <div className="point animated-point-3"></div>
        <div className="point animated-point-4"></div>
        <div className="point animated-point-5"></div>
        <div className="point animated-point-6"></div>
      </div>

      <div className="container">
        <div className="row align-items-center justify-content-between">
          <div className="col-md-6 col-lg-6">
            <div className="hero-content-left ptb-100">
              {children}
            </div>
          </div>

          <div className="col-md-6 col-lg-5">
            <div className="hero-animation-img">
              {animation}
            </div>
          </div>
        </div>
      </div>

      <img src={HeroBgShape2} className="shape-image" alt="shape " />
    </section>
  );
}
