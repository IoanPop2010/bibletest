import { isKnownPassage } from "@/lib/reading";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const ref = new URL(request.url).searchParams.get("ref");
  if (!ref || !isKnownPassage(ref)) {
    return NextResponse.json({ error: "Unknown passage." }, { status: 400 });
  }

  const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=web`;
  const response = await fetch(url, { next: { revalidate: 86400 } });

  if (!response.ok) {
    return NextResponse.json({ error: "Could not load the passage." }, { status: 502 });
  }

  const data = (await response.json()) as {
    verses?: Array<{ verse: number; text: string }>;
    text?: string;
  };

  const verses = (data.verses ?? []).map((verse) => ({
    n: verse.verse,
    t: verse.text.trim(),
  }));

  if (!verses.length && data.text) {
    verses.push({ n: null, t: String(data.text).trim() });
  }

  if (!verses.length) {
    return NextResponse.json({ error: "The passage was empty." }, { status: 502 });
  }

  return NextResponse.json({ verses });
}
