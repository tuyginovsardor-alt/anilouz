import React, { useState, useEffect } from 'react';

export const UzumakiLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Create unique IDs for SVG elements to prevent conflicts when multiple instances are rendered.
  const [uniqueIds] = useState(() => {
    const randomSuffix = Math.random().toString(36).substring(7);
    return {
      gradId: `grad1-${randomSuffix}`,
      glowId: `glow-${randomSuffix}`,
    };
  });

  useEffect(() => {
    // This effect runs only on the client after mounting
    setIsMounted(true);
    const savedLogo = localStorage.getItem('custom-logo');
    if (savedLogo) {
      setCustomLogo(savedLogo);
    }
    
    const handleLogoUpdate = () => {
        const updatedLogo = localStorage.getItem('custom-logo');
        setCustomLogo(updatedLogo);
    };
    
    document.addEventListener('logoUpdated', handleLogoUpdate);
    window.addEventListener('storage', handleLogoUpdate); // For changes in other tabs

    return () => {
      document.removeEventListener('logoUpdated', handleLogoUpdate);
      window.removeEventListener('storage', handleLogoUpdate);
    };
  }, []);

  if (isMounted && customLogo) {
    return (
        <img 
            src={customLogo} 
            alt="Custom user logo" 
            className="w-10 h-10 object-cover rounded-full"
            style={{ width: '40px', height: '40px' }}
        />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      {...props}
      className={`animate-spin-slow ${props.className || ''}`}
    >
      <defs>
        <linearGradient id={uniqueIds.gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
        </linearGradient>
        <filter id={uniqueIds.glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
      </defs>
      <path
        d="M50,10 A40,40 0 1 1 10,50"
        fill="none"
        stroke={`url(#${uniqueIds.gradId})`}
        strokeWidth="8"
        strokeLinecap="round"
        style={{ filter: `url(#${uniqueIds.glowId})`}}
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="4s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d="M50,90 A40,40 0 1 1 90,50"
        fill="none"
        stroke={`url(#${uniqueIds.gradId})`}
        strokeWidth="8"
        strokeLinecap="round"
        style={{ filter: `url(#${uniqueIds.glowId})`}}
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="-360 50 50"
          dur="6s"
          repeatCount="indefinite"
        />
      </path>
       <circle cx="50" cy="50" r="10" fill={`url(#${uniqueIds.gradId})`} style={{ filter: `url(#${uniqueIds.glowId})`}} />
    </svg>
  );
};