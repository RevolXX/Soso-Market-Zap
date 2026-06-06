export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 relative z-[1]">
      <div className="container mx-auto flex max-w-screen-xl flex-col items-center gap-2 px-4 py-4 text-[11px] font-mono text-muted-foreground sm:flex-row sm:justify-between sm:gap-4">
        <div className="flex items-center gap-0">
          <svg width="24" height="20" viewBox="0 0 32 28" fill="none" className="shrink-0 -mr-0.5">
            <polyline
              points="2,18 7,18 10,8 13,22 16,4 19,18 24,18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              className="text-primary"
            />
            <circle cx="16" cy="4" r="2" fill="currentColor" className="text-primary" opacity="0.4" />
          </svg>
          <span className="font-bold tracking-wider">
            Soso<span className="text-primary">MarketZap</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            Powered by
            <a
              href="https://sosovalue.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-opacity hover:opacity-80 text-primary"
              title="SoSoValue"
            >
              SoSoValue
            </a>
            <span className="text-muted-foreground">&amp;</span>
            <a
              href="https://sodex.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-opacity hover:opacity-80 text-primary"
              title="SoDEX"
            >
              SoDEX
            </a>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            SoSoValue Buildathon 2026
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
          </span>
        </div>
      </div>
    </footer>
  );
}
