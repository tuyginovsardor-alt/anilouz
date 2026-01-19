
import React, { useState, useCallback, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { MovieCard } from './components/MovieCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { searchMoviesDB } from './services/dbService';
import { getActiveAdForLocation } from './services/adService';
import { Movie, Ad } from './types';
import { AdBanner } from './components/AdBanner';
import { Pagination } from './components/Pagination';

interface SearchPageProps {
  initialQuery: string;
  onNewSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
}

const ITEMS_PER_PAGE = 20;

const SEARCH_CATEGORIES = [
    'Action', 'Sarguzasht', 'Komediya', 'Drama', 'Fantastika', 
    'Romantika', 'Qo\'rqinchli', 'Detektiv', 'Sport', 'Psixologik', 'Triller', 'Musiqiy'
];

export const SearchPage: React.FC<SearchPageProps> = ({ initialQuery, onNewSearch, onMovieClick }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState<boolean>(false);
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [ad, setAd] = useState<Ad | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setMovies([]);
      setSearched(false);
      return;
    }
    setCurrentQuery(query);
    setIsLoading(true);
    setError(null);
    setSearched(true);
    setMovies([]);
    setCurrentPage(1); // Reset page on new search

    try {
      // Use Database Search
      const result = await searchMoviesDB(query);
      setMovies(result);
      if (result.length === 0) {
        setError("Ushbu so'rov bo'yicha animelar topilmadi. Boshqa nomni sinab ko'ring.");
      }
    } catch (err) {
      console.error(err);
      setError('Qidiruvda xatolik yuz berdi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
        performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  useEffect(() => { 
      const fetchAd = async () => {
          const activeAd = await getActiveAdForLocation('search_top');
          setAd(activeAd);
      }
      fetchAd();
  }, []);

  const handleCategoryClick = (category: string) => {
      onNewSearch(category);
      performSearch(category);
  };

  // Pagination Logic
  const totalPages = Math.ceil(movies.length / ITEMS_PER_PAGE);
  const currentMovies = movies.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <div className="max-w-2xl mx-auto mt-4 px-4">
        <SearchBar onSearch={performSearch} isLoading={isLoading} />
      </div>
      
      {/* GENRES / CATEGORIES GRID */}
      {!searched && !isLoading && (
          <div className="max-w-3xl mx-auto px-4 mt-8">
              <h3 className="text-white font-bold text-lg mb-4 pl-2 border-l-4 border-orange-500">Kategoriyalar</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {SEARCH_CATEGORIES.map((cat) => (
                      <button
                          key={cat}
                          onClick={() => handleCategoryClick(cat)}
                          className="bg-[#1a1a1a] hover:bg-orange-600/20 hover:border-orange-500/50 border border-white/5 rounded-xl py-3 px-4 text-center text-sm font-bold text-gray-300 hover:text-white transition-all active:scale-95"
                      >
                          {cat}
                      </button>
                  ))}
              </div>
          </div>
      )}
      
      {ad && <AdBanner ad={ad} onClose={() => setAd(null)} />}

      {searched && !isLoading && (
        <div className="text-center mb-8 mt-8">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                Qidiruv Natijalari
            </h2>
            <p className="text-gray-400">"{currentQuery}" uchun topilganlar: {movies.length}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center mt-10">
            <LoadingSpinner />
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg max-w-2xl mx-auto mt-10">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && movies.length > 0 && (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 md:gap-8 px-4 mt-6">
                {currentMovies.map((movie) => (
                <MovieCard
                    key={`${movie.title}-${movie.id}-search`}
                    movie={movie}
                    isActive={true}
                    onClick={() => onMovieClick(movie)}
                />
                ))}
            </div>
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
            />
        </>
      )}
    </>
  );
};
