import { AppConfig } from '../types';
import { Database, FolderOpen, Terminal } from 'lucide-react';

interface HeaderProps {
  config: AppConfig;
}

export function Header({ config }: HeaderProps) {
  return (
    <header className="border-bottom border-[#141414] bg-[#E4E3E0] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#141414]">
        <div className="flex items-center gap-3">
          <div className="bg-[#141414] p-2">
            <Terminal className="w-5 h-5 text-[#E4E3E0]" />
          </div>
          <div>
            <h1 className="font-bold text-lg uppercase tracking-tighter leading-none">
              TechMentor File Manager
            </h1>
            <p className="font-mono text-[10px] uppercase opacity-50 tracking-widest mt-1">
              Mission Control / Storage Interface
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 opacity-40" />
            <div className="flex flex-col">
              <span className="font-mono text-[9px] uppercase opacity-40 leading-none">Project</span>
              <span className="font-mono text-xs font-bold">{config.projectName || 'NOT_SET'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 opacity-40" />
            <div className="flex flex-col">
              <span className="font-mono text-[9px] uppercase opacity-40 leading-none">Bucket</span>
              <span className="font-mono text-xs font-bold">{config.bucketName || 'NOT_SET'}</span>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-[#141414] opacity-10 hidden md:block" />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.hasApiKey ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-mono text-[10px] uppercase tracking-wider">
              {config.hasApiKey ? 'API_CONNECTED' : 'API_DISCONNECTED'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
