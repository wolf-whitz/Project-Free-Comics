import { NextRequest } from "next/server";
import { z } from "zod";
import { JSDOM } from "jsdom";
import { db } from "@database/server/init";
import {
  loadManifest,
  loadSpiderConfig,
  fetchHtml,
  extractContent,
} from "~/spider";
import { Spider } from "@components/renderer/types";

const FieldsSchema = z.array(
  z.enum([
    "manga_id",
    "manga_name",
    "manga_description",
    "genres",
    "manga_image",
    "manga_chapters",
    "page_num",
  ]),
);
type MangaField = z.infer<typeof FieldsSchema>[number];

async function searchSpider(
  spider: Spider,
  query: string,
  fields: MangaField[],
) {
  const cfg = spider.itemConfig;
  if (!cfg) {
    console.warn("[searchSpider] no itemConfig");
    return { results: [], warning: "No itemConfig provided" };
  }

  const fetchUrl = spider.targetUrl.replace(
    "{query}",
    encodeURIComponent(query),
  );
  console.log(`[searchSpider] Fetching URL: ${fetchUrl}`);

  const html = await fetchHtml(fetchUrl);
  if (!html) {
    console.warn(`[searchSpider] failed to fetch HTML from ${fetchUrl}`);
    return { results: [], warning: "Failed to fetch HTML" };
  }

  console.log(`[searchSpider] HTML length=${html.length}`);
  console.log(
    `[searchSpider] HTML preview=${html.slice(0, 300).replace(/\n/g, " ")}`,
  );

  const dom = new JSDOM(html);
  const document = dom.window.document;
  const elements = Array.from(document.querySelectorAll(cfg.selector ?? ""));
  console.log(
    `[searchSpider] Found ${elements.length} elements for selector: ${cfg.selector}`,
  );

  const results: any[] = [];

  for (const [index, el] of elements.entries()) {
    console.log(
      `[searchSpider] Processing element #${index + 1}/${elements.length}`,
    );
    console.log(
      `[searchSpider] Element HTML preview`,
      el.innerHTML.slice(0, 300),
    );

    const data: any = {};

    if (fields.includes("manga_name") && cfg.Name) {
      data.manga_name = await extractContent(el, cfg.Name);
    }
    if (fields.includes("genres") && cfg.Genres) {
      data.genres = await extractContent(el, cfg.Genres);
    }

    if (cfg.ProfileTarget) {
      console.log(
        `[searchSpider] ProfileTarget exists for element #${index + 1}`,
      );

      if (fields.includes("manga_id") && cfg.ProfileTarget.MangaID) {
        data.manga_id = await extractContent(el, cfg.ProfileTarget.MangaID);
      }
      if (fields.includes("manga_name") && cfg.ProfileTarget.Name) {
        data.manga_name = await extractContent(el, cfg.ProfileTarget.Name);
      }
      if (
        fields.includes("manga_description") &&
        cfg.ProfileTarget.Description
      ) {
        data.manga_description = await extractContent(
          el,
          cfg.ProfileTarget.Description,
        );
      }
      if (fields.includes("genres") && cfg.ProfileTarget.Genres) {
        data.genres = await extractContent(el, cfg.ProfileTarget.Genres);
      }
      if (fields.includes("manga_image") && cfg.ProfileTarget.Image) {
        data.manga_image = await extractContent(el, cfg.ProfileTarget.Image);
      }
      if (fields.includes("manga_chapters") && cfg.ProfileTarget.Chapters) {
        data.manga_chapters = await extractContent(
          el,
          cfg.ProfileTarget.Chapters,
        );
      }
    }

    console.log(
      `[searchSpider] Extracted data for element #${index + 1}`,
      data,
    );
    results.push(data);
  }

  console.log(`[searchSpider] Completed with ${results.length} results`);
  return {
    results,
    warning: results.length ? undefined : "No matching content found",
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const fieldsParam = searchParams.get("fields") || "";
  const parsedFields = fieldsParam
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  const fieldsParse = FieldsSchema.safeParse(parsedFields);
  const fields: MangaField[] = fieldsParse.success
    ? (parsedFields as MangaField[])
    : [];

  console.log(`[GET] query="${query}" fields=[${fields.join(", ")}]`);

  const row = db
    .prepare("SELECT connection_url FROM user_data LIMIT 1")
    .get() as { connection_url?: string } | undefined;
  const manifestUrl = row?.connection_url;
  if (!manifestUrl) {
    console.error("[GET] no registered connection URL in DB");
    return new Response(
      JSON.stringify({ error: "No registered connection URL found" }),
      { status: 400 },
    );
  }

  console.log(`[GET] Loading manifest from ${manifestUrl}`);
  const manifest = await loadManifest(manifestUrl);
  if (!manifest) {
    console.error(`[GET] Failed to load manifest from ${manifestUrl}`);
    return new Response(JSON.stringify({ error: "Failed to load manifest" }), {
      status: 500,
    });
  }

  console.log(
    `[GET] Manifest loaded with ${manifest.crawlers.length} crawlers`,
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const crawler of manifest.crawlers) {
        console.log(`[GET] Processing crawler ${crawler.name} (${crawler.id})`);
        const externalConfig = await loadSpiderConfig(crawler.link);
        if (!externalConfig) {
          console.warn(
            `[GET] Could not load spider config for ${crawler.name}`,
          );
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                spiderId: crawler.id,
                displayName: crawler.name,
                results: [],
                warning: "Could not load spider config",
              })}\n\n`,
            ),
          );
          continue;
        }

        const { results, warning } = await searchSpider(
          externalConfig,
          query,
          fields,
        );
        console.log(`[GET] Results for crawler ${crawler.name}`, {
          resultsCount: results.length,
          warning,
        });
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              spiderId: crawler.id,
              displayName: crawler.name,
              results,
              warning,
            })}\n\n`,
          ),
        );
      }

      console.log("[GET] All crawlers processed, sending done event");
      controller.enqueue(encoder.encode("event: done\ndata: done\n\n"));
      controller.close();
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
