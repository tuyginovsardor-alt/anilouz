
import React from 'react';
import { X } from 'lucide-react';
import { LegalDocType } from '../types';

interface LegalDocsProps {
  type: LegalDocType;
  onClose: () => void;
}

const Seal: React.FC = () => (
    <div className="relative w-32 h-32 mx-auto mt-10 opacity-80 select-none pointer-events-none">
        <div className="absolute inset-0 border-4 border-blue-900 rounded-full flex items-center justify-center">
             <div className="absolute inset-2 border border-blue-900 rounded-full"></div>
             <div className="text-blue-900 text-[10px] font-bold absolute top-2 left-1/2 -translate-x-1/2 tracking-widest">
                 O'ZBEKISTON RESPUBLIKASI
             </div>
             <div className="text-blue-900 font-black text-lg text-center rotate-[-10deg]">
                 ANILO.UZ<br/>
                 <span className="text-xs font-normal">PLATFORMASI</span>
             </div>
             <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-blue-900 text-[8px] font-bold uppercase tracking-widest">
                 TASDIQLANGAN
             </div>
        </div>
    </div>
);

const PrivacyContent = () => (
    <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
        <h3 className="text-center font-bold text-lg mb-6 uppercase border-b pb-2">Maxfiylik Siyosati va Ma'lumotlarni Qayta Ishlash</h3>
        
        <p><strong>1. UMUMIY QOIDALAR</strong></p>
        <p>1.1. Ushbu Maxfiylik siyosati (keyingi o'rinlarda - "Siyosat") "Anilo.uz" (keyingi o'rinlarda - "Platforma") foydalanuvchilarining shaxsiy ma'lumotlarini yig'ish, saqlash, qayta ishlash va himoya qilish tartibini belgilaydi.</p>
        <p>1.2. Foydalanuvchi Platformada ro'yxatdan o'tish orqali ushbu Siyosat shartlariga so'zsiz rozilik bildiradi.</p>
        
        <p><strong>2. YIG'ILADIGAN MA'LUMOTLAR</strong></p>
        <p>2.1. Platforma quyidagi shaxsiy ma'lumotlarni yig'ishi mumkin:</p>
        <ul className="list-disc pl-5">
            <li>Foydalanuvchining Ismi va Familiyasi;</li>
            <li>Elektron pochta manzili (Email);</li>
            <li>Telefon raqami;</li>
            <li>IP manzil va qurilma ma'lumotlari (cookie-fayllar orqali).</li>
        </ul>
        <p>2.2. To'lov ma'lumotlari (karta raqamlari) Platforma serverlarida saqlanmaydi, ular faqat to'lov tizimlari (Payme, Click) orqali himoyalangan holda qayta ishlanadi.</p>

        <p><strong>3. MA'LUMOTLARDAN FOYDALANISH MAQSADLARI</strong></p>
        <p>3.1. Yig'ilgan ma'lumotlar quyidagi maqsadlarda ishlatiladi:</p>
        <ul className="list-disc pl-5">
            <li>Foydalanuvchiga xizmat ko'rsatish va shaxsiy kabinetga kirishni ta'minlash;</li>
            <li>Texnik yordam ko'rsatish;</li>
            <li>Platforma yangiliklari va aksiyalari haqida xabar berish (Foydalanuvchi roziligi bilan);</li>
            <li>Xavfsizlikni ta'minlash va firibgarlikning oldini olish.</li>
        </ul>

        <p><strong>4. MA'LUMOTLARNI UCHINCHI TOMONLARGA BERISH</strong></p>
        <p>4.1. Platforma foydalanuvchining shaxsiy ma'lumotlarini uchinchi shaxslarga bermaydi, bundan O'zbekiston Respublikasi qonunchiligida belgilangan holatlar mustasno.</p>
        <p>4.2. Anonimlashtirilgan statistika (shaxsni aniqlash imkonini bermaydigan holda) reklama hamkorlariga taqdim etilishi mumkin.</p>

        <p><strong>5. O'ZGARTIRISHLAR KIRITISH</strong></p>
        <p>5.1. Ma'muriyat ushbu Siyosatga istalgan vaqtda o'zgartirish kiritish huquqiga ega. Yangi tahrir e'lon qilingan paytdan boshlab kuchga kiradi.</p>
        
        <Seal />
    </div>
);

