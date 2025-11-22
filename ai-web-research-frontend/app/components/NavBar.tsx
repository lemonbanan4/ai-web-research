"use client";

import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="w-full border-b border-slate-800 bg-slate-950/60 backdrop-blur px-6 py-4 flex items-center justify-between">
      <Link href="/landing" className="text-lg font-semibold text-amber-300 hover:text-amber-200">
        AI Web Research Agent
      </Link>

      <div className="flex gap-6 text-slate-300 text-sm">
        <Link href="/landing" className="hover:text-amber-300 transition">
          Home
        </Link>
        <Link href="/" className="hover:text-amber-300 transition">
          App
        </Link>
      </div>
    </nav>
  );
}
