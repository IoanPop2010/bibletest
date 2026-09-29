"use client";

import { currentStreak, passageFor, toDateKey } from "@/lib/reading";
import { useEffect, useMemo, useState } from "react";

const STORAGE_READS = "morning-bible-reads";
const STORAGE_CACHE = "morning-bible-cache";
const STORAGE_SIZE = "morning-bible-size";

type Verse = { n: number | null; t: string };

export function MorningReading() {
  const today = useMemo(() => new Date(), []);
  const dateKey = toDateKey(today);
  const passage = passageFor(today);
  const [status, setStatus] = useState("Loading today’s reading…");
  const [error, setError] = useState(false);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isRead, setIsRead] = useState(false);
  const [streak, setStreak] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");

  const dateLabel = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const plainText = verses
    .map((verse) => (verse.n ? `${verse.n} ${verse.t}` : verse.t))
    .join(" ");

  useEffect(() => {
    const savedSize = Number(localStorage.getItem(STORAGE_SIZE) || 1.2);
    setTextSize(savedSize);
    refreshReadState();
    void loadPassage();
    return () => speechSynthesis.cancel();

    async function loadPassage() {
      const cached = readJson<{ dateKey: string; ref: string; verses: Verse[] }>(
        STORAGE_CACHE,
        null,
      );
      if (cached && cached.dateKey === dateKey && cached.ref === passage.ref) {
        setVerses(cached.verses);
        setStatus("");
        setError(false);
        return;
      }

      try {
        const response = await fetch(`/api/passage?ref=${encodeURIComponent(passage.ref)}`);
        const data = (await response.json()) as { verses?: Verse[]; error?: string };
        if (!response.ok || !data.verses?.length) {
          throw new Error(data.error || "Could not load the passage.");
        }
        localStorage.setItem(
          STORAGE_CACHE,
          JSON.stringify({ dateKey, ref: passage.ref, verses: data.verses }),
        );
        setVerses(data.verses);
        setStatus("");
        setError(false);
      } catch {
        setError(true);
        setStatus(
          "The reading could not be loaded. Check your internet connection and refresh the page.",
        );
      }
    }

    function refreshReadState() {
      const map = readJson<Record<string, boolean>>(STORAGE_READS, {});
      const keys = Object.keys(map)
        .filter((key) => map[key])
        .sort();
      setIsRead(Boolean(map[dateKey]));
      setStreak(currentStreak(keys, dateKey));
    }
  }, [dateKey, passage.ref]);

  function toggleRead() {
    const map = readJson<Record<string, boolean>>(STORAGE_READS, {});
    map[dateKey] = !map[dateKey];
    localStorage.setItem(STORAGE_READS, JSON.stringify(map));
    const keys = Object.keys(map)
      .filter((key) => map[key])
      .sort();
    setIsRead(Boolean(map[dateKey]));
    setStreak(currentStreak(keys, dateKey));
  }

  function toggleListen() {
    if (!plainText) return;
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(`${passage.ref}. ${plainText}`);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    const english = speechSynthesis.getVoices().find((voice) => voice.lang.startsWith("en"));
    if (english) utterance.voice = english;
    utterance.onend = () => setSpeaking(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  async function copyPassage() {
    if (!plainText) return;
    const text = `${passage.ref}\n${passage.theme}\n\n${plainText}`;
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = copyWithTextarea(text);
    }
    setCopyLabel(copied ? "Copied" : "Copy failed");
    window.setTimeout(() => setCopyLabel("Copy"), 1600);
  }

  return (
    <>
      <div className="top">
        <p className="eyebrow">Morning reading</p>
        <h1>Today’s passage</h1>
        <p className="date">{dateLabel}</p>
      </div>

      <main id="passage" className="sheet" tabIndex={-1}>
        <div className="meta">
          <p className="theme">{passage.theme}</p>
          <h2>{passage.ref}</h2>
          <p className="translation">World English Bible · English</p>
        </div>

        <div className={error ? "status error" : "status"} role="status" aria-live="polite">
          {status}
        </div>
        {verses.length > 0 && (
          <article className="verses">
            {verses.map((verse) => (
              <p className="verse" key={`${verse.n}-${verse.t.slice(0, 24)}`}>
                {verse.n ? <span className="verse-num">{verse.n}</span> : null}
                {verse.t}
              </p>
            ))}
          </article>
        )}

        <div className="toolbar">
          <button type="button" className="btn" aria-pressed={speaking} onClick={toggleListen}>
            {speaking ? "Stop" : "Listen"}
          </button>
          <button type="button" className="btn" onClick={() => void copyPassage()}>
            {copyLabel}
          </button>
          <button
            type="button"
            className="btn primary"
            aria-pressed={isRead}
            onClick={toggleRead}
          >
            {isRead ? "Read today" : "Mark as read"}
          </button>
        </div>

        <div className="controls" role="group" aria-label="Text size">
          <button
            type="button"
            className="icon-btn"
            aria-label="Smaller text"
            onClick={() => setTextSize(currentSize() - 0.08)}
          >
            A−
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Larger text"
            onClick={() => setTextSize(currentSize() + 0.08)}
          >
            A+
          </button>
        </div>
      </main>

      <section className="footer-card" aria-label="Reading progress">
        <p>
          {streak > 0
            ? `You have read ${streak} morning${streak === 1 ? "" : "s"} in a row.`
            : "Mark the passage when you finish. Tomorrow a new reading will wait here."}
        </p>
        <p className="hint">
          Pasajul se schimbă o dată pe zi. Textul este în engleză, pentru lectură de dimineață.
        </p>
      </section>
    </>
  );
}

function readJson<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key) || "") as T) || fallback;
  } catch {
    return fallback;
  }
}

function currentSize() {
  return (
    Number(
      getComputedStyle(document.documentElement).getPropertyValue("--text-size").replace("rem", ""),
    ) || 1.2
  );
}

function setTextSize(size: number) {
  const next = Math.min(1.7, Math.max(1.05, Number(size.toFixed(2))));
  document.documentElement.style.setProperty("--text-size", `${next}rem`);
  localStorage.setItem(STORAGE_SIZE, String(next));
}

function copyWithTextarea(text: string) {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.append(field);
  field.select();
  const ok = document.execCommand("copy");
  field.remove();
  return ok;
}
