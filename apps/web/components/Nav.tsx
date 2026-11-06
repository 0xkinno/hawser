"use client";
import Link from "next/link";
import { useState } from "react";
import { Bollard } from "./art";

export function Nav({ callHref }: { callHref: string }) {
  const [open, setOpen] = useState(false);
  return (
    <nav className={`nav${open ? " open" : ""}`} aria-label="Main" data-qa="nav">
      <Link href="/" className="brand" onClick={() => setOpen(false)}>
        <Bollard width={28} height={28} aria-hidden="true" />
        <span>HAWSER</span>
      </Link>
      <ul>
        <li>
          <Link href="/#how">How it works</Link>
        </li>
        <li>
          <Link href="/#room">The room</Link>
        </li>
        <li>
          <Link href="/#proof">Proof</Link>
        </li>
        <li>
          <Link href="/verify">Verify</Link>
        </li>
        <li>
          <Link href="/judge">For judges</Link>
        </li>
      </ul>
      <button type="button" className="btn menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Menu
      </button>
      <Link href={callHref} className="btn primary">
        Open the port call
      </Link>
    </nav>
  );
}
