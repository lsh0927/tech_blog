export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--bg-tertiary)] mt-16">
      <div className="container-wide py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left - Brand */}
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <circle cx="19" cy="5" r="2" />
              <circle cx="5" cy="19" r="2" />
              <line x1="14.5" y1="9.5" x2="17.5" y2="6.5" />
              <line x1="9.5" y1="14.5" x2="6.5" y2="17.5" />
            </svg>
            <span className="text-sm">
              Tech Notes &copy; {currentYear}
            </span>
          </div>

          {/* Center - Links */}
          <div className="flex items-center gap-4 text-sm">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              GitHub
            </a>
            <span className="text-[var(--bg-tertiary)]">|</span>
            <a
              href="/rss.xml"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              RSS
            </a>
          </div>

          {/* Right - Built with */}
          <div className="text-sm text-[var(--text-muted)]">
            Powered by{' '}
            <a
              href="https://astro.build"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-primary)] hover:underline"
            >
              Astro
            </a>
            {' '}&{' '}
            <a
              href="https://openai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-primary)] hover:underline"
            >
              OpenAI
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
