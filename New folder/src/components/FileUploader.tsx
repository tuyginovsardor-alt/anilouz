import React, { useState, useRef } from 'react';
import { Upload, X, File, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploaderProps {
  onUploadSuccess: () => void;
}

export function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    setStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus('idle');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('success');
      setTimeout(() => {
        clearFile();
        onUploadSuccess();
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      const apiError = err.response?.data;
      setErrorMessage(apiError?.error || apiError?.details || 'Upload failed');
      if (apiError?.details) {
        console.error('API Error Details:', apiError.details);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
      <h2 className="font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
        <Upload className="w-4 h-4" />
        Upload New Asset
      </h2>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer
          ${isDragging ? 'border-[#141414] bg-[#F5F5F5]' : 'border-gray-300 hover:border-gray-400'}
          ${file ? 'border-solid border-[#141414] bg-white' : ''}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <File className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-mono text-xs uppercase tracking-widest">
                Drag & drop or click to browse
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <div className="flex items-center justify-between bg-[#F5F5F5] p-4 border border-[#141414]">
                <div className="flex items-center gap-3 overflow-hidden">
                  <File className="w-5 h-5 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-mono text-xs font-bold truncate">{file.name}</p>
                    <p className="font-mono text-[10px] opacity-50">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                    className="p-1 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {file && (
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading || status === 'success'}
            className={`
              w-full py-3 font-mono text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all
              ${status === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-[#141414] text-[#E4E3E0] hover:bg-opacity-90 disabled:opacity-50'}
            `}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Success
              </>
            ) : (
              'Initialize Upload'
            )}
          </button>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600 font-mono text-[10px] uppercase bg-red-50 p-2 border border-red-100">
              <AlertCircle className="w-3 h-3" />
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
