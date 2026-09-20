import type { Config, Context } from "@netlify/functions";

const DEFAULT_HOST = "https://ollama.com";
const DEFAULT_MODEL = "kimi-k3:cloud";

type Clip = {
  id: string;
  title: string;
  startHint: string;
  endHint: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  virality: number;
  caption: string;
};

function hashString(input: string): number {
  let h = 5381;
  const s = input.trim().toLowerCase() || "clipforge-demo";
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TITLE_POOL = [
  "The moment that changes everything",
  "Hot take nobody expected",
  "This tip went viral overnight",
  "Watch until the last 5 seconds",
  "The hook creators steal",
  "Why this story hits so hard",
  "One sentence. Instant scroll-stop.",
  "The payoff after the setup",
];
const CAPTION_POOL = [
  "Wait for it — this reframe hits different.",
  "Nobody talks about this part of the process.",
  "If you only save one clip, make it this one.",
  "The quiet line that made the room go silent.",
  "Here's the exact framework in under 45 seconds.",
  "Stop scrolling. This is the unlock.",
];

function mockClips(source: string): Clip[] {
  const seed = hashString(source);
  const rand = mulberry32(seed);
  const n = 3 + (seed % 3);
  const clips: Clip[] = [];
  for (let i = 0; i < n; i++) {
    const durationSec = 28 + Math.floor(rand() * 52);
    const startSec = Math.floor(rand() * 1800) + i * 90;
    const endSec = startSec + durationSec;
    const virality = 55 + Math.floor(rand() * 44);
    clips.push({
      id: `clip-${seed.toString(16)}-${i}`,
      title: TITLE_POOL[(Math.floor(rand() * TITLE_POOL.length) + i) % TITLE_POOL.length],
      durationSec,
      startSec,
      endSec,
      startHint: formatDuration(startSec),
      endHint: formatDuration(endSec),
      virality,
      caption: CAPTION_POOL[(Math.floor(rand() * CAPTION_POOL.length) + i) % CAPTION_POOL.length],
    });
  }
  return clips.sort((a, b) => b.virality - a.virality);
}

function parseTimeHint(hint: string | undefined, fallback: number): number {
  if (!hint) return fallback;
  const m = hint.trim().match(/^(\d+):(\d{1,2})$/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  const n = Number(hint);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

function parseClips(content: string, source: string): Clip[] | null {
  const trimmed = content.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      clips?: Array<{
        title?: string;
        startHint?: string;
        endHint?: string;
        startSec?: number;
        endSec?: number;
        virality?: number;
        caption?: string;
      }>;
    };
    if (!Array.isArray(parsed.clips) || !parsed.clips.length) return null;
    const seed = hashString(source);
    return parsed.clips.slice(0, 5).map((c, i) => {
      let startSec = Math.max(0, Math.floor(Number(c.startSec) || parseTimeHint(c.startHint, i * 90)));
      let endSec = Math.floor(Number(c.endSec) || parseTimeHint(c.endHint, startSec + 45));
      if (endSec <= startSec) endSec = startSec + 45;
      let durationSec = endSec - startSec;
      if (durationSec < 15) durationSec = 15;
      if (durationSec > 120) durationSec = 120;
      endSec = startSec + durationSec;
      let virality = Math.floor(Number(c.virality) || 70);
      virality = Math.min(100, Math.max(0, virality));
      return {
        id: `ollama-${seed.toString(16)}-${i}`,
        title: (c.title || `Clip idea ${i + 1}`).slice(0, 100),
        durationSec,
        startSec,
        endSec,
        startHint: c.startHint || formatDuration(startSec),
        endHint: c.endHint || formatDuration(endSec),
        virality,
        caption: (c.caption || "Watch this moment.").slice(0, 200),
      };
    }).sort((a, b) => b.virality - a.virality);
  } catch {
    return null;
  }
}

async function generate(source: string) {
  const apiKey = (process.env.OLLAMA_API_KEY || "").trim();
  const host = (process.env.OLLAMA_HOST || DEFAULT_HOST).replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return {
      clips: mockClips(source),
      mode: "mock" as const,
      warning: "Add OLLAMA_API_KEY to enable Ollama Cloud clip ideas. Using mock generation.",
      hasApiKey: false,
      model,
    };
  }

  try {
    const res = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        messages: [
          {
            role: "system",
            content: "You output only compact JSON for short-form video clip proposals. No prose.",
          },
          {
            role: "user",
            content: `You are ClipForge. Source: ${source}\n\nReturn ONLY JSON:\n{"clips":[{"title":"string","startHint":"m:ss","endHint":"m:ss","virality":number,"caption":"string"}]}\n\nRules: 3-5 clips; English titles; 25-75s preferred; virality 0-100.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      return {
        clips: mockClips(source),
        mode: "mock" as const,
        warning: `Ollama Cloud returned ${res.status}. Fell back to mock clips.`,
        hasApiKey: true,
        model,
      };
    }

    const data = (await res.json()) as { message?: { content?: string } };
    const clips = parseClips(data.message?.content ?? "", source);
    if (!clips) {
      return {
        clips: mockClips(source),
        mode: "mock" as const,
        warning: "Could not parse Ollama JSON. Fell back to mock clips.",
        hasApiKey: true,
        model,
      };
    }
    return { clips, mode: "ollama" as const, hasApiKey: true, model };
  } catch {
    return {
      clips: mockClips(source),
      mode: "mock" as const,
      warning: "Ollama Cloud unreachable. Fell back to mock clips.",
      hasApiKey: true,
      model,
    };
  }
}

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    const hasApiKey = Boolean((process.env.OLLAMA_API_KEY || "").trim());
    return Response.json({
      ok: true,
      hasApiKey,
      model: process.env.OLLAMA_MODEL || DEFAULT_MODEL,
      host: process.env.OLLAMA_HOST || DEFAULT_HOST,
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: { source?: string; url?: string; title?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const source = (body.source || body.url || body.title || "").trim();
  if (!source) {
    return Response.json({ error: "Provide url, title, or source" }, { status: 400 });
  }

  const result = await generate(source);
  return Response.json(result);
};

export const config: Config = {
  path: "/api/generate-clips",
};
