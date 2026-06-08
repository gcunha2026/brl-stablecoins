"use client";

import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const REPORTS_URL = "https://reports.fintrender.com";
const WORK_URL = "https://reports.fintrender.com/work-with-us";
const SITE_URL = "https://fintrender.com";

// Header visual e estruturalmente igual ao de reports.fintrender.com:
//
// Linha 1 (top bar): TRUE full-bleed da viewport. F na borda esquerda,
//   "Fintrender" no centro absoluto da viewport, controles na borda direita.
//
// Linha 2 (nav): wrapper full-bleed (border-bottom corre a tela inteira),
//   nav-inner e' coluna estreita centralizada. Items: Reports / Fintrender.com /
//   Together / BRLStablecoins (este ultimo ativo, e' a propria pagina).
export default function Header() {
  const pathname = usePathname() ?? "/";
  const isBrlStables = pathname === "/" || pathname.startsWith("/stablecoin") || pathname.startsWith("/methodology");
  return (
    <header className="topbar">
      <div className="row main">
        <a className="brand-mark" href={SITE_URL} aria-label="Fintrender">
          <span className="mark-bg">
            <img
              className="mark"
              src="/brand/mark.png"
              alt=""
              width={40}
              height={40}
            />
          </span>
        </a>
        <a className="brand-name" href={SITE_URL} aria-label="Fintrender">
          <img
            className="wordmark"
            src="/brand/wordmark.png"
            alt="Fintrender"
            width={377}
            height={72}
          />
        </a>
        <div className="controls">
          <ThemeToggle />
        </div>
      </div>

      <div className="nav-wrap">
        <nav className="nav-inner" aria-label="Primary">
          <a className="nav-item" href={REPORTS_URL} target="_blank" rel="noopener">
            Reports
          </a>
          <a className="nav-item" href={SITE_URL} target="_blank" rel="noopener">
            Fintrender.com
          </a>
          <a className="nav-item" href={WORK_URL} target="_blank" rel="noopener">
            Together
          </a>
          <a
            className={`nav-item ${isBrlStables ? "active" : ""}`}
            href="/"
            aria-current={isBrlStables ? "page" : undefined}
          >
            BRLStablecoins
          </a>
        </nav>
      </div>

      <style jsx>{`
        .topbar {
          display: flex;
          flex-direction: column;
        }

        .row.main {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 23px 20px;
          border-bottom: 1px solid var(--hairline);
        }
        .brand-mark {
          justify-self: start;
          display: inline-flex;
          color: var(--fg);
        }
        .brand-mark :global(.mark-bg) {
          width: 40px;
          height: 40px;
          background: var(--ft-branco);
          border-radius: var(--radius-2);
          overflow: hidden;
          display: inline-flex;
          flex-shrink: 0;
        }
        .brand-mark :global(.mark) {
          width: 40px;
          height: 40px;
          object-fit: cover;
          display: block;
        }
        .brand-name {
          justify-self: center;
          display: inline-flex;
          align-items: center;
          color: var(--fg);
          text-decoration: none;
        }
        .brand-name :global(.wordmark) {
          max-height: 36px;
          width: auto;
          height: auto;
          display: block;
          object-fit: contain;
        }
        :global([data-theme="dark"]) .brand-name :global(.wordmark) {
          filter: invert(1) hue-rotate(180deg);
        }
        .controls {
          justify-self: end;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .nav-wrap {
          border-bottom: 1px solid var(--hairline);
        }
        .nav-inner {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          gap: 0;
          padding: 0 20px;
          min-height: 48px;
        }
        .nav-item {
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0;
          color: var(--fg-muted);
          text-decoration: none;
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          padding: 0 12px;
          border-radius: 4px 4px 0 0;
          border-bottom: 3px solid transparent;
          transition: color 0.15s ease, background-color 0.15s ease;
        }
        .nav-item:hover {
          color: var(--fg);
          background-color: rgba(32, 32, 32, 0.06);
        }
        .nav-item.active {
          color: var(--fg);
          font-weight: 700;
          border-bottom-color: currentColor;
        }
        .nav-item.active:hover {
          background-color: rgba(32, 32, 32, 0.06);
        }

        @media (max-width: 760px) {
          .row.main {
            grid-template-columns: auto 1fr auto;
            gap: 12px;
            padding: 16px 16px;
          }
          .brand-mark :global(.mark-bg),
          .brand-mark :global(.mark) {
            width: 32px;
            height: 32px;
          }
          .brand-name :global(.wordmark) {
            max-height: 28px;
          }
          .nav-inner {
            gap: 0;
            overflow-x: auto;
            justify-content: flex-start;
            padding: 0 16px;
            min-height: 44px;
          }
          .nav-item {
            white-space: nowrap;
            font-size: 14px;
            min-height: 44px;
            padding: 0 10px;
          }
        }
      `}</style>
    </header>
  );
}
