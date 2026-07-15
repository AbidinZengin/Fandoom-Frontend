import { FandoomLogo } from './FandoomLogo';
import './Hero.css';

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__sparkle hero__sparkle--tr" aria-hidden="true">
        <SparkleIcon />
      </div>
      <div className="hero__sparkle hero__sparkle--bl" aria-hidden="true">
        <SparkleIcon />
      </div>

      <div className="hero__content">
        <FandoomLogo showTagline={true} glowOpacity={0.55} />
        <button type="button" className="hero__cta">
          Explore
        </button>
      </div>
    </section>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 34 34" width="100%" height="100%">
      <path
        d="M 17 1 C 18.5 10 24 15.5 33 17 C 24 18.5 18.5 24 17 33 C 15.5 24 10 18.5 1 17 C 10 15.5 15.5 10 17 1 Z"
        fill="currentColor"
      />
    </svg>
  );
}
