
import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { getMovies } from './services/dbService';
import { getActiveAdForLocation } from './services/adService';
import { Movie, Ad } from './types';
import { SearchBar } from './components/SearchBar';
import { MovieCarousel } from './components/MovieCarousel';
import { AdBanner } from './components/AdBanner';
import { GenreSection } from './components/GenreSection';

interface WelcomePageProps {
  onMovieClick: (movie: Movie) => void;
  onSearch: (query: string) => void;
}

// Biz ko'rsatmoqchi bo'lgan asosiy 6 ta janr
const TARGET_GENRES = [
    { key: 'action', label: 'Jangari (Action)' },
    { key: 'fantasy', label: 'Fantastika' },
    { key: 'comedy', label: 'Komediya' },
    { key: 'romance', label: 'Romantika' },
    { key: 'drama', label: 'Drama' },
    { key: 'adventure', label: 'Sarguzasht' },
];

export const WelcomePage: React.FC<WelcomePageProps> = ({ onMovieClick, onSearch }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bottomAd, setBottomAd] = useState<Ad | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch Movies from Supabase
        const dbMovies = await getMovies();
        setMovies(dbMovies);

        // Fetch Ads from DB (Async)
        const welcomeAd = await getActiveAdForLocation('welcome_bottom');
        setBottomAd(welcomeAd);

      } catch (err) {
        console.error(err);
        setError('Ma\'lumotlarni yuklashda xatolik. Internetni tekshiring.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Janr bo'yicha filtrlash funksiyasi
  const getMoviesByGenre = (genreKey: string) => {
      // API dan kelgan janrlar vergul bilan ajratilgan bo'lishi mumkin (masalan: "Action, Adventure")
      // Yoki "Jangari" deb yozilgan bo'lishi mumkin.
      // Biz qidiruvni soddalashtirish uchun lowercase qilib tekshiramiz.
      
      // Mapping English keys to Uzbek/English potential DB values
      const searchTerms: Record<string, string[]> = {
          'action': ['action', 'jangari'],
          'fantasy': ['fantasy', 'fantastika'],
          'comedy': ['comedy', 'komediya', 'kulgi'],
          'romance': ['romance', 'romantika', 'sevgi'],
          'drama': ['drama'],
          'adventure': ['adventure', 'sarguzasht']
      };

      const terms = searchTerms[genreKey] || [genreKey];

      return movies.filter(m => {
          const movieGenres = m.genre.toLowerCase();
          return terms.some(term => movieGenres.includes(term));
      });
  };

  return (
    <div>
      <div className="text-center my-8 md:my-12 px-4">
        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 animate-fire-text mb-4">
          Sevimli Animengizni Toping
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto mb-6 text-sm md:text-base">
          Minglab anime seriallar va to'liq metrajli animelar. Yuqori sifatda, reklamasiz.
        </p>
        <div className="max-w-2xl mx-auto">
          <SearchBar onSearch={onSearch} isLoading={false} />
        </div>
      </div>

      {isLoading && <LoadingSpinner />}
      
      {error && !isLoading && (
        <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg max-w-2xl mx-auto">
          <p>{error}</p>
        </div>
      )}
      
      {!isLoading && movies.length === 0 && !error && (
          <div className="text-center text-gray-500 py-10">
              <p>Hozircha bazada animelar yo'q. Admin panel orqali qo'shing.</p>
          </div>
      )}

      {!isLoading && movies.length > 0 && (
        <>
          {/* Top Carousel - Faqat eng yangi 10 tasi */}
          <div className="mb-12">
             <h2 className="text-2xl font-bold text-center mb-6 text-white">Top Animelar</h2>
             <MovieCarousel movies={movies.slice(0, 10)} onMovieClick={onMovieClick} />
          </div>
          
          {bottomAd && <AdBanner ad={bottomAd} onClose={() => setBottomAd(null)} />}

          {/* Janrlar bo'yicha bo'limlar (2 qatorli gorizontal) */}
          <div className="space-y-4 pb-10">
              {TARGET_GENRES.map((genre) => {
                  const genreMovies = getMoviesByGenre(genre.key);
                  // Agar ushbu janrda kino bo'lmasa, bo'limni ko'rsatmaymiz
                  if (genreMovies.length === 0) return null;

                  return (
                      <GenreSection 
                        key={genre.key}
                        title={genre.label}
                        movies={genreMovies}
                        onMovieClick={onMovieClick}
                      />
                  );
              })}
          </div>
        </>
      )}
    </div>
  );
};
