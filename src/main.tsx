/* Application entry point: the URL selects the landing course or the refreshable Home page. */
import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

// Import pages
import { LandingPage } from './Pages/Landing/landing_page.tsx'
import { HomePage } from './Pages/Home/Home.tsx'
import { ProjectsView } from './Pages/ProjectsView/projects_view.tsx'

// Query routes work on static hosting and survive a refresh.
function readPage(): 'landing' | 'home' | 'project' {
  const page = new URLSearchParams(window.location.search).get('page');
  return page === 'home' || page === 'project' ? page : 'landing';
}

// Import components
import { Confetti } from './Golf/components/confetti.tsx'
 
import './index.css';

/** Viewport pixels, matching the fixed-position confetti overlay. */
export type ConfettiOrigin = {
  x: number;
  y: number;
};

function App() {
  // A query parameter works on static hosts without server-side route rewrites.
  // Section anchors such as #home-projects can still be used independently.
  const [currentPage, setCurrentPage] = useState(readPage);

  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOrigin, setConfettiOrigin] =
    useState<ConfettiOrigin | null>(null);
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Keep React in sync with the address bar when using browser Back/Forward.
    const handleHistoryChange = () => {
      if (completionTimer.current !== null) clearTimeout(completionTimer.current);
      setShowConfetti(false);
      setCurrentPage(readPage());
    };
    window.addEventListener('popstate', handleHistoryChange);
    return () => {
      window.removeEventListener('popstate', handleHistoryChange);
      if (completionTimer.current !== null) clearTimeout(completionTimer.current);
    };
  }, []);

  // Physics calls this after the ball's sinking animation has finished.
  const handleLandingComplete = (origin: ConfettiOrigin | null) => {
    if (completionTimer.current !== null) clearTimeout(completionTimer.current);
    setConfettiOrigin(origin);
    setShowConfetti(true);

    // Keep the course mounted during the burst; this duration matches confetti-shoot in CSS.
    completionTimer.current = setTimeout(() => {
      const homeUrl = new URL(window.location.href);
      homeUrl.searchParams.set('page', 'home');
      homeUrl.hash = '';
      window.history.pushState(null, '', homeUrl);
      completionTimer.current = null;
      setShowConfetti(false);
      setCurrentPage('home');
    }, 1400);
  };

  return (
    <main className={`page page--${currentPage}`}>
      <Confetti
        show={showConfetti}
        origin={confettiOrigin}
        pieces={35}
      />

      {currentPage === 'landing' ? (
        <LandingPage onComplete={handleLandingComplete} />
      ) : currentPage === 'project' ? (
        <ProjectsView />
      ) : (
        <HomePage />
      )}
    </main>
  );
}

// index.html supplies the mount point. StrictMode checks component lifecycles in development.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
