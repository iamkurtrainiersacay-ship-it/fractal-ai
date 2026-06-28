import { Component } from "react";
import { AlertTriangle } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "grid",
          placeContent: "center",
          minHeight: "300px",
          textAlign: "center",
          gap: "12px",
          padding: "32px"
        }}>
          <AlertTriangle size={40} style={{ margin: "0 auto", color: "var(--amber)" }} />
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "420px" }}>
            {this.state.error?.message || "An unexpected error occurred in this section."}
          </p>
          <button
            className="primary-btn"
            style={{ margin: "0 auto" }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
