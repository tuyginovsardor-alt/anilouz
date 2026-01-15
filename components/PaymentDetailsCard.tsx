
import React, { useState, useRef, useEffect } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { getAppConfig } from '../services/dbService';

// Kontaktsiz to'lov belgisi (Wifi ga o'xshash)
const ContactlessIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 sm:w-8 sm:h-8 text-white/50" stroke="currentColor" strokeWidth="2">
        <path d="M8.5 10a4 4 0 0 1 7 0" strokeLinecap="round" />
        <path d="M6 8.5a7 7 0 0 1 12 0" strokeLinecap="round" />
        <path d="M3.5 7a10 10 0 0 1 17 0" strokeLinecap="round" />
    </svg>
);

export const PaymentDetailsCard: React.FC = () => {
    const [cardNumber, setCardNumber] = useState('8600 .... .... ....');
    const [cardHolder, setCardHolder] = useState('Yuklanmoqda...');
    const [copied, setCopied] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties & { [key: string]: string | number | undefined }>({});

    useEffect(() => {
        const loadCardInfo = async () => {
            try {
                const config = await getAppConfig();
                if (config['card_number']) setCardNumber(config['card_number']);
                if (config['card_holder']) setCardHolder(config['card_holder']);
            } catch (e) { console.error(e); }
        };
        loadCardInfo();
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = (y / rect.height - 0.5) * -20;
        const rotateY = (x / rect.width - 0.5) * 20;

        setStyle({
            '--mouse-x': `${x}px`,
            '--mouse-y': `${y}px`,
            transform: `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
        });
    };

    const handleMouseLeave = () => {
        setIsFlipped(false); 
        setStyle({
            transform: 'perspective(1500px) rotateX(0) rotateY(0) scale3d(1, 1, 1)',
            transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
        });
    };

    const handleCardClick = () => {
        setIsFlipped(prev => !prev);
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div 
            onClick={handleCardClick}
            className="w-full max-w-[22rem] sm:max-w-sm mx-auto aspect-[1.586/1] cursor-pointer group touch-manipulation"
            style={{ perspective: '1500px' }}
        >
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={style}
                className="relative w-full h-full transition-transform duration-700 ease-in-out"
            >
                <div 
                    className={`relative w-full h-full transition-transform duration-700 ease-in-out`}
                    style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                    {/* --- FRONT OF CARD --- */}
                    <div 
                        className="absolute w-full h-full rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-white/10" 
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    >
                         {/* Background Texture & Gradient */}
                         <div className="absolute inset-0 bg-[#1a1a1a]"></div>
                         <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#2d3748] to-black"></div>
                         
                         {/* Abstract Gold Glows */}
                         <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
                         <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
                         
                         {/* Carbon Fiber Pattern Overlay */}
                         <div className="absolute inset-0 opacity-10" 
                              style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '16px 16px' }}>
                         </div>
                        
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                                background: `radial-gradient(circle 350px at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(255, 165, 0, 0.15), transparent 80%)`,
                            }}
                        ></div>

                        <div className="relative z-10 p-4 sm:p-6 h-full flex flex-col justify-between text-white font-mono">
                            {/* Header: Brand & Contactless */}
                            <div className="flex justify-between items-start">
                                <span 
                                    className="text-xl sm:text-3xl font-bold tracking-wider animate-pulsate-glow" 
                                    style={{ 
                                        fontFamily: "'Metal Mania', cursive",
                                        background: 'linear-gradient(to right, #fcd34d, #f97316, #ef4444)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))'
                                    }}
                                >
                                    ANILO.UZ
                                </span>
                                <div className="rotate-90 opacity-80">
                                    <ContactlessIcon />
                                </div>
                            </div>

                            {/* Chip & Tagline */}
                            <div className="flex justify-between items-center mt-2">
                                {/* Realistic Chip Design */}
                                <div className="w-10 h-8 sm:w-12 sm:h-9 bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-700 rounded-md relative overflow-hidden shadow-md border border-yellow-600/50">
                                    <div className="absolute inset-0 border-[0.5px] border-black/20 rounded-md"></div>
                                    {/* Chip lines */}
                                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/30"></div>
                                    <div className="absolute top-0 left-1/2 h-full w-[1px] bg-black/30"></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-3 border border-black/30 rounded-[2px]"></div>
                                </div>
                                <span className="text-[7px] sm:text-[9px] text-gray-400 font-sans tracking-[0.2em] uppercase border-b border-orange-500/30 pb-0.5">Premium Member</span>
                            </div>

                            {/* Card Number */}
                            <div className="my-auto mt-4 sm:mt-6">
                                <div className="flex items-center justify-between gap-2">
                                    <span 
                                        className="text-base sm:text-xl md:text-2xl tracking-widest whitespace-nowrap text-gray-200 font-bold" 
                                        style={{ 
                                            fontFamily: "'Share Tech Mono', monospace",
                                            textShadow: '1px 1px 2px rgba(0,0,0,0.9)' 
                                        }}
                                    >
                                        {cardNumber}
                                    </span>
                                    <button onClick={handleCopy} className="p-1 text-gray-400 hover:text-orange-400 transition-colors flex-shrink-0" title="Nusxalash">
                                        {copied ? 
                                            <span className="text-[10px] sm:text-xs font-sans animate-fade-in text-green-400">Ok!</span> : 
                                            <CopyIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Footer: Holder & Valid Thru & Mastercard */}
                            <div className="flex justify-between items-end mt-2 sm:mt-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[6px] sm:text-[8px] text-gray-400 uppercase">Valid Thru</span>
                                        <span className="text-xs sm:text-sm font-bold tracking-wider text-gray-200">12/30</span>
                                    </div>
                                    <p className="font-bold tracking-wider text-xs sm:text-base uppercase text-gray-300 drop-shadow-md truncate max-w-[150px] sm:max-w-[200px]">
                                        {cardHolder}
                                    </p>
                                </div>
                                
                                {/* Mastercard Style Logo */}
                                <div className="flex flex-col items-end">
                                    <div className="flex -space-x-3 opacity-90">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-600/90 backdrop-blur-sm shadow-lg"></div>
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-yellow-500/90 backdrop-blur-sm shadow-lg"></div>
                                    </div>
                                    <span className="text-[6px] sm:text-[8px] font-bold text-white/60 italic mt-1 pr-1">Mastercard</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- BACK OF CARD --- */}
                    <div 
                        className="absolute w-full h-full rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between border border-white/10" 
                        style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', backgroundColor: '#1a1a1a' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#2d3748] via-[#1a202c] to-black"></div>
                        
                        {/* Magnetic Strip */}
                        <div>
                            <div className="absolute top-4 sm:top-6 left-0 right-0 h-8 sm:h-10 bg-black border-y border-gray-800"></div>
                        </div>

                        <div className="relative mt-16 sm:mt-20 px-2">
                            <div className="flex gap-2 items-center">
                                <div className="bg-gray-300 w-[70%] h-7 sm:h-9 flex items-center justify-end p-2 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-90 rounded-sm">
                                    <p className="text-gray-600 text-[8px] transform -rotate-1 mr-2 font-handwriting">Authorized Signature</p>
                                </div>
                                <div className="bg-white text-black font-mono w-[30%] h-7 sm:h-9 flex items-center justify-center font-bold text-sm sm:text-base border-2 border-red-500 rounded-sm transform -rotate-1 shadow-sm">
                                    123
                                </div>
                            </div>
                            <p className="text-right text-[8px] sm:text-[10px] text-gray-400 mt-1 mr-2">CVV/CVC</p>
                        </div>
                        
                        <div className="relative text-center">
                            <div className="flex justify-center gap-4 mb-2 opacity-30 grayscale">
                                 <div className="w-8 h-5 bg-white rounded"></div>
                                 <div className="w-8 h-5 bg-white rounded"></div>
                            </div>
                            <p className="text-gray-500 text-[6px] sm:text-[8px] mt-auto leading-tight px-4">
                                Ushbu karta Anilo.uz platformasi hisobini to'ldirish uchun mo'ljallangan.
                                To'lovni amalga oshirgandan so'ng chekni saqlab qo'ying.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
