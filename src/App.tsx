
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';

// Pages
import { CatalogPage } from './pages/CatalogPage';
import { AniConcursPage } from './pages/AniConcursPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChatPage } from './pages/ChatPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { VideoPlayerPage } from './pages/VideoPlayerPage';

const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen bg-[#0E0E12]">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
    </div>
);

const CatalogWrapper = () => {
    const navigate = useNavigate();
    return <CatalogPage onMovieClick={(movie) => navigate(`/anime/${movie.id}`)} />;
};

export default function App() {
    return (
        <Router>
            <React.Suspense fallback={<LoadingFallback />}>
                <Routes>
                    {/* Main App Routes with Layout */}
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<CatalogWrapper />} />
                        <Route path="catalog" element={<CatalogWrapper />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="chat" element={<ChatPage />} />
                        <Route path="contest" element={<AniConcursPage />} />
                        <Route path="favorites" element={<CatalogWrapper />} />
                        <Route path="history" element={<CatalogWrapper />} />
                    </Route>

                    {/* Standalone Pages (No Main Nav) */}
                    {/* Note: VideoPlayerPage expects a movie object as prop, so we might need a wrapper that fetches it */}
                    <Route path="/watch/:id" element={<VideoPlayerPageWrapper />} />
                    <Route path="/anime/:id" element={<MovieDetailPageWrapper />} />
                    <Route path="/admin/*" element={<AdminDashboard />} />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </React.Suspense>
        </Router>
    );
}

// Wrappers to handle URL params
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getMovies } from './services/dbService';
import { Movie } from './types';

const VideoPlayerPageWrapper = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState<Movie | null>(null);

    useEffect(() => {
        getMovies().then(movies => {
            const m = movies.find(m => String(m.id) === id);
            if (m) setMovie(m);
        });
    }, [id]);

    if (!movie) return <LoadingFallback />;
    return <VideoPlayerPage movie={movie} onBack={() => navigate(-1)} />;
};

const MovieDetailPageWrapper = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState<Movie | null>(null);

    useEffect(() => {
        getMovies().then(movies => {
            const m = movies.find(m => String(m.id) === id);
            if (m) setMovie(m);
        });
    }, [id]);

    if (!movie) return <LoadingFallback />;
    return (
        <MovieDetailPage 
            movie={movie} 
            onBack={() => navigate(-1)} 
            onPlay={() => navigate(`/watch/${movie.id}`)}
        />
    );
};
