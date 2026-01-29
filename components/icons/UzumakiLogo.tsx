import React from 'react';

export const UzumakiLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      {...props}
    >
      {/* Background: Orange */}
      <rect width="100" height="100" rx="22" fill="#f97316" />
      
      {/* Outer black ring */}
      <circle cx="50" cy="50" r="38" fill="black" />
      
      {/* Main red circle */}
      <circle cx="50" cy="50" r="34" fill="#be123c" />
      
      {/* Uzumaki Spiral (hand-drawn style) */}
      <path 
        d="M50 50C50 50 56 46 56 40C56 32 48 28 40 32C30 37 28 50 35 60C43 72 62 70 72 55C82 35 70 15 45 15C15 15 5 45 15 65C25 85 55 90 75 75" 
        stroke="black" 
        strokeWidth="5" 
        strokeLinecap="round" 
        style={{ opacity: 0.8 }}
      />
      <path 
        d="M50 50C50 50 54 48 54 43C54 36 48 33 42 35C35 38 33 47 38 55C43 64 58 63 65 52C72 38 65 24 50 24C32 24 25 42 32 55" 
        stroke="black" 
        strokeWidth="3.5" 
        strokeLinecap="round"
      />
    </svg>
  );
};