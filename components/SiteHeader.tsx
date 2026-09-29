"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <Link className="brand" href="/">
        Morning Passage
      </Link>
      <nav aria-label="Site">
        <Link className={pathname === "/" ? "active" : undefined} href="/">
          Today
        </Link>
        <Link className={pathname === "/about" ? "active" : undefined} href="/about">
          About
        </Link>
      </nav>
    </header>
  );
}
