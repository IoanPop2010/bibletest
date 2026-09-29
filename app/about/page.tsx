import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "A daily English Bible reading for the morning.",
};

export default function AboutPage() {
  return (
    <main id="passage" className="sheet about-sheet">
      <p className="theme">About this site</p>
      <h1>A passage for each morning</h1>
      <p>
        Morning Passage is a small website that shows one Bible reading in English every
        calendar day. The text uses the World English Bible, a public-domain translation.
      </p>
      <p>
        Open the site each morning, read the passage, listen if you want, then mark it as
        read. Tomorrow a new reading will be waiting.
      </p>
      <p className="translation">
        Site-ul e făcut pentru GitHub și Vercel. Pasajul rămâne în engleză; interfața e
        simplă, ca să poți citi în liniște.
      </p>
    </main>
  );
}
