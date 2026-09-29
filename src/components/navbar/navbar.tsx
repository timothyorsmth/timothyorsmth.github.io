import type { Ref } from 'react';
import { GolfLink } from '../../Golf/GolfLink';
import './navbar.css';

interface NavBarProps {
  home?: boolean;
  playable?: boolean;
  contactHref?: string;
  headerRef?: Ref<HTMLElement>;
}

/** Shared navigation; golf links are enabled only inside a GolfProvider. */
export function NavBar({ home = false, playable = false, contactHref, headerRef }: NavBarProps) {
  const Link = playable ? GolfLink : 'a';
  const aboutHref = home ? '#home-about' : '?page=home#home-about';
  const projectsHref = home ? '#home-projects' : '?page=home#home-projects';

  return (
    <header className="navbar" ref={headerRef}>
      <Link className="navbar-brand" href={aboutHref} aria-label="Timothy, back to about me">timothy :)</Link>
      <nav className="navbar-links" aria-label="Main navigation">
        <Link href={aboutHref}>about me :)</Link>
        <Link href={projectsHref}>project list</Link>
        {contactHref ? <Link href={contactHref}>contact me!</Link> : (
          <button type="button" disabled title="Contact page coming soon">contact me!</button>
        )}
      </nav>
    </header>
  );
}
