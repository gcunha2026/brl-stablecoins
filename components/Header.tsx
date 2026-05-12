import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="flex items-center justify-between pb-[18px] border-b-[1.5px] border-line-2">
      <a className="flex items-center gap-3 text-ink" href="/">
        <svg
          className="h-7 w-[30px]"
          viewBox="0 0 158.23 148.85"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M37.15,50.22l-37.15.04v34.14c22.07-.61,36.45-13.86,37.15-34.18Z" />
          <path d="M37.2,10.34v22.29h39.5l43.45-.05c22.98-2.11,35.82-14.83,38.06-32.33l.03-.2-110.55-.04c-2.81,0-5.44,1.08-7.42,3.04-1.97,1.95-3.06,4.55-3.06,7.3Z" />
          <path d="M113.99,50.26l-36.44-.04c-.59,22.88-16.63,36.99-40.41,37.73l.06,60.91c29.41-4.81,32.52-16.94,32.52-42.98l-.03-21.55,3.96.15c20.09.73,36.82-14.92,40.33-34.22Z" />
        </svg>
        <span className="text-[20px] font-semibold tracking-[-0.025em] text-ink">
          Fintrender
        </span>
      </a>
      <nav className="flex items-center gap-7 font-mono text-[12px] uppercase tracking-[0.18em] text-muted">
        <a
          href="https://fintrender.com"
          className="text-ink-3 transition-colors hover:text-accent hidden sm:inline"
        >
          fintrender.com
        </a>
        <span className="text-accent">BRL Stablecoins</span>
        <a
          href="mailto:contato@fintrender.com"
          className="text-ink-3 transition-colors hover:text-accent"
        >
          Contact
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
