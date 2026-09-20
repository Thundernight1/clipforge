import Link from "next/link";
import { Sparkles } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.78_0.14_200)] text-white shadow-md shadow-primary/30">
            <Sparkles className="size-4" />
          </span>
          <span>
            Clip<span className="text-primary">Forge</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <a href="/#features" className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground sm:inline">Features</a>
          <a href="/#pricing" className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground sm:inline">Pricing</a>
          <Link href="/create/" className="btn-primary !py-1.5 !text-xs sm:!text-sm">Create clips</Link>
        </nav>
      </div>
    </header>
  );
}
