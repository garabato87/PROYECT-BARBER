/* eslint-disable */
import { useEffect, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BrandLogoVariant = 'light' | 'dark' | 'auto';
export type BrandLogoType = 'full' | 'icon';

interface BrandLogoProps {
  className?: string;
  variant?: BrandLogoVariant;
  type?: BrandLogoType;
  alt?: string;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function BrandLogo({ 
  className, 
  variant = 'auto', 
  type = 'full',
  alt = 'VANITY'
}: BrandLogoProps) {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    if (variant !== 'auto') return;

    // Determine current theme for 'auto' variant
    const checkTheme = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || 
                    (!document.documentElement.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setCurrentTheme(isDark ? 'dark' : 'light');
    };

    checkTheme();
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          checkTheme();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, [variant]);

  const activeVariant = variant === 'auto' ? currentTheme : variant;
  
  const src = type === 'icon' 
    ? (activeVariant === 'dark' ? '/brand/icon-white.png' : '/brand/icon-black.png')
    : (activeVariant === 'dark' ? '/brand/logo-white.png' : '/brand/logo-black.png');

  return (
    <img 
      src={src} 
      alt={alt} 
      className={cn(type === 'icon' ? 'h-8 w-8 object-contain' : 'h-8 w-auto object-contain', className)} 
    />
  );
}
