import { Link } from 'react-router-dom';
import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <span className="footer__wordmark">FANDOOM</span>
          <p className="footer__tagline">Theories. News. Blogs. Built for fans.</p>
        </div>

        <div className="footer__col">
          <h4>Explore</h4>
          <Link to="/series">Series</Link>
          <Link to="/movies">Movies</Link>
          <Link to="/community">Community</Link>
          <Link to="/blog">Blog / News</Link>
        </div>

        <div className="footer__col">
          <h4>More</h4>
          <Link to="/coming-soon">Coming Soon</Link>
          <Link to="/shop">Shop</Link>
        </div>

        <div className="footer__col">
          <h4>Follow</h4>
          <a href="#" rel="noreferrer">Instagram</a>
          <a href="#" rel="noreferrer">X / Twitter</a>
          <a href="#" rel="noreferrer">TikTok</a>
        </div>
      </div>

      <div className="footer__bottom">
        <p>&copy; {new Date().getFullYear()} Fandoom. All rights reserved.</p>
        <p className="footer__partnership">Partnerships &amp; sponsorships: partners@fandoom.tv</p>
      </div>
    </footer>
  );
}
