import React from 'react';
import { Flame, Shield, Heart, Film } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-white/5 bg-[#0A0A0E] py-10 px-4 lg:px-6 text-gray-400 text-xs">
      <div className="max-w-[1800px] mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-orange-500/80 shadow-md bg-[#181820] flex-shrink-0">
                <img 
                  src="https://i.postimg.cc/1XYBLxjY/photo-2026-06-01-00-29-48.jpg" 
                  alt="ANILO.UZ Logo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = '/logo.jpg';
                  }}
                />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                ANILO<span className="text-orange-500 text-sm font-bold">.UZ</span>
              </span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              O'zbekistondagi eng yirik anime ko'rish va ma'lumotlar bazasi platformasi UI/UX. Yuqori HD va 4K formatdagi epizodlar.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Bo'limlar</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white cursor-pointer transition">Bosh sahifa</li>
                <li className="hover:text-white cursor-pointer transition">Mashhur animelar</li>
                <li className="hover:text-white cursor-pointer transition">Yangi chiqishlar</li>
                <li className="hover:text-white cursor-pointer transition">Ongoing epizodlar</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Janrlar</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white cursor-pointer transition">Aksiya va Jang</li>
                <li className="hover:text-white cursor-pointer transition">Sarguzasht</li>
                <li className="hover:text-white cursor-pointer transition">Fantastika (Isekai)</li>
                <li className="hover:text-white cursor-pointer transition">Maktab va Drama</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Xizmatlar</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-orange-400 cursor-pointer font-bold transition">ANILO VIP Premium</li>
                <li className="hover:text-white cursor-pointer transition">AI Maslahatchi</li>
                <li className="hover:text-white cursor-pointer transition">Mobile Ilova (APK)</li>
                <li className="hover:text-white cursor-pointer transition">Qoidalar va Maxfiylik</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-gray-400">
          <p>© 2026 ANILO.UZ — Barcha huquqlar himoyalangan.</p>
          <div className="flex items-center gap-1 text-gray-400">
            <span>O'zbekistonda</span>
            <Heart className="w-3.5 h-3.5 text-orange-500 fill-orange-500 inline mx-0.5" />
            <span>bilan tayyorlandi</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
