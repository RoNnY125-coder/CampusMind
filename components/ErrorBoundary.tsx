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
        <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <div style={{
            maxWidth: 420,
            width: "100%",
            padding: "32px",
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--border2)",
            background: "rgba(13,13,20,0.75)",
            backdropFilter: "blur(24px)",
            textAlign: "center",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          }}>
            <AlertTriangle size={32} style={{ color: "var(--accent)", margin: "0 auto 12px" }} />
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "18px", color: "var(--text)", marginBottom: "8px" }}>Something went wrong</h2>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "24px", lineHeight: 1.5 }}>CampusMind hit an unexpected error while rendering this page.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
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
