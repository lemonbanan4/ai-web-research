"use client";

import Image from "next/image";
import Link from "next/link";
import NavBar from "../components/NavBar";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar />
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.15)_0,transparent_30%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.15)_0,transparent_30%),radial-gradient(circle_at_50%_70%,rgba(14,165,233,0.15)_0,transparent_30%)]" />

      <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
        {/* Header */}
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          AI Web Research Agent
        </h1>
        <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
          A fully automated research engine that searches the web, analyses sources, 
          extracts clean articles, generates screenshots, and produces structured AI summaries.
        </p>

        {/* CTA */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/"
            className="rounded-xl bg-amber-400 text-slate-950 px-6 py-3 font-semibold text-base shadow-lg hover:brightness-110 transition"
          >
            Try the Live App
          </Link>

          <a
            href="https://github.com/lemonbanan4/ai-web-research"
            target="_blank"
            className="rounded-xl border border-slate-700 px-6 py-3 text-base font-semibold hover:bg-slate-800 transition"
          >
            View Code
          </a>
        </div>

        {/* Screenshot */}
        <div className="mt-16">
          <Image
            src="/screenshot-hero.png"
            width={1100}
            height={700}
            alt="AI Web Research"
            className="rounded-2xl border border-slate-800 shadow-xl"
          />
        </div>

        {/* Feature grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Real Web Search",
              desc: "DuckDuckGo-powered search for accurate, unbiased sources.",
            },
            {
              title: "Live Browser Crawling",
              desc: "Playwright loads pages and captures full-page screenshots.",
            },
            {
              title: "Article Extraction",
              desc: "Readability.js cleans content for high-quality summaries.",
            },
            {
              title: "AI Summaries",
              desc: "Powered by OpenAI for structured, multi-source insights.",
            },
            {
              title: "PDF Export",
              desc: "Download a polished research report with a single click.",
            },
            {
              title: "Source Reliability",
              desc: "Each link gets a trust score for credibility filtering.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow"
            >
              <h3 className="text-lg font-semibold text-amber-300">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-24 text-sm text-slate-500">
          Built by Lemonbanan4 — Powered by Next.js, FastAPI, Playwright, and OpenAI.
        </footer>
      </div>
    </main>
  );
}
