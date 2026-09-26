import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { GolfProvider } from '../../Golf/GolfContext';
import { GolfBall } from '../../Golf/Golfball';
import { GolfLink } from '../../Golf/GolfLink';
import { Obstacle } from '../../Golf/Obstacle';
import { projects, projectAssetUrl } from '../../data/projects';
import { splitChunks, makeWater } from './projectCourse';
import { WindZone } from './WindZone';
import { sampleCourseWind } from './sampleCourseWind';
import './projects_view.css';

const PROJECTS_URL = '?page=home#home-projects';
const COLORED_TEXT_LINK = /^#color-(green|red|blue|purple|gold)$/;
const SPAWN_TOP = 160;

type ProjectDetails = {
  title: string;
  tags: string[];
};

type CourseProps = ProjectDetails & {
  content: string;
  url: string;
};

type ProjectContentProps = ProjectDetails & {
  path: string;
};

/** Render author-written Markdown; asset paths are relative to its source file. */
function MarkdownChunk({ content, url }: { content: string; url: string }) {
  const resolveUrl = (value: string) => {
    if (value.startsWith('#')) return value;
    return new URL(value, new URL(url, window.location.href)).href;
  };

  return (
    <Markdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[[rehypeKatex, { trust: false }]]}
      components={{
        img: ({ src, alt }) => (
          <img
            src={typeof src === 'string' ? resolveUrl(src) : undefined}
            alt={alt ?? ''}
          />
        ),
        a: ({ href, children }) => {
          // Reserved color links become styled text rather than navigation.
          const color = COLORED_TEXT_LINK.exec(href ?? '')?.[1];
          if (color) return <span className={`text-${color}`}>{children}</span>;
          return <a href={href ? resolveUrl(href) : undefined}>{children}</a>;
        },
      }}
    >
      {content}
    </Markdown>
  );
}

function Course({ content, url, title, tags }: CourseProps) {
  const chunks = splitChunks(content);
  // Generate once per loaded course so putting and resizing never reroll ponds.
  const [water] = useState(() => makeWater(chunks.length));
  const [height, setHeight] = useState(0);
  const layout = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = layout.current;
    if (!element) return;

    // Images and equations can change the document height after the first render.
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <GolfProvider
      className="golfPlayablePage project-view"
      // GolfProvider expects fractions; keep the tee 160px from the course top.
      startPoint={{ x: 0.87, y: height ? SPAWN_TOP / height : 0.1 }}
      onHole={() => window.location.assign(PROJECTS_URL)}
      sampleWind={(position, time) => sampleCourseWind(layout.current, position, time)}
      followScroll
    >
      <div ref={layout}>
        <nav className="project-view-nav" aria-label="Project navigation">
          <GolfLink href={PROJECTS_URL}>← all projects</GolfLink>
        </nav>

        <article className="project-course" aria-label={title}>
          <header className="project-course-intro">
            <span>{title}</span>
            <span>{tags.join(' · ')}</span>
          </header>
          <p className="project-course-help">
            Drag the ball to putt. Bounce off the cards; water returns you to the start.
            {' '}Passing breezes gently drift the ball; hold it to aim.
          </p>

          {chunks.length ? chunks.map((chunk, index) => (
            <div
              className={`project-course-row ${index % 2 ? 'project-course-row-right' : ''}`}
              key={index}
            >
              {index % 2 === 0 && <WindZone direction={index % 4 === 0 ? 1 : -1} />}
              {/* CSS anchors this pond to the empty page edge opposite the card. */}
              <Obstacle
                type="reset"
                className="project-water project-water-opposite"
                aria-hidden="true"
                style={{ top: `${water[index].oppositeTop}%` }}
              />
              {water[index].ponds.map((pond, pondIndex) => (
                <Obstacle
                  key={pondIndex}
                  type="reset"
                  className={`project-water project-water-${pond.side}`}
                  aria-hidden="true"
                  style={{ width: pond.width, top: `${pond.top}%` }}
                />
              ))}

              {/* Paint cards over the attached ends of the reset ponds. */}
              <Obstacle type="wall" className="project-markdown project-chunk">
                <MarkdownChunk content={chunk} url={url} />
              </Obstacle>
            </div>
          )) : <p>Project details coming soon.</p>}

          <footer className="project-course-finish">
            <Obstacle
              type="hole"
              className="project-course-hole"
              aria-label="Golf hole: return to all projects"
            />
            <a href={PROJECTS_URL}>Putt here to return to all projects</a>
          </footer>
        </article>
      </div>

      {/* Wait for measured geometry before the physics engine places the ball. */}
      {height > 0 && <GolfBall />}
    </GolfProvider>
  );
}

/** Load the selected file before mounting its playable course. */
function ProjectContent({ path, title, tags }: ProjectContentProps) {
  const [content, setContent] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const url = projectAssetUrl(path);

  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then(response => {
        // Some hosts return the app's HTML fallback for a missing Markdown file.
        const isHtml = response.headers.get('content-type')?.includes('text/html');
        if (!response.ok || isHtml) throw new Error('Markdown unavailable');
        return response.text();
      })
      .then(setContent)
      .catch(error => {
        if (error.name !== 'AbortError') setFailed(true);
      });

    // Cancel requests when navigating away, including development remounts.
    return () => controller.abort();
  }, [url]);

  if (failed) {
    return <ProjectMessage message="Project details could not be loaded. Please try refreshing." />;
  }
  if (content === null) {
    return <ProjectMessage message="Loading project details…" />;
  }
  return <Course content={content} url={url} title={title} tags={tags} />;
}

/** Loading and error states retain a normal link back to the project gallery. */
function ProjectMessage({ message }: { message: string }) {
  return (
    <div className="golfPlayablePage project-view">
      <nav className="project-view-nav">
        <a href={PROJECTS_URL}>← all projects</a>
      </nav>
      <p className="project-message" role="status">{message}</p>
    </div>
  );
}

export function ProjectsView() {
  const id = new URLSearchParams(window.location.search).get('project');
  const project = projects.find(item => item.id === id);

  if (!project) return <ProjectMessage message="Project not found." />;

  return (
    <ProjectContent
      key={project.markdown}
      path={project.markdown}
      title={project.title}
      tags={project.tags}
    />
  );
}
