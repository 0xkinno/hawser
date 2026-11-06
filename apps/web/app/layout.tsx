import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Nav } from "../components/Nav";
import { bundles } from "../lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: "HAWSER: every minute in port, agreed before she sails",
  description:
    "One Switch room where a ship's master, a port agent and a charterer, and their three AI agents, agree every minute in port and sign the Statement of Facts before the ship sails. People and companies shown are fictional.",
  openGraph: {
    title: "HAWSER: every minute in port, agreed before she sails",
    description: "One Switch room, three companies, one signed Statement of Facts.",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "A bulk carrier at anchor at sunset, a brass ship's clock and a deck log book in the foreground",
      },
    ],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  const first = bundles()[0];
  const callHref = first ? `/call/${first.id}` : "/judge";
  return (
    <html lang="en" data-theme="light">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Nav callHref={callHref} />
        <main id="main">{children}</main>
        <footer className="footer">
          <div className="wrap">
            <p>
              Built on <a href="https://github.com/sandbox-quantum/switch">Switch</a>. Open source under the
              MIT licence. People, companies and vessels in the demonstration are fictional. The hero image
              was generated for this project.
            </p>
            <p>
              <Link href="/judge">For judges</Link> · <Link href="/findings">Findings on Switch</Link> ·{" "}
              <Link href="/verify">Verify a run</Link> ·{" "}
              <a href="https://github.com/0xkinno/hawser">Repository</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
