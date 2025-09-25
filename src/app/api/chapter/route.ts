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

async function fetchChapterPages(chapterUrl: string, spider: any) {
  const html = await fetchHtml(chapterUrl);
  if (!html) return [];
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const pages: Array<{ page: number; url: string }> = [];

  const pageImageConfig = spider.itemConfig?.profileById?.ProfileTarget?.PageImage;

  if (pageImageConfig?.arrayVar) {
    const { variableNames, scriptMatch } = pageImageConfig.arrayVar;
    const scripts = Array.from(document.querySelectorAll("script"))
      .map(s => s.textContent || "")
      .filter(s => scriptMatch.split(" ").every((str: string) => s.includes(str)));

    for (const script of scripts) {
      for (const varName of variableNames) {
        const regex = new RegExp(`${varName}\\s*=\\s*\\[(.*?)\\];`, "s");
        const match = script.match(regex);
        if (match?.[1]) {
          const urls = match[1]
            .split(",")
            .map((s: string) => s.trim().replace(/^['"]|['"]$/g, ""))
            .filter((s: string) => s.startsWith("http"));
          urls.forEach((url: string) => {
            const absoluteUrl = url.startsWith("http") ? url : new URL(url, chapterUrl).toString();
            pages.push({ page: pages.length + 1, url: absoluteUrl });
          });
        }
      }
    }
  }

  if (!pages.length) {
    const selector = pageImageConfig?.selector ?? "img";
    const imgs = Array.from(document.querySelectorAll(selector));
    imgs.forEach((img: Element) => {
      const src = (img as HTMLImageElement).src;
      if (!src || !src.startsWith("http")) return;
      const absoluteUrl = src.startsWith("http") ? src : new URL(src, chapterUrl).toString();
      pages.push({ page: pages.length + 1, url: absoluteUrl });
    });
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
  const chapter = params.chapter ?? "";
  if (!connectionUrl || !spiderId || !chapter)
    return new Response("Missing parameters", { status: 400 });

  const manifest = await loadManifest(connectionUrl);
  if (!manifest) return new Response("Failed to load manifest", { status: 500 });

  const crawler = manifest.crawlers.find(c => c.id === spiderId);
  if (!crawler) return new Response(`Spider '${spiderId}' not found`, { status: 404 });

  const spider = await loadSpiderConfig(crawler.link);
  if (!spider) return new Response("Failed to load spider config", { status: 500 });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const pages = await fetchChapterPages(chapter, spider);
        if (!pages.length) {
          controller.enqueue(encoder.encode("data: done\n\n"));
          controller.close();
          return;
        }
        for (const page of pages) {
          try {
            const resp = await fetch(page.url);
            if (!resp.ok) continue;
            const arrayBuffer = await resp.arrayBuffer();
            if (!arrayBuffer.byteLength) continue;
            if (arrayBuffer.byteLength > 5_000_000) continue;
            const base64 = arrayBufferToBase64Safe(arrayBuffer);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ page: page.page, image: `data:image/webp;base64,${base64}` })}\n\n`
              )
            );
          } catch {}
        }
        controller.enqueue(encoder.encode("data: done\n\n"));
        controller.close();
      } catch {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
