import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoPilot — AI GitHub Repository Analysis",
  description:
    "Analyze public GitHub repositories with AI-powered code quality, security, testing, documentation, and maintainability insights.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <nav
            aria-label="Main navigation"
            className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4"
          >
            <a href="/" className="text-xl font-bold tracking-tight">
              RepoPilot
            </a>
            <div className="flex items-center gap-4 text-sm">
              <a
                href="/docs"
                className="text-slate-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                Documentation
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                View on GitHub
              </a>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-500">
          <p>
            RepoPilot is an open-source project for analyzing public GitHub
            repositories.
          </p>
        </footer>
      </body>
    </html>
  );
}
