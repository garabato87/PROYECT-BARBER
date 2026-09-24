import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-surface border border-glass-border rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center"
      >
        <div className="absolute top-[-20%] left-[-10%] h-[200px] w-[200px] rounded-full bg-danger/10 blur-[80px]" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-danger/10 text-danger rounded-2xl flex items-center justify-center mb-6 shadow-glow-danger">
            <AlertTriangle size={32} />
          </div>
          
          <h1 className="font-heading text-2xl font-bold text-foreground mb-3 tracking-tight">
            Algo salió mal
          </h1>
          
          <p className="text-text-secondary text-sm mb-8 leading-relaxed">
            Tuvimos un problema inesperado al cargar esta sección. Verificá tu conexión a internet o intentá nuevamente en unos minutos.
          </p>

          {/* En desarrollo, podríamos mostrar el error técnico, pero en prod no */}
          {import.meta.env.DEV && error && (
            <div className="w-full bg-black/50 border border-danger/20 rounded-xl p-4 mb-8 text-left overflow-auto max-h-32">
              <p className="text-xs font-mono text-danger/80">{error.message}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {resetErrorBoundary && (
              <button
                onClick={resetErrorBoundary}
                className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-on-primary py-3 px-4 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-4 focus:ring-accent/30 shadow-lg"
              >
                <RefreshCw size={18} />
                Reintentar
              </button>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-hover border border-glass-border hover:border-text-muted/30 text-foreground py-3 px-4 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-4 focus:ring-glass-border shadow-sm"
            >
              <Home size={18} />
              Ir al inicio
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
