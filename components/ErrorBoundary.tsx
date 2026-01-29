
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Fixed: Explicitly import Component and extend it with generic types to ensure 'state' and 'props' are correctly typed and recognized
export class ErrorBoundary extends Component<Props, State> {
  // Fixed: Initializing state in the constructor and calling super(props) ensures the component is properly set up
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Optional: Log to error reporting service
  }

  private handleReload = () => {
    localStorage.clear(); // Clear bad cache
    window.location.reload();
  };

  public render() {
    // Fixed: Correctly accessing 'state' property which is now recognized due to direct inheritance from Component<Props, State>
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <AlertCircle size={48} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Xatolik yuz berdi</h1>
          <p className="text-zinc-400 text-sm mb-8 max-w-xs mx-auto">
            Sayt yuklanishida muammo paydo bo'ldi. Internetni tekshiring yoki keshni tozalab qayta urining.
          </p>
          <div className="p-4 bg-zinc-900 rounded-lg border border-red-900/30 mb-6 max-w-md w-full overflow-hidden">
             {/* Fixed: Accessing 'error' from state correctly */}
             <p className="text-xs text-red-400 font-mono break-all">{this.state.error?.message}</p>
          </div>
          <button 
            onClick={this.handleReload}
            className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
          >
            <RefreshCw size={18} /> Qayta Yuklash
          </button>
        </div>
      );
    }

    // Fixed: Accessing 'children' from 'this.props' which is now correctly recognized by the TypeScript compiler
    return this.props.children;
  }
}