const SecurityContent = () => (
    <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
        <h3 className="text-center font-bold text-lg mb-6 uppercase border-b pb-2">Xavfsizlik Qoidalari</h3>
        
        <p><strong>1. HISOB XAVFSIZLIGI</strong></p>
        <p>1.1. Foydalanuvchi o'zining login va parolini uchinchi shaxslarga bermaslik majburiyatini oladi.</p>
        <p>1.2. Parol kamida 6 ta belgidan iborat bo'lishi va murakkab kombinatsiyalarni o'z ichiga olishi tavsiya etiladi.</p>
        <p>1.3. Bir hisobdan (akkauntdan) faqat bitta shaxs foydalanishi mumkin. Hisobni boshqalarga sotish yoki ijaraga berish qat'iyan man etiladi va bu hisobning bloklanishiga olib keladi.</p>

        <p><strong>2. QURILMALAR NAZORATI</strong></p>
        <p>2.1. Tizim foydalanuvchi kirgan qurilmalarni (Device ID) qayd etib boradi. Shubhali faollik aniqlanganda (masalan, turli joylardan bir vaqtda kirish), hisob vaqtincha muzlatilishi mumkin.</p>

        <p><strong>3. TAQIQLANGAN HARAKATLAR</strong></p>
        <p>3.1. Quyidagi harakatlar qat'iyan man etiladi:</p>
        <ul className="list-disc pl-5">
            <li>Saytga hakerlik hujumi uyushtirish (DDoS, SQL Injection);</li>
            <li>Avtomatlashtirilgan botlardan foydalanish (ayniqsa Konkurs va O'yinlarda);</li>
            <li>Boshqa foydalanuvchilarning shaxsiy ma'lumotlarini o'g'irlashga urinish.</li>
        </ul>

        <p><strong>4. JAVOBGARLIK</strong></p>
        <p>4.1. Foydalanuvchi o'z hisobi orqali amalga oshirilgan barcha harakatlar uchun to'liq javobgardir.</p>
        <p>4.2. Xavfsizlik qoidalarini buzgan foydalanuvchilarning IP manzillari bloklanadi va qonuniy chora ko'rish uchun tegishli organlarga ma'lumot berilishi mumkin.</p>

        <Seal />
    </div>
);

const TermsContent = () => (
    <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
        <h3 className="text-center font-bold text-lg mb-6 uppercase border-b pb-2">Foydalanish Shartlari (Ommaviy Oferta)</h3>
        
        <p><strong>1. PREDMET</strong></p>
        <p>1.1. Ushbu kelishuv "Anilo.uz" ma'muriyati va Foydalanuvchi o'rtasida tuzilgan bo'lib, saytdan foydalanish tartibini belgilaydi.</p>

        <p><strong>2. PREMIUM OBUNA VA TO'LOVLAR</strong></p>
        <p>2.1. Saytdagi ayrim kontentlar faqat Premium obuna orqali mavjud bo'lishi mumkin.</p>
        <p>2.2. To'langan mablag'lar, agar xizmat ko'rsatishda texnik nosozlik bo'lmasa, qaytarilmaydi.</p>
        <p>2.3. "ARK Trading" va "AniConcurs" bo'limlaridagi yutuqlar va ballar faqat sayt ichida foydalanish uchun mo'ljallangan va real pulga naqdlashtirilmaydi (Adminning alohida qarori bundan mustasno).</p>

        <p><strong>3. INTELLEKTUAL MULK</strong></p>
        <p>3.1. Saytdagi barcha videolar, rasmlar va matnlar mualliflik huquqi ob'ekti hisoblanadi.</p>
        <p>3.2. Saytdagi materiallarni ruxsatsiz ko'chirish, tarqatish yoki tijoriy maqsadda foydalanish taqiqlanadi.</p>
        <p>3.3. Agar siz mualliflik huquqi egasi bo'lsangiz va huquqingiz buzilgan deb hisoblasangiz, admin@anilo.uz manziliga murojaat qiling.</p>

        <p><strong>4. JAVOBGARLIKNI CHEKLASH</strong></p>
        <p>4.1. Ma'muriyat saytning uzluksiz ishlashini ta'minlashga harakat qiladi, lekin texnik nosozliklar, internet tezligi yoki uchinchi tomonlar (xosting provayderlar) aybi bilan yuzaga kelgan uzilishlar uchun javobgar emas.</p>
        
        <p><strong>5. KELISHUV MUDDATI</strong></p>
        <p>5.1. Ushbu kelishuv Foydalanuvchi ro'yxatdan o'tgan paytdan boshlab kuchga kiradi va hisob o'chirilgungacha amal qiladi.</p>

        <Seal />
    </div>
);

export const LegalDocs: React.FC<LegalDocsProps> = ({ type, onClose }) => {
    let content;
    
    switch (type) {
        case 'privacy': content = <PrivacyContent />; break;
        case 'security': content = <SecurityContent />; break;
        case 'terms': content = <TermsContent />; break;
        default: content = null;
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white text-black rounded-xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl border-4 border-double border-gray-300">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="ml-2 text-xs font-mono text-gray-500 uppercase">Official Document: {type.toUpperCase()}.DOC</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 font-serif bg-[#fffcf5]">
                    {content}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 text-center rounded-b-xl">
                    <button 
                        onClick={onClose}
                        className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-2 rounded shadow-lg font-bold transition-transform active:scale-95"
                    >
                        TANISHIB CHIQDIM VA YOPISH
                    </button>
                </div>
            </div>
        </div>
    );
};
