import { NextRequest } from "next/server"
import { z } from "zod"
import { JSDOM } from "jsdom"
import { db } from "~/lib/db"
import { loadManifest, loadSpiderConfig, fetchHtml, extractContent } from "~/lib"
import { Spider } from "~/types"

const FieldsSchema = z.array(
  z.enum([
    "manga_id",
    "manga_name",
    "manga_description",
    "genres",
    "manga_image",
    "manga_chapters",
    "page_num"
  ])
)
type MangaField = z.infer<typeof FieldsSchema>[number]

function normalizeAttr(value: string | null | undefined): string | undefined {
  return value ?? undefined
}

async function searchSpider(spider: Spider, query: string, fields: MangaField[]) {
  const cfg = spider.itemConfig
  if (!cfg?.selector || !cfg?.ProfileTarget) {
    console.warn(`[searchSpider] Invalid spider configuration for: ${spider.id}`)
    return { results: [], warning: "Invalid spider configuration" }
  }

  const fetchUrl = spider.targetUrl.replace("{query}", encodeURIComponent(query))
  console.log(`[searchSpider] Fetching URL: ${fetchUrl}`)
  const html = await fetchHtml(fetchUrl)
  if (!html) {
    console.warn(`[searchSpider] Failed to fetch HTML for: ${fetchUrl}`)
    return { results: [], warning: "Failed to fetch HTML" }
  }

  const dom = new JSDOM(html)
  const document = dom.window.document
  const elements = Array.from(document.querySelectorAll(cfg.selector))
  console.log(`[searchSpider] Found ${elements.length} elements using selector: ${cfg.selector}`)
  const results: any[] = []
  const target = cfg.ProfileTarget

  for (const [index, el] of elements.entries()) {
    console.log(`[searchSpider] Processing element #${index + 1}: ${el.outerHTML}`)
    const data: any = {}

    if (fields.includes("manga_name")) {
      data.manga_name = extractContent(el, {
        selector: target?.Name?.selector,
        text: true,
        parseScriptJson: true,
        jsonPath: target?.Name?.jsonPath,
        multiple: false,
      })
      console.log(`[searchSpider] manga_name:`, data.manga_name)
    }

    if (fields.includes("manga_description")) {
      data.manga_description = extractContent(el, {
        selector: target?.Description?.selector,
        text: true,
        parseScriptJson: true,
        jsonPath: target?.Description?.jsonPath,
        multiple: false,
      })
      console.log(`[searchSpider] manga_description:`, data.manga_description)
    }

    if (fields.includes("genres")) {
      const genres = extractContent(el, {
        selector: target?.Genres?.selector,
        text: true,
        multiple: true,
        parseScriptJson: true,
        jsonPath: target?.Genres?.jsonPath,
      })
      data.genres = Array.isArray(genres) ? genres.filter(Boolean) : []
      console.log(`[searchSpider] genres:`, data.genres)
    }

    if (fields.includes("manga_image")) {
      const img = extractContent(el, {
        selector: target?.Image?.selector,
        attribute: target?.Image?.attribute,
        parseScriptJson: true,
        jsonPath: target?.Image?.jsonPath,
        multiple: false,
      })
      data.manga_image = normalizeAttr(img)
      console.log(`[searchSpider] manga_image:`, data.manga_image)
    }

    if (fields.includes("manga_id")) {
      const id = extractContent(el, {
        selector: target?.MangaID?.selector,
        attribute: target?.MangaID?.attribute,
        parseScriptJson: true,
        jsonPath: target?.MangaID?.jsonPath,
        multiple: false,
      })
      data.manga_id = normalizeAttr(id)
      console.log(`[searchSpider] manga_id:`, data.manga_id)
    }

    if (fields.includes("manga_chapters")) {
      const chapters = extractContent(el, {
        selector: target?.Chapters?.selector,
        attribute: target?.Chapters?.attribute,
        text: true,
        multiple: true,
        parseScriptJson: true,
        jsonPath: target?.Chapters?.jsonPath,
      }) || []
      data.manga_chapters = Array.isArray(chapters) ? chapters.filter(Boolean) : [chapters].filter(Boolean)
      console.log(`[searchSpider] manga_chapters:`, data.manga_chapters)
    }

    results.push(data)
  }

  console.log(`[searchSpider] Finished processing spider: ${spider.id}, results count: ${results.length}`)
  return { results, warning: results.length ? undefined : "No matching content found" }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query") || ""
  const fieldsParam = searchParams.get("fields") || ""
  const parsedFields = fieldsParam.split(",").map(f => f.trim()).filter(Boolean)
  const fieldsParse = FieldsSchema.safeParse(parsedFields)
  const fields: MangaField[] = fieldsParse.success ? (parsedFields as MangaField[]) : []

  const row = db.prepare("SELECT connection_url FROM user_data LIMIT 1").get() as { connection_url?: string } | undefined
  const manifestUrl = row?.connection_url
  if (!manifestUrl) {
    console.warn(`[GET] No registered connection URL found`)
    return new Response(JSON.stringify({ error: "No registered connection URL found" }), { status: 400 })
  }

  const manifest = await loadManifest(manifestUrl)
  if (!manifest) {
    console.warn(`[GET] Failed to load manifest from URL: ${manifestUrl}`)
    return new Response(JSON.stringify({ error: "Failed to load manifest" }), { status: 500 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for (const crawler of manifest.crawlers) {
        console.log(`[GET] Processing crawler: ${crawler.name} (${crawler.id})`)
        const externalConfig = await loadSpiderConfig(crawler.link)
        if (!externalConfig) {
          console.warn(`[GET] Could not load spider config for: ${crawler.id}`)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ spiderId: crawler.id, displayName: crawler.name, results: [], warning: "Could not load spider config" })}\n\n`
            )
          )
          continue
        }

        const { results, warning } = await searchSpider(externalConfig, query, fields)
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ spiderId: crawler.id, displayName: crawler.name, results, warning })}\n\n`
          )
        )
      }
      controller.enqueue(encoder.encode("event: done\ndata: done\n\n"))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  })
}
