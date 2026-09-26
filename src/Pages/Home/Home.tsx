/* Home/level-select page: a vertical introduction followed by a horizontal project gallery. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GolfProvider } from '../../Golf/GolfContext';
import { GolfBall } from '../../Golf/Golfball';
import { GolfLink } from '../../Golf/GolfLink';
import { projects as projectList, projectAssetUrl, projectViewUrl } from '../../data/projects';
import type { Project } from '../../data/projects';
import './Home.css';
import portraitUrl from '../../assets/pic_of_me.png';
import { Obstacle } from '../../Golf/Obstacle';

/** The same metadata drives the gallery and the project detail page. */
export type HomeProject = Project;

interface HomePageProps {
  projects?: HomeProject[];
  contactHref?: string;
}

function ProjectCard({ project }: { project: HomeProject }) {
  const title = project.title || 'PROJECT NAME';
  const tags = project.tags ?? ['NO TAG'];
  const content = (
    <>
      <div className="home-project-image"
        style={project.image ? { backgroundImage: `url(${JSON.stringify(projectAssetUrl(project.image))})` } : undefined}>
        <h3>{title}</h3>
      </div>
      <ul className="home-project-tags" aria-label="Project categories">
        {tags.map((tag, tagIndex) => <li key={`${tag}-${tagIndex}`}>{tag}</li>)}
      </ul>
    </>
  );

  return (
    <li className="home-project-slot">
      {/* Cards bounce the ball; pointer and keyboard activation open their detail page. */}
      <Obstacle type="wall">
        <a className="home-project-card" href={projectViewUrl(project.id)}>{content}</a>
      </Obstacle>
    </li>
  );
}

export function HomePage({ projects, contactHref }: HomePageProps = {}) {
  // Edit the JSON to add projects; an explicit empty prop still renders an empty gallery.
  const displayedProjects = projects ?? projectList;
  const headerRef = useRef<HTMLElement>(null);
  const projectsRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLUListElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const [visibleProjects, setVisibleProjects] = useState({ first: 0, last: 0 });

  // The landing course finishes near the bottom of the document; start Home at its About section.
  useLayoutEffect(() => {
    // Returning from a project respects the gallery anchor; landing starts at About.
    if (window.location.hash === '#home-projects') projectsRef.current?.scrollIntoView();
    else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const gallery = galleryRef.current;
    const section = projectsRef.current;
    if (!gallery || !section) return;

    const updateControls = () => {
      const maxScroll = gallery.scrollWidth - gallery.clientWidth;
      setCanScrollBack(gallery.scrollLeft > 1);
      setCanScrollForward(gallery.scrollLeft < maxScroll - 1);
      const viewport = gallery.getBoundingClientRect();
      const visible = Array.from(gallery.children).flatMap((card, index) => {
        const rect = card.getBoundingClientRect();
        return rect.right > viewport.left + 1 && rect.left < viewport.right - 1 ? [index + 1] : [];
      });
      const first = visible[0] ?? 0;
      const last = visible.at(-1) ?? 0;
      setVisibleProjects(previous => previous.first === first && previous.last === last ? previous : { first, last });
    };

    const handleWheel = (event: WheelEvent) => {
      // Leave pinch-to-zoom and scrolling through About to the browser.
      if (event.ctrlKey) return;
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      if (section.getBoundingClientRect().top > headerHeight + 1) return;

      const rawDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const delta = rawDelta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? gallery.clientWidth : 1);
      const maxScroll = gallery.scrollWidth - gallery.clientWidth;
      const canMove = delta < 0 ? gallery.scrollLeft > 1 : gallery.scrollLeft < maxScroll - 1;
      // At either end, release vertical scrolling so the user can return to About normally.
      if (!canMove || delta === 0) return;
      event.preventDefault();
      gallery.scrollLeft += delta;
    };

    // A non-passive native listener is needed to consume wheel events only inside this section.
    section.addEventListener('wheel', handleWheel, { passive: false });
    gallery.addEventListener('scroll', updateControls, { passive: true });
    const observer = new ResizeObserver(updateControls);
    observer.observe(gallery);
    for (const card of gallery.children) observer.observe(card);
    updateControls();

    return () => {
      section.removeEventListener('wheel', handleWheel);
      gallery.removeEventListener('scroll', updateControls);
      observer.disconnect();
    };
  }, [displayedProjects]);

  return (
    <GolfProvider className="golfPlayablePage home-page" startPoint={{ x: 0.76, y: 0.12 }} followScroll persistenceKey="portfolio-home-course"
      horizontalScrollRef={galleryRef} horizontalAreaRef={projectsRef}>
      <header className="home-header" ref={headerRef}>
        <GolfLink className="home-brand" href="#home-about" aria-label="Timothy, back to about me">timothy :)</GolfLink>
        <nav className="home-nav" aria-label="Home navigation">
          <GolfLink href="#home-about">about me :)</GolfLink>
          {contactHref ? <GolfLink href={contactHref}>contact me!</GolfLink> : (
            <button type="button" disabled title="Contact page coming soon">contact me!</button>
          )}
          <GolfLink href="#home-projects">more levels?</GolfLink>
        </nav>
      </header>

      <section className="home-about" id="home-about">
        <Obstacle type="wall" className="homeTitle">
            <h1 id="home-about-title">about me!</h1>
        </Obstacle>
        
        <div className="home-about-content">
          <div className="home-portrait">
            <img src={portraitUrl} alt="Timothy Luk" />
          </div>
          <div className="home-bio">
            <p>Hello!<br />I’m Timothy Luk, a year 1 computer science student based in Singapore.</p>
            <p>My passions lie in software engineering, front-end development and game development.</p>
            <p>In my free time, I like to go to the cinema to watch movies and go bar hopping :)</p>
          </div>
        </div>
      </section>

      <section className="home-projects" id="home-projects" ref={projectsRef} aria-labelledby="home-projects-title">
        <div className="home-project-viewport" data-can-go-back={canScrollBack} data-can-go-forward={canScrollForward}>
        <ul
          id="home-project-gallery"
          className="home-project-gallery"
          ref={galleryRef}
          tabIndex={0}
          aria-label="Projects, scroll horizontally to explore"
          aria-describedby="home-projects-hint"
        >
          {displayedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </ul>
        </div>
        {displayedProjects.length === 0 && <p className="home-projects-empty">More projects coming soon.</p>}
        <div className="home-projects-footer">
          <div>
            <h2 id="home-projects-title">my projects!</h2>
            <p id="home-projects-hint">Scroll or swipe sideways · putt sideways to explore</p>
          </div>
          <div className="home-project-position">
            <label htmlFor="home-project-position">explore projects <span>{visibleProjects.first}–{visibleProjects.last} / {displayedProjects.length}</span></label>
            
          </div>
        </div>
      </section>

      {/* This course is free play: there are no holes or completion callbacks. */}
      <GolfBall />
    </GolfProvider>
  );
}
