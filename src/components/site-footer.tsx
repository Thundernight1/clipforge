import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="font-semibold">
            Clip<span className="text-primary">Forge</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Own-brand freemium clip studio. Ollama Cloud clip ideas · mock fallback without API key · no FFmpeg encode yet.
          </p>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <Link href="/create/" className="hover:text-foreground">Create</Link>
          <a href="/#pricing" className="hover:text-foreground">Pricing</a>
        </div>
      </div>
    </footer>
  );
}
