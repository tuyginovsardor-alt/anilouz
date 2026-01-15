import React from 'react';

export const UzumakiLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      {...props}
    >
      <rect width="100" height="100" rx="20" fill="#e11d48" />
      <path 
        d="M30 75L55 25M45 75L70 25" 
        stroke="white" 
        strokeWidth="12" 
        strokeLinecap="round" 
      />
    </svg>
  );
};