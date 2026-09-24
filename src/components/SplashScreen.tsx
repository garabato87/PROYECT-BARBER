import React, { useEffect, useState } from 'react';
import BrandLogo from './ui/BrandLogo';
import { useTheme } from '../hooks/useTheme';
import './SplashScreen.css';

interface SplashScreenProps {
  finishLoading: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ finishLoading }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  useTheme(); // Initialize theme on mount without declaring unused variable

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
        <BrandLogo type="icon" className="h-24 w-24 mb-6 mx-auto animate-pulse" />
        <BrandLogo type="full" className="h-10 mx-auto" />
      </div>
    </div>
  );
};

export default SplashScreen;
