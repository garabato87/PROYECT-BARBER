import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ui/ErrorFallback';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Actualiza el estado para que el siguiente renderizado muestre la UI de fallback
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Aquí podríamos registrar el error en Sentry, Crashlytics, etc.
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  public resetErrorBoundary = () => {
    // Limpia el estado de error y fuerza a re-renderizar los hijos
    this.setState({ hasError: false, error: null });
  }

  public render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error!} resetErrorBoundary={this.resetErrorBoundary} />;
    }

    return this.props.children;
  }
}
