import React, { useState, useEffect } from 'react';
import { Movie } from './types';
import { getMovies } from './services/dbService';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Play, Info, Plus, ChevronLeft, ChevronRight, Star, Moon, TrendingUp, Globe, Search, Bell } from 'lucide-react';
import { Page } from './App';
import { MovieCard } from './components/MovieCard';
import { Footer } from './components/Footer';
import { RightSidebar } from './components/RightSidebar';

interface WelcomePageProps {
  onMovieClick: (movie: Movie) => void; 
  onSearch: (query: string) => void;
  onStart: () => void; 
  onNavigate: (page: Page) => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onStart, onNavigate, onMovieClick }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    getMovies().then(setMovies);
  }, []);

  const heroMovies = movies.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      
      {/* SIMULATED BROWSER BAR */}
      <div className="hidden lg:flex items-center gap-4 bg-[#121212] px-6 py-3 border-b border-white/5 sticky top-0 z-[200] backdrop-blur-xl bg-opacity-80">
          <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
          <div className="flex-1 max-w-2xl bg-black/40 border border-white/5 rounded-lg px-4 py-1.5 flex items-center gap-3 ml-4">
              <Globe size={14} className="text-zinc-500" />
              <p className="text-[11px] font-bold text-zinc-400 tracking-tight">https://anilo.uz</p>
          </div>
          <div className="flex-1"></div>
      </div>

      {/* HEADER */}
      <header className="absolute top-16 left-0 right-0 z-50 px-12 py-6 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-12 pointer-events-auto">
              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                  <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.5)] group-hover:scale-110 transition-transform">
                      <img src="/logotip.png" alt="Logo" className="w-8 h-8 object-contain" />
                  </div>
                  <h1 className="text-2xl font-black tracking-tighter uppercase">ANILO<span className="text-orange-500">.UZ</span></h1>
              </div>

              <nav className="hidden xl:flex items-center gap-8">
                  {['BOSH SAHIFA', 'KATALOG', 'TOP REYTING', 'YANGILIKLAR', 'FAQ', 'BOG\'LANISH'].map((item) => (
                      <button key={item} className="text-[10px] font-black tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">{item}</button>
                  ))}
              </nav>
          </div>

          <div className="flex items-center gap-8 pointer-events-auto">
              <div className="flex items-center gap-6 text-zinc-400">
                  <button className="hover:text-white transition-colors"><Search size={20} /></button>
                  <button className="hover:text-white transition-colors"><Bell size={20} /></button>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/5 pl-2 pr-4 py-1.5 rounded-full hover:bg-white/10 transition-all cursor-pointer group" onClick={onStart}>
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-[10px] font-black group-hover:scale-110 transition-transform">S</div>
                  <span className="text-[10px] font-black text-zinc-400 group-hover:text-white">SARDOR</span>
              </div>
          </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative h-screen w-full flex items-center justify-center">
          <AnimatePresence mode="wait">
              {heroMovies.length > 0 && (
                  <motion.div 
                    key={heroIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                  >
                      <img 
                        src={heroMovies[heroIndex].poster_url || heroMovies[heroIndex].posterUrl} 
                        className="w-full h-full object-cover scale-105" 
                        alt="Hero" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
                      <div className="absolute inset-0 bg-black/40"></div>
                  </motion.div>
              )}
          </AnimatePresence>

          <div className="relative z-10 container mx-auto px-6 text-center pt-24">
              {heroMovies.length > 0 && (
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="max-w-5xl mx-auto"
                  >
                      <div className="flex items-center justify-center gap-4 mb-8">
                          <span className="px-4 py-1.5 bg-orange-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">YANGI</span>
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10">
                              <Star size={14} className="text-yellow-400 fill-yellow-400" />
                              <span className="text-white font-black text-xs">5.0 Star</span>
                          </div>
                          <span className="px-4 py-1.5 bg-white/10 backdrop-blur-xl text-white text-[10px] font-black rounded-full border border-white/10 uppercase tracking-widest">COMEDY</span>
                      </div>

                      <h2 className="text-6xl md:text-8xl lg:text-[10rem] font-black text-white leading-[0.8] tracking-tighter uppercase mb-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                          {heroMovies[heroIndex].title}
                      </h2>

                      <p className="text-zinc-300 text-sm md:text-lg lg:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed drop-shadow-2xl">
                          {heroMovies[heroIndex].plot}
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-5">
                          <button onClick={() => onMovieClick(heroMovies[heroIndex])} className="h-16 px-12 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-orange-600 hover:text-white transition-all shadow-2xl flex items-center gap-4 group">
                              <Play fill="currentColor" size={20} /> KO'RISH
                          </button>
                          <button onClick={() => onMovieClick(heroMovies[heroIndex])} className="h-16 px-12 bg-black/40 backdrop-blur-2xl border border-white/10 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-white/10 transition-all flex items-center gap-4">
                              <Info size={20} /> BATAFSIL
                          </button>
                          <button onClick={() => onMovieClick(heroMovies[heroIndex])} className="w-16 h-16 rounded-full border-2 border-white/10 bg-black/40 flex items-center justify-center text-white hover:bg-white/10 transition-all">
                              <Plus size={28} />
                          </button>
                          <button onClick={() => onMovieClick(heroMovies[heroIndex])} className="h-16 px-12 bg-black/40 backdrop-blur-2xl border border-white/10 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-white/10 transition-all flex items-center gap-4">
                              <Crown size={20} /> OBUNA BO'LISH
                          </button>
                      </div>

                      {/* CAROUSEL PAGINATION */}
                      <div className="mt-20 flex items-center justify-center gap-6 bg-black/20 backdrop-blur-xl px-10 py-4 rounded-full border border-white/5 w-fit mx-auto">
                          {[1, 2, 3, 4, 5, '...', 100].map((num, i) => (
                              <button 
                                key={i} 
                                className={`text-[11px] font-black transition-all ${i === heroIndex ? 'text-orange-500 scale-125' : 'text-zinc-600 hover:text-white'}`}
                              >
                                  {num}
                              </button>
                          ))}
                          <button className="text-zinc-600 hover:text-white transition-colors ml-2"><ChevronRight size={16} /></button>
                      </div>
                  </motion.div>
              )}
          </div>

          {/* ARROWS */}
          <button 
            onClick={() => setHeroIndex((prev) => (prev - 1 + heroMovies.length) % heroMovies.length)}
            className="absolute left-10 top-1/2 -translate-y-1/2 p-4 rounded-full border border-white/5 bg-black/10 text-white hover:bg-orange-600 transition-all z-20"
          >
              <ChevronLeft size={32} />
          </button>
          <button 
            onClick={() => setHeroIndex((prev) => (prev + 1) % heroMovies.length)}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-4 rounded-full border border-white/5 bg-black/10 text-white hover:bg-orange-600 transition-all z-20"
          >
              <ChevronRight size={32} />
          </button>
      </section>

      {/* MAIN CONTENT AREA WITH SIDEBAR */}
      <section className="container mx-auto px-12 py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-9 space-y-32">
                  {/* ANNOUNCEMENTS */}
                  <div>
                      <div className="flex items-center gap-6 mb-12">
                          <div className="h-12 w-1.5 bg-orange-600 rounded-full"></div>
                          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">E'lonlar va Aksyalar</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {[
                              { title: 'PREMIUM OBUNA', desc: 'REKLAMASIZ KO\'RISH VA MAXSUS IMTIYOZLAR', btn: 'OBUNA BO\'LISH', icon: <Crown className="text-orange-500" /> },
                              { title: 'YANGI KONKURS', desc: 'SOVG\'ALAR VA QIZIQARLI O\'YINLARDA QATNASHING', btn: 'BATAFSIL', icon: <TrendingUp className="text-purple-500" /> },
                              { title: 'ANILO STUDIO', desc: 'IJODKORLAR UCHUN MAXSUS PLATFORMA', btn: 'O\'TISH', icon: <Globe className="text-blue-500" /> }
                          ].map((card, i) => (
                              <div key={i} className="group bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 h-72 flex flex-col justify-between transition-all hover:bg-white/[0.02] hover:border-white/10 shadow-2xl relative overflow-hidden">
                                   <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-700">{card.icon}</div>
                                   <div>
                                       <h4 className="text-white font-black text-xl mb-2 tracking-tight uppercase">{card.title}</h4>
                                       <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed max-w-[200px]">{card.desc}</p>
                                   </div>
                                   <div className="flex items-center gap-4">
                                       <button className="px-6 py-3 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 active:scale-95 transition-all">
                                           {card.btn}
                                       </button>
                                       {i === 2 && (
                                           <button className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                                               <ChevronRight size={18} />
                                           </button>
                                       )}
                                   </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* CONTENT GRIDS */}
                  {[
                      { title: 'YANGI QO\'SHILGANLAR', color: 'bg-orange-600', movies: movies.slice(0, 10) },
                      { title: 'ENG SUNGI QISMLAR', color: 'bg-orange-600', movies: movies.slice(10, 20) },
                      { title: 'TOP REYTINGDAGI FILMLAR', color: 'bg-orange-600', movies: movies.sort((a,b) => b.rating - a.rating).slice(0, 10) }
                  ].map((section, idx) => (
                      <div key={idx}>
                          <div className="flex items-center justify-between mb-12">
                              <div className="flex items-center gap-6">
                                  <div className={`h-12 w-1.5 ${section.color} rounded-full`}></div>
                                  <div>
                                      <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-2">{section.title}</h3>
                                      <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.4em]">Katalogdagi eng so'nggi yangiliklar</p>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <button className="p-3 bg-zinc-900 rounded-full text-zinc-600 hover:text-white transition-colors"><ChevronLeft size={18}/></button>
                                  <button className="p-3 bg-zinc-900 rounded-full text-zinc-600 hover:text-white transition-colors"><ChevronRight size={18}/></button>
                              </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                              {section.movies.map(movie => (
                                  <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                              ))}
                          </div>
                      </div>
                  ))}
              </div>

              {/* SIDEBAR */}
              <div className="lg:col-span-3">
                  <RightSidebar />
              </div>
          </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

