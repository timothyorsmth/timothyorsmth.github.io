import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'

// Import pages
import { LandingPage } from './Pages/Landing/landing_page.tsx'
import { HomePage } from './Pages/Home/Home.tsx'

// Import components
import { Confetti } from './Golf/components/confetti.tsx'
 
import './index.css';

export type ConfettiOrigin = {
  x: number;
  y: number;
};

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'home'>(
    'landing'
  );

  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOrigin, setConfettiOrigin] =
    useState<ConfettiOrigin | null>(null);

  const handleLandingComplete = (origin: ConfettiOrigin | null) => {
    setConfettiOrigin(origin);
    setShowConfetti(true);

    setTimeout(() => {
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
      ) : (
        <HomePage />
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);