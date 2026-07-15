import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { productions } from '../data/productions';
import './FeaturedCarousel.css';

export function FeaturedCarousel() {
  const trackRef = useRef(null);
  const [activeDot, setActiveDot] = useState(0);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });

  const dotCount = Math.max(1, productions.length - 3);

  const onPointerDown = (e) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      scrollLeft: trackRef.current.scrollLeft,
    };
    trackRef.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    trackRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
  };

  const onPointerUp = () => {
    isDragging.current = false;
    syncActiveDot();
  };

  const syncActiveDot = () => {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = track.firstChild ? track.firstChild.offsetWidth + 20 : 1;
    const index = Math.round(track.scrollLeft / cardWidth);
    setActiveDot(Math.min(dotCount - 1, index));
  };

  const goToDot = (index) => {
    const track = trackRef.current;
    if (!track || !track.firstChild) return;
    const cardWidth = track.firstChild.offsetWidth + 20;
    track.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    setActiveDot(index);
  };

  return (
    <section className="featured">
      <h2 className="featured__heading">Featured Titles</h2>

      <div
        className="featured__track"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onScroll={syncActiveDot}
      >
        {productions.map((p) => (
          <Link
            to={`/title/${p.slug}`}
            key={p.id}
            className="featured__card"
            style={{ background: p.posterGradient }}
            draggable={false}
          >
            <div className="featured__card-overlay">
              <span className="featured__card-type">{p.type}</span>
              <h3 className="featured__card-title">{p.title}</h3>
            </div>
          </Link>
        ))}
      </div>

      <div className="featured__dots">
        {Array.from({ length: dotCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            className={`featured__dot ${i === activeDot ? 'is-active' : ''}`}
            onClick={() => goToDot(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
