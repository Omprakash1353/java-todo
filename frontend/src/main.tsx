import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { InboxPage } from "./App.tsx";
import { QueryProvider } from "./context/query-provider.tsx";
import { ThemeProvider } from "./context/theme-provider.tsx";
import "./index.css";

function ErrorFallback({ error }: { error: Error }) {
  return <div>Error: {error.message}</div>;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <ThemeProvider>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<div>Loading...</div>}>
            <InboxPage />
          </Suspense>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryProvider>
  </React.StrictMode>
);
