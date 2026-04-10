import React, { useState, useEffect, useCallback } from 'react';
import { TechMentorFile, AppConfig } from '../types';
import { FileUploader } from './FileUploader';
import axios from 'axios';
import { 
  FileText, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Info,
  Calendar,
  HardDrive,
  Loader2,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FileDashboardProps {
  config: AppConfig;
}

export function FileDashboard({ config }: FileDashboardProps) {
  const [files, setFiles] = useState<TechMentorFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<TechMentorFile | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [creatingBucket, setCreatingBucket] = useState(false);

  const fetchFiles = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const response = await axios.get('/api/files');
      setRawResponse(response.data);
      if (response.data.status === 'success' || Array.isArray(response.data.files)) {
        setFiles(response.data.files || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch files:', err);
      setRawResponse(err.response?.data || { error: 'Connection failed' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleCreateBucket = async () => {
    setCreatingBucket(true);
    try {
      const response = await axios.post('/api/buckets/create', {
        project_name: config.projectName,
        bucket_name: config.bucketName
      });
      alert('Bucket check/creation successful: ' + JSON.stringify(response.data));
      fetchFiles(true);
    } catch (err: any) {
      alert('Bucket creation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setCreatingBucket(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await axios.delete(`/api/files/${fileId}`);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      if (selectedFile?.id === fileId) setSelectedFile(null);
    } catch (err) {
      alert('Failed to delete file');
    }
  };

  const filteredFiles = files.filter(f => 
    f.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Sidebar: Upload & Stats */}
      <div className="lg:col-span-4 space-y-8">
        <FileUploader onUploadSuccess={() => fetchFiles(true)} />
        
        <div className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <h2 className="font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Bucket Management
          </h2>
          <p className="font-mono text-[10px] opacity-60 mb-4">
            If your bucket doesn't exist, use this to initialize it.
          </p>
          <button
            onClick={handleCreateBucket}
            disabled={creatingBucket}
            className="w-full py-2 bg-[#141414] text-[#E4E3E0] font-mono text-[10px] uppercase tracking-widest hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creatingBucket ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Initialize Bucket
          </button>
        </div>

        <div className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <h2 className="font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Storage Stats
          </h2>
          <div className="space-y-4 font-mono text-xs">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="opacity-50 uppercase">Total Files</span>
              <span className="font-bold">{files.length}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="opacity-50 uppercase">Total Size</span>
              <span className="font-bold">
                {formatSize(files.reduce((acc, f) => acc + f.size, 0))}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="opacity-50 uppercase">Last Sync</span>
              <span className="font-bold">{new Date().toLocaleTimeString()}</span>
            </div>
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="w-full mt-4 text-[9px] uppercase tracking-tighter opacity-30 hover:opacity-100 transition-opacity text-left"
            >
              {showDebug ? '[-] Hide Debug Info' : '[+] Show Raw API Response'}
            </button>
            {showDebug && (
              <pre className="mt-2 p-2 bg-gray-100 text-[9px] overflow-x-auto max-h-40 font-mono">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: File List */}
      <div className="lg:col-span-8">
        <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col h-full">
          {/* Toolbar */}
          <div className="p-4 border-b border-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
              <input
                type="text"
                placeholder="SEARCH ASSETS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#F5F5F5] border border-[#141414] font-mono text-xs uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#141414]"
              />
            </div>
            <button
              onClick={() => fetchFiles(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[#141414] text-[#E4E3E0] font-mono text-[10px] uppercase tracking-widest hover:bg-opacity-90 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-6 py-3 bg-[#F5F5F5] border-b border-[#141414] font-serif italic text-[11px] uppercase tracking-wider opacity-50">
            <div>Asset Name</div>
            <div className="text-right">Size</div>
            <div className="text-right">Created</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto min-h-[400px]">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Synchronizing...</span>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4 py-20">
                <HardDrive className="w-12 h-12" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">No Assets Found</span>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                <AnimatePresence initial={false}>
                  {filteredFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-6 py-4 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group cursor-pointer"
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-4 h-4 flex-shrink-0 opacity-40 group-hover:opacity-100" />
                        <div className="overflow-hidden">
                          <p className="font-mono text-xs font-bold truncate">{file.original_name}</p>
                          <p className="font-mono text-[9px] opacity-40 group-hover:opacity-60 truncate">{file.id}</p>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-right self-center opacity-60 group-hover:opacity-100">
                        {formatSize(file.size)}
                      </div>
                      <div className="font-mono text-[10px] text-right self-center opacity-40 group-hover:opacity-80">
                        {new Date(file.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center justify-end gap-2 self-center">
                        <a
                          href={`https://api.techmentor.uz/f/${file.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 hover:bg-white hover:text-[#141414] transition-colors"
                          title="View File"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                          className="p-1.5 hover:bg-red-500 hover:text-white transition-colors"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Details Modal/Drawer (Optional Overlay) */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#141414]/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedFile(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#E4E3E0] border border-[#141414] w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#141414] flex justify-between items-center bg-white">
                <h3 className="font-bold uppercase tracking-tight flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Asset Metadata
                </h3>
                <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-[#141414] p-4">
                    <FileText className="w-8 h-8 text-[#E4E3E0]" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-lg break-all leading-tight">{selectedFile.original_name}</p>
                    <p className="font-mono text-xs opacity-50 mt-1 uppercase tracking-widest">ID: {selectedFile.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/50 p-3 border border-[#141414]/10">
                    <div className="flex items-center gap-2 opacity-40 mb-1">
                      <HardDrive className="w-3 h-3" />
                      <span className="font-mono text-[9px] uppercase tracking-widest">Size</span>
                    </div>
                    <p className="font-mono text-sm font-bold">{formatSize(selectedFile.size)}</p>
                  </div>
                  <div className="bg-white/50 p-3 border border-[#141414]/10">
                    <div className="flex items-center gap-2 opacity-40 mb-1">
                      <Calendar className="w-3 h-3" />
                      <span className="font-mono text-[9px] uppercase tracking-widest">Created</span>
                    </div>
                    <p className="font-mono text-sm font-bold">{new Date(selectedFile.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <a
                    href={`https://api.techmentor.uz/f/${selectedFile.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#141414] text-[#E4E3E0] py-3 font-mono text-xs uppercase tracking-widest text-center hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Asset
                  </a>
                  <button
                    onClick={() => handleDelete(selectedFile.id)}
                    className="px-4 bg-red-500 text-white hover:bg-red-600 transition-all flex items-center justify-center"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
