import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@database/server/init";
import {
  loadManifest,
  loadSpiderConfig,
  extractContent,
  fetchHtml,
} from "~/spider";
import { JSDOM } from "jsdom";
import type { Spider } from "@components/renderer/types";

const MangaRequestSchema = z.object({
  manga_id: z.string().min(1),
  spiderId: z.string().min(1),
  fields: z
    .array(
      z.enum([
        "manga_id",
        "manga_name",
        "manga_description",
        "genres",
        "manga_image",
        "manga_chapters",
        "page_images",
      ]),
    )
    .optional(),
});

function normalizeMangaId(id: string): string {
  return `/${id.replace(/^\/+|\/+$/g, "").toLowerCase()}`;
}

function applyReplacer(
  urlPattern: string,
  mangaId: string,
  replacer?: { pattern: string; with: string },
) {
  let normalizedId = normalizeMangaId(mangaId);
  if (replacer) {
    try {
      const regex = new RegExp(replacer.pattern);
      normalizedId = normalizedId.replace(regex, replacer.with);
    } catch {}
  }
  return urlPattern.replace("{manga_id}", normalizedId);
}

async function getMangaDetails(
  spider: Spider,
  mangaId: string,
  fields: string[],
) {
  const profileById = spider.itemConfig?.profileById;
  if (!profileById?.urlPattern || !profileById.ProfileTarget)
    return { results: [] };

  const fetchUrl = applyReplacer(
    profileById.urlPattern,
    mangaId,
    profileById.replace,
  );
  const html = await fetchHtml(fetchUrl);
  if (!html) return { results: [] };

  const dom = new JSDOM(html);
  const document = dom.window.document;
  const target = profileById.ProfileTarget;
  const data: any = { manga_id: normalizeMangaId(mangaId) };

  if (fields.includes("manga_name") && target.Name)
    data.manga_name = await extractContent(document, target.Name);

  if (fields.includes("manga_description") && target.Description)
    data.manga_description = await extractContent(document, target.Description);

  if (fields.includes("manga_image") && target.Image)
    data.manga_image = await extractContent(document, target.Image);

  if (fields.includes("genres") && target.Genres)
    data.genres =
      (await extractContent(document, { ...target.Genres, multiple: true })) ||
      [];

  if (fields.includes("manga_chapters") && target.Chapters) {
    let chapters =
      (await extractContent(document, {
        ...target.Chapters,
        multiple: true,
      })) || [];
    if (target.Chapters.arranger === "newestFirst")
      chapters = chapters.reverse();
    data.manga_chapters = chapters;
    data.max_chapters = chapters.length;
  }

  if (fields.includes("page_images") && target.PageImage)
    data.page_images =
      (await extractContent(document, {
        ...target.PageImage,
        multiple: true,
      })) || [];

  return { results: [data] };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { manga_id, spiderId, fields } = MangaRequestSchema.parse(body);

    const row = db
      .prepare("SELECT connection_url FROM user_data LIMIT 1")
      .get() as { connection_url?: string } | undefined;
    if (!row?.connection_url)
      return new Response(
        JSON.stringify({ error: "No registered connection URL found" }),
        { status: 400 },
      );

    const manifest = await loadManifest(row.connection_url);
    if (!manifest)
      return new Response(
        JSON.stringify({ error: "Failed to load manifest" }),
        { status: 500 },
      );

    const crawler = manifest.crawlers.find((c) => c.id === spiderId);
    if (!crawler)
      return new Response(
        JSON.stringify({ error: `Spider '${spiderId}' not found in manifest` }),
        { status: 404 },
      );

    const spiderJson = await loadSpiderConfig(crawler.link);
    if (!spiderJson)
      return new Response(
        JSON.stringify({
          error: `Failed to load config for spider '${spiderId}'`,
        }),
        { status: 500 },
      );

    const result = await getMangaDetails(
      spiderJson as Spider,
      manga_id,
      fields ?? [],
    );
    if (!result.results?.length)
      return new Response(
        JSON.stringify({ spiderId, error: "No results found" }),
        { status: 200 },
      );

    return new Response(JSON.stringify({ spiderId, ...result }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
