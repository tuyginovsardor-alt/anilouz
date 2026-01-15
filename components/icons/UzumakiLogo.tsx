import React from 'react';

export const UzumakiLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      {...props}
    >
      <rect width="100" height="100" rx="28" fill="#f97316" />
      {/* Swirl Effect */}
      <path 
        d="M50 20C33.4315 20 20 33.4315 20 50C20 66.5685 33.4315 80 50 80C66.5685 80 80 66.5685 80 50C80 33.4315 66.5685 20 50 20ZM50 70C38.9543 70 30 61.0457 30 50C30 38.9543 38.9543 30 50 30C61.0457 30 70 38.9543 70 50C70 61.0457 61.0457 70 50 70Z" 
        fill="white" 
        fillOpacity="0.2"
      />
      <path 
        d="M35 70L55 30M45 70L65 30" 
        stroke="white" 
        strokeWidth="12" 
        strokeLinecap="round" 
      />
    </svg>
  );
};