import type { Metadata } from "next";
import {
  Roboto,
  Roboto_Mono,
  Space_Grotesk,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

// Fontes oficiais do brand book Fintrender ("Play the NXT*"):
// - Roboto Mono = titulos, metricas, kickers, tags. Sempre -0.04em tracking.
// - Roboto     = corpo, leads, labels, formularios.
// Mantemos Space Grotesk / Instrument Serif / JetBrains Mono pois charts e
// componentes do dashboard ainda referenciam essas variaveis explicitamente.
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto-mono",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BRL Stablecoins | Fintrender",
  description:
    "Real-time analytics dashboard for Brazilian Real (BRL) stablecoins -- supply, volume, chains and DeFi pools.",
};

const themeScript = `(function(){try{var k='fintrender-theme';if(localStorage.getItem(k)==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} ${robotoMono.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Header />
        <div className="frame">
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
