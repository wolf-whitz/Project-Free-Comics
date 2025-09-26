import { NextRequest } from "next/server";
import { JSDOM } from "jsdom";
import axios from "axios";
import { loadManifest, loadSpiderConfig } from "~/lib/loadManifest";

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await axios.get(url, { responseType: "text" });
    return typeof res.data === "string" ? res.data : null;
  } catch {
    return null;
  }
}

async function getChapterPages(mangaId: string, chapterNumber: number, spider: any) {
  const profileById = spider.itemConfig?.profileById;
  if (!profileById) return [];

  const profileUrl = profileById.urlPattern.replace("{manga_id}", mangaId);
  const html = await fetchHtml(profileUrl);
  if (!html) return [];

  const document = new JSDOM(html).window.document;
  const chapterSelector = profileById.ProfileTarget?.Chapters?.selector;
  if (!chapterSelector) return [];

  let chapterLinks = Array.from(document.querySelectorAll(chapterSelector))
    .map(el => (el as HTMLAnchorElement).getAttribute("href") ?? "")
    .filter(Boolean);

  if (profileById.ProfileTarget?.Chapters?.arranger === "newestFirst") {
    chapterLinks.reverse();
  }

  const chapterLinkRaw = chapterLinks[chapterNumber - 1];
  if (!chapterLinkRaw) return [];

  const chapterUrl = chapterLinkRaw.startsWith("http")
    ? chapterLinkRaw
    : new URL(chapterLinkRaw, profileUrl).toString();

  const chapterHtml = await fetchHtml(chapterUrl);
  if (!chapterHtml) return [];

  const chapterDoc = new JSDOM(chapterHtml).window.document;
  const pages: Array<{ page: number; url: string }> = [];

const pageConfig = profileById.ProfileTarget?.PageImage;

if (pageConfig?.arrayVar) {
  const variableNames: string[] = pageConfig.arrayVar.variableNames ?? [];
  const scriptMatch: string = pageConfig.arrayVar.scriptMatch ?? "";

  const scripts: string[] = Array.from(chapterDoc.querySelectorAll("script"))
    .map(s => s.textContent ?? "")
    .filter(s => scriptMatch.split(" ").every((str: string) => s.includes(str)));

  for (const script of scripts) {
    for (const varName of variableNames) {
      const regex = new RegExp(`${varName}\\s*=\\s*\\[(.*?)\\];`, "s");
      const match = script.match(regex);
      if (match?.[1]) {
        const urls: string[] = match[1]
          .split(",")
          .map(u => u.trim().replace(/^['"]|['"]$/g, ""))
          .filter(u => u.startsWith("http"));
        urls.forEach(url => pages.push({ page: pages.length + 1, url }));
      }
    }
  }
}

  if (!pages.length) {
    const selector = pageConfig?.selector ?? "img";
    Array.from(chapterDoc.querySelectorAll(selector))
      .map(img => (img as HTMLImageElement).src)
      .filter(src => src && src.startsWith("http"))
      .forEach(url => pages.push({ page: pages.length + 1, url }));
  }

  return pages;
}

function arrayBufferToBase64Safe(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    let chunk = "";
    for (let j = i; j < i + chunkSize && j < bytes.length; j++) {
      chunk += String.fromCharCode(bytes[j]);
    }
    binary += chunk;
  }
  return btoa(binary);
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const connectionUrl = params.connectionUrl ?? "";
  const spiderId = params.spiderId ?? "";
  const chapter = parseInt(params.chapter ?? "", 10);
  const mangaId = params.manga ?? "";

  if (!connectionUrl || !spiderId || !chapter || !mangaId) {
    return new Response("Missing parameters", { status: 400 });
  }

  const manifest = await loadManifest(connectionUrl);
  if (!manifest) return new Response("Failed to load manifest", { status: 500 });

  const crawler = manifest.crawlers.find(c => c.id === spiderId);
  if (!crawler) return new Response(`Spider '${spiderId}' not found`, { status: 404 });

  const spider = await loadSpiderConfig(crawler.link);
  if (!spider) return new Response("Failed to load spider config", { status: 500 });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const pages = await getChapterPages(mangaId, chapter, spider);
        if (!pages.length) {
          controller.enqueue(encoder.encode("data: done\n\n"));
          controller.close();
          return;
        }

        for (const page of pages) {
          try {
            const resp = await fetch(page.url);
            if (!resp.ok) continue;

            const buffer = await resp.arrayBuffer();
            if (!buffer.byteLength || buffer.byteLength > 5_000_000) continue;

            const base64 = arrayBufferToBase64Safe(buffer);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ page: page.page, image: `data:image/webp;base64,${base64}` })}\n\n`));
          } catch {}
        }

        controller.enqueue(encoder.encode("data: done\n\n"));
        controller.close();
      } catch {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
