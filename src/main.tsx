import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { TextScaleProvider } from "./context/TextScaleContext.tsx";
import { ColorSchemeProvider } from "./context/ColorSchemeContext.tsx";
import "./index.css";

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  declare props: Readonly<{ children: React.ReactNode }>;
  declare setState: (state: Partial<ErrorBoundaryState>) => void;
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "Unexpected rendering issue",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Recovered from UI error:", error, info);
  }

  handleRecover = () => {
    try {
      // Clear any potentially corrupted table width keys before recovering
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("table_widths_")) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-indigo-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-indigo-950/80 border border-indigo-700/80 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <h2 className="text-lg font-bold text-white">Display Restored</h2>
            <p className="text-xs text-indigo-300">
              A layout state conflict was detected and automatically isolated ({this.state.errorMessage}).
            </p>
            <button
              type="button"
              onClick={this.handleRecover}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Restore View
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <ColorSchemeProvider>
        <TextScaleProvider>
          <App />
        </TextScaleProvider>
      </ColorSchemeProvider>
    </AppErrorBoundary>
  </StrictMode>
);
