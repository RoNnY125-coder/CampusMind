"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
          <div className="max-w-md w-full p-6 rounded-2xl border border-blue-500/30 bg-gray-900 text-center">
            <AlertTriangle className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h2 className="text-white text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-400 text-sm mb-6">CampusMind hit an unexpected error while rendering this page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg text-white font-medium bg-gradient-blue shadow-glow-blue hover:shadow-glow-blue-lg transition-all"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
