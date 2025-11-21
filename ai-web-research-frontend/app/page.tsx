"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "isomorphic-dompurify";


type SourceSummary = {
  url: string;
  title: string;
  snippet: string;
  screenshot?: string;
  reliability?: number;
};

type ResearchResponse = {
  task_id: string;
  query: string;
  summary: string;
  sources: SourceSummary[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const POLL_INTERVAL_MS = 1200;


function LemonBadge() {
  return (
    <div className="inline-flex items-center rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-500/10 via-lime-400/10 to-emerald-900/20 p-3 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
      <div className="relative h-12 w-12">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-lime-200 via-emerald-300 to-emerald-600 blur-md opacity-80" />
        <svg
          viewBox="0 0 60 60"
          className="relative h-full w-full drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]"
        >
          <defs>
            <linearGradient id="lemonNeon" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d9f99d" />
              <stop offset="50%" stopColor="#a3e635" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <circle cx="30" cy="30" r="26" fill="url(#lemonNeon)" stroke="#bbf7d0" strokeWidth="2" />
          <circle cx="30" cy="30" r="18" fill="#ecfccb" stroke="#bef264" strokeWidth="2" />
          <line x1="12" y1="30" x2="48" y2="30" stroke="#065f46" strokeWidth="2" strokeLinecap="round" />
          <line x1="30" y1="12" x2="30" y2="48" stroke="#065f46" strokeWidth="2" strokeLinecap="round" />
          <line x1="17" y1="17" x2="43" y2="43" stroke="#065f46" strokeWidth="2" strokeLinecap="round" />
          <line x1="43" y1="17" x2="17" y2="43" stroke="#065f46" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string[]>([]);
  const summaryContent =
    (result?.summary ?? "").trim() || "_No summary available yet._";
  const sanitizedSummary = DOMPurify.sanitize(String(summaryContent));
  const sources = result?.sources ?? [];
  const hasSources = sources.length > 0;
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingActive = currentTaskId !== null;
  const handleExportPDF = async () => {
    if (!result) return;
    try {
      const res = await fetch(`${API_URL}/export_pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      const data = await res.json();
      if (data?.url) {
        window.open(`${API_URL}${data.url}`, "_blank");
      }
    } catch (exportErr) {
      console.error(exportErr);
      setError("Failed to export PDF");
    }
  };

  useEffect(() => {
    return () => {
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
      }
    };
  }, []);

  const stopPolling = () => {
    if (pollerRef.current) {
      clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
    setCurrentTaskId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress([]);

    try {
      const startRes = await fetch(`${API_URL}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!startRes.ok) {
        throw new Error(`Backend error: ${startRes.status}`);
      }

      const startData = await startRes.json();
      const taskId: string | undefined = startData?.task_id;

      if (!taskId) {
        throw new Error("No task id returned from backend");
      }
      setCurrentTaskId(taskId);

      pollerRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/research/${taskId}`);
          if (!res.ok) {
            throw new Error(`Poll error: ${res.status}`);
          }
          const data = await res.json();
          const stepList: string[] = Array.isArray(data?.steps)
            ? data.steps
            : [];
          setProgress(stepList);

          if (data?.result) {
            if (pollerRef.current) {
              clearInterval(pollerRef.current);
              pollerRef.current = null;
            }
            const finalSources =
              Array.isArray(data.result.sources) &&
              data.result.sources.length > 0
                ? data.result.sources.map((src: SourceSummary & { text?: string }) => ({
                    url: src.url,
                    title: src.title || src.url,
                    snippet:
                      typeof src.text === "string"
                        ? src.text.slice(0, 300)
                        : src.snippet || "",
                    screenshot: src.screenshot,
                  }))
                : [];

            setResult({
              task_id: taskId,
              query,
              summary: data.result.summary ?? "_No summary available yet._",
              sources: finalSources,
            });
            setCurrentTaskId(null);
            setLoading(false);
          }
        } catch (pollErr) {
          console.error(pollErr);
          stopPolling();
          setError("Failed while polling for results");
          setLoading(false);
        }
      }, POLL_INTERVAL_MS);

    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    stopPolling();
    setLoading(false);
    setProgress((steps) => [...steps, "Stopped by user"]);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.12)_0,transparent_32%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.18)_0,transparent_32%),radial-gradient(circle_at_50%_70%,rgba(14,165,233,0.12)_0,transparent_32%)]" />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-12 sm:px-10 lg:px-12">
        <div className="w-full max-w-3xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <LemonBadge />
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
          
                </span>
                <span className="text-sm text-slate-400">
                  
                </span>
                
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-2xl backdrop-blur">
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                AI Web Research Agent
              </h1>
              <p className="text-base text-slate-300 sm:text-lg">
                Ask a question and I&apos;ll sweep the web, pull trusted sources, and
                summarize the key takeaways for you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400/70 focus:border-amber-400/70"
                placeholder="e.g. Current state of AI regulation in the EU"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-indigo-500 px-5 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Researching..." : "Run Research"}
                </button>
                {loading && (
                  <button
                    type="button"
                    onClick={handleStop}
                    disabled={!pollingActive}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 shadow transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    Stop
                  </button>
                )}
              </div>
            </form>

            {loading && (
              <div className="space-y-2 text-sm text-slate-400">
                {progress.map((step, i) =>  (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    {step}
                      </div>
                    ))}
                  </div>
                )}
                <div className="h-2 w-28 rounded-full bg-amber-400/40" />
                <div className="h-2 w-20 rounded-full bg-amber-400/25" />
              </div>

            {error && (
              <div className="rounded-xl border border-red-500/60 bg-red-950/60 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">Summary</h2>
                  <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300">
                    Task #{result.task_id}
                  </span>
                </div>
                <div className="mt-4 space-y-4 text-slate-300 prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {sanitizedSummary}
                  </ReactMarkdown>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleExportPDF}
                    className="px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm"
                  >
                    Download PDF Report
                  </button>
                </div>
              </div>
              

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Sources</h3>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {sources.length} links
                  </span>
                </div>
                {hasSources ? (
                  <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {sources.map((src) => (
                      <li
                        key={src.url}
                        className="group relative rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg transition hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-amber-500/15"
                      >
                        <div className="flex flex-col gap-2">
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-start gap-2 text-lg font-medium text-amber-200 hover:text-amber-100"
                          >
                            <span className="inline-block rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-200">
                              Source
                            </span>
                            <span className="leading-snug">{src.title}</span>
                          </a>
                          <p className="text-sm leading-relaxed text-slate-300">
                            {src.snippet}
                          </p>
                          {typeof src.reliability === "number" && (
                            <span className="text-xs font-semibold text-amber-300">
                              Reliability: {src.reliability}/100
                            </span>
                          )}
                          <p className="break-all text-xs text-slate-500">
                            {src.url}
                          </p>
                          {src.screenshot && (
                            <Image
                              src={`${API_URL}/screenshots/${src.screenshot}`}
                              alt="Screenshot"
                              width={640}
                              height={360}
                              unoptimized
                              className="mt-2 rounded-lg border border-slate-800 shadow-md"
                            />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
                    No sources yet. Try widening the query or re-running the search.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

  );
}
