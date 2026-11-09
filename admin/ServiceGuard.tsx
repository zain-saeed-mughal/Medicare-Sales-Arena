import { Component, type ReactNode } from "react";
import { retryService, useServiceIssue } from "./service";

export class RenderGuard extends Component<{children: ReactNode}, {error: string}> {
  state = {error: ""};
  static getDerivedStateFromError(error: Error) { return {error: error.message}; }
  componentDidCatch(error: Error) { console.error("Arena rendering failed", error); }
  render() {
    if (this.state.error) return <main style={{padding: "8vw", color: "#fff3df", background: "#160309", minHeight: "100vh"}}><h1>Arena could not render this view</h1><p role="alert">{this.state.error}</p><p>Your saved data has not been reset.</p><button onClick={() => location.reload()}>Reload application</button></main>;
    return this.props.children;
  }
}

/** Never mount ledger consumers against fallback data after a read failure. */
export function ServiceGuard({ children }: { children: ReactNode }) {
  const issue = useServiceIssue();
  if (!issue) return <RenderGuard>{children}</RenderGuard>;
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#160309",
        color: "#fff3df",
        padding: "8vw",
        boxSizing: "border-box",
      }}
    >
      <h1>Arena data needs attention</h1>
      <p role="alert">{issue}</p>
      <p>
        Your saved ledger has not been reset. Restore access to browser storage
        or correct the saved configuration, then retry.
      </p>
      <button onClick={retryService}>Retry saved data</button>
    </main>
  );
}
