"use client";
import { useEffect, useRef, useState } from "react";

export interface Msg {
  n: number;
  who: string;
  tk: boolean;
  text: string;
  tag?: string;
}

/** Plays the recorded desk room back card by card. Labelled as a replay of a recorded run. */
export function Replay({ messages, label }: { messages: Msg[]; label: string }) {
  const [shown, setShown] = useState(messages.length);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setShown((s) => {
        if (s >= messages.length) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 700);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, messages.length]);
  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            setShown(0);
            setPlaying(true);
          }}
        >
          Replay the call
        </button>
        <span className="cap">
          {playing ? `replaying ${shown} of ${messages.length}` : `showing ${shown} of ${messages.length}`}.{" "}
          {label}
        </span>
      </div>
      <div className="transcript" aria-live="polite" data-qa="transcript">
        {messages.slice(0, shown).map((m) => (
          <div key={m.n} className={`msg card-in${m.tk ? " tk" : ""}`}>
            <div className="who">
              <span>#{m.n}</span>
              <span>{m.who}</span>
              {m.tag ? <span className="tag">{m.tag}</span> : null}
            </div>
            {m.text}
          </div>
        ))}
      </div>
    </div>
  );
}
