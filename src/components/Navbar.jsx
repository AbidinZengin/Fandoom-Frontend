import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FandoomLogo } from './FandoomLogo';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Series', to: '/series' },
  { label: 'Movies', to: '/movies' },
  {
    label: 'Community',
    to: '/community',
    dropdown: [
      { label: 'Theories', to: '/community/theories' },
      { label: 'Discussion', to: '/community/discussion' },
      { label: 'Episode Reactions', to: '/community/reactions' },
    ],
  },
  { label: 'Blog / News', to: '/blog' },
  {
    label: 'More',
    dropdown: [
      { label: 'Coming Soon', to: '/coming-soon' },
      { label: 'Shop', to: '/shop' },
    ],
  },
];

export function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(null);

  return (
    <header className="navbar">
      <Link to="/" className="navbar__logo" aria-label="Fandoom home">
        <FandoomLogo showTagline={false} scale={0.16} />
      </Link>

      <nav className="navbar__links">
        {NAV_LINKS.map((item) => (
          <div
            key={item.label}
            className="navbar__item"
            onMouseEnter={() => item.dropdown && setOpenDropdown(item.label)}
            onMouseLeave={() => item.dropdown && setOpenDropdown(null)}
          >
            {item.to ? (
              <Link to={item.to} className="navbar__link">
                {item.label}
              </Link>
            ) : (
              <span className="navbar__link">{item.label}</span>
            )}

            {item.dropdown && openDropdown === item.label && (
              <div className="navbar__dropdown">
                {item.dropdown.map((sub) => (
                  <Link key={sub.label} to={sub.to} className="navbar__dropdown-link">
                    {sub.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="navbar__actions">
        <input className="navbar__search" type="search" placeholder="Search titles, theories..." />
        <Link to="/account" className="navbar__icon" aria-label="Account">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="8" r="3.4" />
            <path d="M4.5 19.5c1.6-3.3 4.4-5 7.5-5s5.9 1.7 7.5 5" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
