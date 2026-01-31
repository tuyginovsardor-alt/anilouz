
import React from 'react';

export const UzumakiLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      {...props}
    >
      {/* Asosiy to'q sariq fon */}
      <rect width="100" height="100" rx="22" fill="#f97316" />
      
      {/* Qora hoshiyali qizil aylana */}
      <circle cx="50" cy="50" r="35" fill="#000000" />
      <circle cx="50" cy="50" r="32" fill="#be123c" />
      
      {/* Uzumaki Spiral - Rasmga mos qo'lda chizilgan uslubda */}
      <path 
        d="M50 50C50 46 47 46 47 50C47 55 53 55 53 50C53 42 43 42 43 50C43 59 58 59 58 50C58 38 38 38 38 50C38 64 64 64 64 50C64 34 34 34 34 50C34 68 68 68 68 50C68 45 66 41 63 38" 
        stroke="#000000" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};
