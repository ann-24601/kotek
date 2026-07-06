import type { Metadata, Viewport } from "next";
import { Shantell_Sans, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppFrame } from "@/components/AppFrame";
import { RoughDefs } from "@/components/RoughDefs";

const shantell = Shantell_Sans({
  subsets: ["latin-ext"],
  variable: "--font-shantell",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kotek",
  description:
    "Kotek — codzienny coach rytuału kota i wirtualny behawiorysta. Poluj, jedz, myj się, śpij.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${shantell.variable} ${poppins.variable}`}>
      <body>
        <a href="#tresc" className="sr-only">
          Przejdź do treści
        </a>
        <RoughDefs />
        <Providers>
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}
