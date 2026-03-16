import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
  stack?: string;
}

class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AppErrorBoundary", error, errorInfo);
    this.setState({
      errorMessage: error.message,
      stack: error.stack || errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center space-y-2">
            <h1 className="text-2xl font-bold">Erro ao carregar a aplicacao</h1>
            <p className="text-sm text-muted-foreground">
              Recarregue a pagina. Se persistir, revise as variaveis de ambiente VITE do Supabase.
            </p>
            {import.meta.env.DEV && this.state.errorMessage ? (
              <pre className="text-left text-xs bg-muted/40 rounded-xl p-3 overflow-auto mt-3">
                {this.state.errorMessage}
                {"\n"}
                {this.state.stack}
              </pre>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
