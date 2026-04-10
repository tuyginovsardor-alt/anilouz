import { useState, useEffect } from 'react';
import { FileDashboard } from './components/FileDashboard';
import { Header } from './components/Header';
import { AppConfig } from './types';
import axios from 'axios';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await axios.get('/api/config');
        setConfig(response.data);
      } catch (err) {
        setError('Failed to load configuration. Make sure the server is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#141414]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-4">
        <div className="bg-white border border-[#141414] p-6 max-w-md w-full shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h2 className="font-bold uppercase tracking-tight">Configuration Error</h2>
          </div>
          <p className="text-[#141414] font-mono text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-[#141414] text-[#E4E3E0] py-2 font-mono text-sm uppercase hover:bg-opacity-90 transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      <Header config={config!} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!config?.hasApiKey && (
          <div className="mb-8 bg-amber-50 border border-amber-200 p-4 font-mono text-xs text-amber-800">
            [WARNING] API Key not detected in environment. Please configure TECHMENTOR_API_KEY in .env.
          </div>
        )}
        
        <div className="mb-8 bg-blue-50 border border-blue-200 p-4 font-mono text-[10px] text-blue-800 uppercase tracking-widest flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Diagnostic Mode:</span>
          </div>
          <span>URL: https://api.techmentor.uz/{config?.projectName}/{config?.bucketName}/</span>
        </div>

        <FileDashboard config={config!} />
      </main>
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-[#141414] mt-12 flex justify-between items-center opacity-50">
        <div className="font-mono text-[10px] uppercase tracking-widest">
          TechMentor API Integration Test v1.0
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest">
          {new Date().toISOString()}
        </div>
      </footer>
    </div>
  );
}
