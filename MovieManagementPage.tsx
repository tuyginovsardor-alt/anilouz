
import React, { useState, useEffect } from 'react';
import { Movie } from './types';
import { getAdminMovies, addMovieToDB, updateMovieInDB, deleteMovieFromDB, uploadPoster, uploadVideo, toggleMovieArchive } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { EditIcon } from './components/icons/EditIcon';
import { DeleteIcon } from './components/icons/DeleteIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { ArchiveIcon } from './components/icons/ArchiveIcon';
import { RestoreIcon } from './components/icons/RestoreIcon';
import { AddMovieModal } from './components/AddMovieModal';
import { useNotification } from './hooks/useNotification';
import { Pagination } from './components/Pagination';

const ITEMS_PER_PAGE = 10;

export const MovieManagementPage: React.FC = () => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false); // New state to track saving/uploading
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
    const { addNotification } = useNotification();
    
    // Filter State
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    const fetchMovies = async () => {
        setIsLoading(true);
        try {
            const fetchedMovies = await getAdminMovies();
            setMovies(fetchedMovies);
        } catch (error) {
            console.error("Failed to fetch movies for management", error);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Animelarni yuklab bo\'lmadi' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    const handleSaveMovie = async (movieData: any) => {
        setIsSaving(true);
        try {
            let posterUrl = movieData.poster;
            let videoUrl = movieData.videoSource;

            // 1. Upload Poster if changed
            if (movieData.posterType === 'file' && movieData.poster instanceof File) {
                try {
                    posterUrl = await uploadPoster(movieData.poster);
                } catch (uploadError) {
                    console.error("Poster upload failed", uploadError);
                    addNotification({ type: 'warning', title: 'Ogohlantirish', message: 'Poster yuklanmadi, eski rasm yoki placeholder qoldi.' });
                    if (!editingMovie) posterUrl = `https://picsum.photos/seed/${movieData.title}/400/600`;
                }
            }

            // 2. Upload Video if changed (Single movie)
             if (!movieData.isSeries && movieData.videoSourceType === 'file' && movieData.videoSource instanceof File) {
                try {
                    videoUrl = await uploadVideo(movieData.videoSource);
                } catch (uploadError) {
                    console.error("Video upload failed", uploadError);
                    addNotification({ type: 'error', title: 'Xatolik', message: 'Video yuklanmadi.' });
                    setIsSaving(false);
                    return; // Critical failure
                }
            }

            // 3. Handle Series Episodes Uploads
            let episodesData = movieData.episodes || [];
            if (movieData.isSeries && episodesData.length > 0) {
                // We need to iterate and upload any files
                const uploadedEpisodes = await Promise.all(episodesData.map(async (ep: any) => {
                    if (ep.sourceType === 'file' && ep.source instanceof File) {
                        try {
                            const url = await uploadVideo(ep.source);
                            return { ...ep, source: url };
                        } catch (e) {
                            console.error(`Failed to upload episode ${ep.title}`, e);
                            throw new Error(`"${ep.title}" videosini yuklab bo'lmadi.`);
                        }
                    }
                    return ep;
                }));
                episodesData = uploadedEpisodes;
            }

            const moviePayload: any = {
                title: movieData.title,
                year: movieData.year,
                plot: movieData.plot,
                posterUrl: typeof posterUrl === 'string' ? posterUrl : '',
                videoUrl: !movieData.isSeries && typeof videoUrl === 'string' ? videoUrl : '',
                genre: movieData.genre,
                language: 'JP/UZ', 
                quality: 'HD',
                status: movieData.status, // Added status
                tags: movieData.tags, // Added tags
                translator: movieData.translator, // Added translator
                episodes: movieData.isSeries ? episodesData : [] // Pass the processed episodes
            };

            if (movieData.id) {
                // UPDATE EXISTING
                await updateMovieInDB(movieData.id, moviePayload);
                // Optimistic update slightly complicated by episodes, so reload is safer, but we try basic
                setMovies(prev => prev.map(m => m.id === movieData.id ? { ...m, ...moviePayload } : m));
                addNotification({ type: 'success', title: 'Yangilandi', message: 'Anime muvaffaqiyatli yangilandi.' });
            } else {
                // CREATE NEW
                const addedMovie = await addMovieToDB(moviePayload);
                if (addedMovie) {
                    setMovies(prev => [addedMovie, ...prev]);
                    addNotification({ type: 'success', title: 'Qo\'shildi', message: 'Yangi anime muvaffaqiyatli qo\'shildi.' });
                }
            }
            
            setIsModalOpen(false); // Close modal ONLY after successful save
        } catch (error: any) {
            console.error("Error saving movie:", error);
            addNotification({ type: 'error', title: 'Xatolik', message: error.message || 'Saqlashda xatolik yuz berdi.' });
        } finally {
            setIsSaving(false);
        }
    }

    const handleEditClick = (movie: Movie) => {
        setEditingMovie(movie);
        setIsModalOpen(true);
    };

    const handleCreateClick = () => {
        setEditingMovie(null);
        setIsModalOpen(true);
    };

    const handleToggleArchive = async (id: number, currentStatus: boolean) => {
        try {
            await toggleMovieArchive(id, !currentStatus);
            setMovies(prev => prev.map(m => m.id === id ? { ...m, is_archived: !currentStatus } : m));
            addNotification({ 
                type: 'info', 
                title: !currentStatus ? 'Arxivlandi' : 'Tiklandi', 
                message: !currentStatus ? 'Anime arxivga olindi (foydalanuvchilarga ko\'rinmaydi).' : 'Anime arxivdan chiqarildi va faollashtirildi.' 
            });
        } catch (error) {
            console.error(error);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Statusni o\'zgartirib bo\'lmadi.' });
        }
    };

    const handleDeleteMovie = async (id: number) => {
        if (!window.confirm("Rostdan ham bu animeni o'chirmoqchimisiz? Bu qaytarib bo'lmas jarayon. O'rniga 'Arxivlash'ni tavsiya qilamiz.")) return;

        try {
            await deleteMovieFromDB(id);
            setMovies(prev => prev.filter(m => m.id !== id));
            addNotification({ type: 'success', title: 'O\'chirildi', message: 'Anime bazadan o\'chirildi.' });
        } catch (error: any) {
            console.error("Delete error:", error);
            let errorMsg = 'O\'chirishda xatolik.';
            // Check if typical foreign key error
            if (JSON.stringify(error).includes("foreign key constraint")) {
                 errorMsg = "Xatolik: Bu animega sharhlar yoki tarix bog'langan. Baza sozlamalarini tekshiring (CASCADE delete) yoki animeni Arxivlang.";
            }
            addNotification({ type: 'error', title: 'Xatolik', message: errorMsg });
        }
    }

    // Filter based on tab
    const filteredMovies = movies.filter(m => 
        activeTab === 'active' ? !m.is_archived : m.is_archived
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
    const currentMovies = filteredMovies.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-white">Animelarni Boshqarish</h1>
                <div className="flex gap-3">
                    <button 
                        onClick={handleCreateClick}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Yangi Anime Qo'shish</span>
                    </button>
                </div>
            </div>
            
            {/* TABS */}
            <div className="flex mb-6 border-b border-gray-700">
                <button 
                    onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
                    className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'active' ? 'text-orange-400' : 'text-gray-400 hover:text-white'}`}
                >
                    Faol Animelar ({movies.filter(m => !m.is_archived).length})
                    {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-400"></div>}
                </button>
                <button 
                    onClick={() => { setActiveTab('archived'); setCurrentPage(1); }}
                    className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'archived' ? 'text-orange-400' : 'text-gray-400 hover:text-white'}`}
                >
                    Arxiv ({movies.filter(m => m.is_archived).length})
                    {activeTab === 'archived' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-400"></div>}
                </button>
            </div>
            
            {isLoading ? <div className="flex justify-center py-20"><LoadingSpinner /></div> : (
                <div className="bg-gray-800/70 rounded-lg overflow-hidden">
                    {filteredMovies.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            {activeTab === 'active' ? "Hozircha faol animelar yo'q." : "Arxiv bo'sh."}
                        </div>
                    ) : (
                        <>
                            <table className="w-full text-left">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="p-4 font-semibold">Poster</th>
                                        <th className="p-4 font-semibold">Nomi</th>
                                        <th className="p-4 font-semibold hidden sm:table-cell">Yil</th>
                                        <th className="p-4 font-semibold hidden md:table-cell">Janr</th>
                                        <th className="p-4 font-semibold">Amallar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {currentMovies.map(movie => (
                                        <tr key={movie.id || movie.title} className="hover:bg-gray-800 transition-colors">
                                            <td className="p-2">
                                                <img src={movie.posterUrl} alt={movie.title} className="w-12 h-18 object-cover rounded-md aspect-[2/3]" />
                                            </td>
                                            <td className="p-4 font-semibold text-white">{movie.title}</td>
                                            <td className="p-4 text-gray-400 hidden sm:table-cell">{movie.year}</td>
                                            <td className="p-4 text-gray-400 hidden md:table-cell">{movie.genre}</td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleEditClick(movie)}
                                                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                                                        title="Tahrirlash"
                                                    >
                                                        <EditIcon className="w-5 h-5"/>
                                                    </button>
                                                    
                                                    {/* Archive/Restore Button */}
                                                    <button 
                                                        onClick={() => movie.id && handleToggleArchive(movie.id, !!movie.is_archived)}
                                                        className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                                                        title={movie.is_archived ? "Arxivdan chiqarish" : "Arxivlash (Yashirish)"}
                                                    >
                                                        {movie.is_archived ? <RestoreIcon className="w-5 h-5" /> : <ArchiveIcon className="w-5 h-5" />}
                                                    </button>

                                                    <button 
                                                        onClick={() => movie.id && handleDeleteMovie(movie.id)}
                                                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                                        title="Butunlay O'chirish"
                                                    >
                                                        <DeleteIcon className="w-5 h-5"/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-4">
                                <Pagination 
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        </>
                    )}
                </div>
            )}

            {isModalOpen && (
                <AddMovieModal 
                    initialData={editingMovie}
                    onClose={() => !isSaving && setIsModalOpen(false)} // Prevent close while saving
                    onSave={handleSaveMovie}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};
