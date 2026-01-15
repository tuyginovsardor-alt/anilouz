import React, { useState } from 'react';
import { SearchIcon } from './icons/SearchIcon';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Masalan, 'Naruto', 'One Piece', 'Solo Leveling'..."
        className="w-full px-5 py-4 pr-16 text-lg bg-gray-800 border-2 border-gray-700 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors duration-200 placeholder-gray-500 text-white"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !query.trim()}
        className="absolute inset-y-0 right-0 flex items-center justify-center w-14 h-14 text-white bg-orange-600 rounded-full hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed transform transition-transform duration-200 active:scale-95 m-1"
        aria-label="Qidirish"
      >
        <SearchIcon className="w-6 h-6" />
      </button>
    </form>
  );
};