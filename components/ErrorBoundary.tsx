import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch rendering errors in child components.
 */
// Explicitly use React.Component from React for proper inheritance in TypeScript.
// Added React. prefix to ensure inheritance is correctly typed by the compiler.
export class ErrorBoundary extends React.Component<Props, State> {
  // Defining the state property with its types for strict mode compliance.
  public state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
  }

  // Update state when an error occurs
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  // Clear bad application state/cache and reload the page
  private handleReload = () => {
    localStorage.clear(); // Clear bad cache
    window.location.reload();
  };

  public render(): ReactNode {
    // FIX: Using 'this' context explicitly on state and props within a class component.
    // TypeScript occasionally fails to infer 'props' existence if the class definition is ambiguous.
    const { hasError, error } = this.state;
    const { children } = this.props;

    // Check for error state to display fallback UI
    if (hasError) {
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
             <p className="text-xs text-red-400 font-mono break-all">{error?.message}</p>
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

    // Returning children if no error occurred.
    return children;
  }
}