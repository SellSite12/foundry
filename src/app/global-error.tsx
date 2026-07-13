"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0C0A09", color: "#EFE9DF" }}>
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Application error</h1>
          <p style={{ color: "#B8AFA0", marginBottom: 24, maxWidth: 400 }}>
            A critical error occurred. Please refresh the page or try again later.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ padding: "10px 20px", borderRadius: 9999, border: "none", background: "#E8A33D", color: "#0C0A09", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
