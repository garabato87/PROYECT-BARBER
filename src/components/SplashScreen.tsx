import React, { useEffect, useState } from 'react';
import { Scissors } from 'lucide-react';
import './SplashScreen.css';

interface SplashScreenProps {
  finishLoading: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ finishLoading }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Keep the splash screen for 2 seconds, then start fade out
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      // Wait for the fade out animation (0.6s) to finish before unmounting
      setTimeout(() => {
        finishLoading();
      }, 600);
    }, 2000);

    return () => clearTimeout(timer);
  }, [finishLoading]);

  return (
    <div className={`splash-screen ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="logo-wrapper">
          <Scissors size={64} strokeWidth={1.5} className="splash-icon" />
          <div className="glow-effect"></div>
        </div>
        <h1 className="splash-title">SDGP</h1>
        <p className="splash-subtitle">Sistema de Gestión Premium</p>
      </div>
    </div>
  );
};

export default SplashScreen;
