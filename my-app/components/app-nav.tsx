"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const base =
  "inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-zinc-950";

const inactive =
  "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

const active =
  "border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900";

export function AppNav() {
  const pathname = usePathname();
  const oneActive = pathname === "/";
  const twoActive = pathname === "/compare";

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Playground mode">
      <Link
        href="/"
        className={`${base} ${oneActive ? active : inactive}`}
        aria-current={oneActive ? "page" : undefined}
      >
        Chat
      </Link>
      <Link
        href="/compare"
        className={`${base} ${twoActive ? active : inactive}`}
        aria-current={twoActive ? "page" : undefined}
      >
        Compare
      </Link>
    </nav>
  );
}
