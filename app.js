(() => {
  const STORAGE_READS = "morning-bible-reads";
  const STORAGE_CACHE = "morning-bible-cache";
  const STORAGE_SIZE = "morning-bible-size";

  const dateLabel = document.getElementById("date-label");
  const themeEl = document.getElementById("theme");
  const referenceEl = document.getElementById("reference");
  const statusEl = document.getElementById("status");
  const versesEl = document.getElementById("verses");
  const listenBtn = document.getElementById("listen-btn");
  const copyBtn = document.getElementById("copy-btn");
  const markBtn = document.getElementById("mark-btn");
  const streakEl = document.getElementById("streak");
  const smallerBtn = document.getElementById("smaller-btn");
  const largerBtn = document.getElementById("larger-btn");

  const today = new Date();
  const dateKey = toDateKey(today);
  const passage = passageFor(today);
  let speaking = false;
  let plainText = "";

  dateLabel.textContent = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  themeEl.textContent = passage.theme;
  referenceEl.textContent = passage.ref;

  const savedSize = Number(localStorage.getItem(STORAGE_SIZE) || 1.2);
  setTextSize(savedSize);
  refreshReadState();
  loadPassage();

  listenBtn.addEventListener("click", toggleListen);
  copyBtn.addEventListener("click", copyPassage);
  markBtn.addEventListener("click", toggleRead);
  smallerBtn.addEventListener("click", () => setTextSize(currentSize() - 0.08));
  largerBtn.addEventListener("click", () => setTextSize(currentSize() + 0.08));
  window.addEventListener("beforeunload", stopSpeech);

  function passageFor(date) {
    const start = Date.UTC(date.getFullYear(), 0, 0);
    const now = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOfYear = Math.floor((now - start) / 86400000);
    const list = window.MORNING_PASSAGES;
    return list[(dayOfYear - 1) % list.length];
  }

  function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  async function loadPassage() {
    const cached = readCache();
    if (cached && cached.dateKey === dateKey && cached.ref === passage.ref) {
      renderVerses(cached.verses);
      return;
    }

    statusEl.textContent = "Loading today’s reading…";
    statusEl.classList.remove("error");
    versesEl.hidden = true;

    const url = `https://bible-api.com/${encodeURIComponent(passage.ref)}?translation=web`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Could not load the passage.");
      }
      const data = await response.json();
      const verses = (data.verses || []).map((verse) => ({
        n: verse.verse,
        t: verse.text.trim(),
      }));
      if (!verses.length && data.text) {
        verses.push({ n: null, t: String(data.text).trim() });
      }
      if (!verses.length) {
        throw new Error("The passage was empty.");
      }
      writeCache({ dateKey, ref: passage.ref, verses });
      renderVerses(verses);
    } catch (error) {
      statusEl.textContent =
        "The reading could not be loaded. Check your internet connection and refresh the page.";
      statusEl.classList.add("error");
    }
  }

  function renderVerses(verses) {
    versesEl.replaceChildren();
    plainText = verses
      .map((verse) => (verse.n ? `${verse.n} ${verse.t}` : verse.t))
      .join(" ");

    for (const verse of verses) {
      const p = document.createElement("p");
      p.className = "verse";
      if (verse.n) {
        const num = document.createElement("span");
        num.className = "verse-num";
        num.textContent = String(verse.n);
        p.append(num);
      }
      p.append(document.createTextNode(verse.t));
      versesEl.append(p);
    }

    statusEl.textContent = "";
    versesEl.hidden = false;
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "") || fallback;
    } catch {
      return fallback;
    }
  }

  function readCache() {
    return readJson(STORAGE_CACHE, null);
  }

  function writeCache(value) {
    localStorage.setItem(STORAGE_CACHE, JSON.stringify(value));
  }

  function reads() {
    return readJson(STORAGE_READS, {});
  }

  function refreshReadState() {
    const map = reads();
    const isRead = Boolean(map[dateKey]);
    markBtn.textContent = isRead ? "Read today" : "Mark as read";
    markBtn.setAttribute("aria-pressed", String(isRead));

    const keys = Object.keys(map)
      .filter((key) => map[key])
      .sort();
    const streak = currentStreak(keys, dateKey);
    if (streak > 0) {
      streakEl.textContent = `You have read ${streak} morning${streak === 1 ? "" : "s"} in a row.`;
    } else {
      streakEl.textContent = "Mark the passage when you finish. Tomorrow a new reading will wait here.";
    }
  }

  function currentStreak(sortedKeys, todayKey) {
    if (!sortedKeys.length) return 0;
    const set = new Set(sortedKeys);
    let cursor = set.has(todayKey) ? todayKey : previousDate(todayKey);
    if (!set.has(cursor)) return 0;
    let count = 0;
    while (set.has(cursor)) {
      count += 1;
      cursor = previousDate(cursor);
    }
    return count;
  }

  function previousDate(key) {
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  }

  function toggleRead() {
    const map = reads();
    map[dateKey] = !map[dateKey];
    localStorage.setItem(STORAGE_READS, JSON.stringify(map));
    refreshReadState();
  }

  function toggleListen() {
    if (!plainText) return;
    if (speaking) {
      stopSpeech();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(`${passage.ref}. ${plainText}`);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    const voices = speechSynthesis.getVoices();
    const english = voices.find((voice) => voice.lang.startsWith("en"));
    if (english) utterance.voice = english;
    utterance.onend = () => {
      speaking = false;
      listenBtn.textContent = "Listen";
      listenBtn.setAttribute("aria-pressed", "false");
    };
    speaking = true;
    listenBtn.textContent = "Stop";
    listenBtn.setAttribute("aria-pressed", "true");
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

  function stopSpeech() {
    speechSynthesis.cancel();
    speaking = false;
    listenBtn.textContent = "Listen";
    listenBtn.setAttribute("aria-pressed", "false");
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
    copyBtn.textContent = copied ? "Copied" : "Copy failed";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1600);
  }

  function copyWithTextarea(text) {
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

  function currentSize() {
    return Number(getComputedStyle(document.documentElement).getPropertyValue("--text-size").replace("rem", "")) || 1.2;
  }

  function setTextSize(size) {
    const next = Math.min(1.7, Math.max(1.05, Number(size.toFixed(2))));
    document.documentElement.style.setProperty("--text-size", `${next}rem`);
    localStorage.setItem(STORAGE_SIZE, String(next));
  }
})();
