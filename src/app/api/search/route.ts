// app/api/search/route.ts
import { NextRequest } from "next/server"
import { z } from "zod"
import { JSDOM } from "jsdom"
import { db } from "~/lib/db"
import { loadManifest, loadSpiderConfig } from "~/lib/loadManifest"
import axios from "axios"
import { Spider } from "~/types"

const FieldsSchema = z.array(
  z.enum([
    "manga_id",
    "manga_name",
    "manga_description",
    "genres",
    "manga_image",
    "manga_chapters",
    "page_num",
    "page_image",
  ])
)
type MangaField = z.infer<typeof FieldsSchema>[number]

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await axios.get(url)
    return typeof res.data === "string" ? res.data : null
  } catch (err: any) {
    console.error("[fetchHtml] Error fetching", url, err.message)
    return null
  }
}

async function searchSpider(spider: Spider, query: string, fields: MangaField[]) {
  const cfg = spider.itemConfig
  if (!cfg?.selector || !cfg?.ProfileTarget) {
    return { results: [], warning: "Invalid spider configuration" }
  }

  const fetchUrl = spider.targetUrl.replace("{query}", encodeURIComponent(query))
  console.log(`[searchSpider] Fetching: ${fetchUrl}`)

  const html = await fetchHtml(fetchUrl)
  if (!html) return { results: [], warning: "Failed to fetch HTML" }

  const dom = new JSDOM(html)
  const document = dom.window.document
  const elements = Array.from(document.querySelectorAll(cfg.selector)) as Element[]
  console.log(`[searchSpider] Found ${elements.length} elements`)

  const results: any[] = []
  const target = cfg.ProfileTarget

  for (const el of elements) {
    const data: any = {}

    if (fields.includes("manga_name") && target.Name?.selector) {
      const nameEl = el.querySelector(target.Name.selector) as HTMLElement | null
      data.manga_name = nameEl?.textContent?.trim() ?? ""
    }

    if (fields.includes("manga_description") && target.Description?.selector) {
      const descEl = el.querySelector(target.Description.selector) as HTMLElement | null
      data.manga_description = descEl?.textContent?.trim() ?? ""
    }

    if (fields.includes("genres") && target.Genres?.selector) {
      data.genres = Array.from(
        el.querySelectorAll(target.Genres.selector) as NodeListOf<HTMLElement>
      )
        .map(e => e.textContent?.trim())
        .filter((txt): txt is string => Boolean(txt))
    }

    if (fields.includes("manga_image") && target.Image?.selector) {
      const imgEl = el.querySelector(target.Image.selector) as HTMLElement | null
      const src = imgEl?.getAttribute(target.Image.attribute ?? "src") ?? ""
      data.manga_image = src
        ? src.startsWith("http")
          ? src
          : new URL(src, fetchUrl).toString()
        : null
    }

    if (fields.includes("manga_id") && target.MangaID?.selector) {
      const idEl = el.querySelector(target.MangaID.selector) as HTMLElement | null
      data.manga_id = idEl?.getAttribute(target.MangaID.attribute ?? "href") ?? null
    }

if (fields.includes("manga_chapters") && target.Chapters) {
  const { selector, attribute, arranger } = target.Chapters
  if (selector) {
    const chEls = Array.from(
      el.querySelectorAll(selector) as NodeListOf<HTMLElement>
    )
    let chapters = chEls.map(ch => ({
      title: ch.textContent?.trim() ?? "",
      url: ch.getAttribute(attribute ?? "href") ?? "",
    }))
    if (arranger === "newestFirst") chapters = chapters.reverse()
    data.manga_chapters = chapters
  }
}

    results.push(data)
  }

  return { results, warning: results.length ? undefined : "No matching content found" }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query") || ""
  const fieldsParam = searchParams.get("fields") || ""

  const parsedFields = fieldsParam.split(",").map(f => f.trim()).filter(Boolean)
  const fieldsParse = FieldsSchema.safeParse(parsedFields)
  const fields: MangaField[] = fieldsParse.success ? (parsedFields as MangaField[]) : []

  const row = db
    .prepare("SELECT connection_url FROM user_data LIMIT 1")
    .get() as { connection_url?: string } | undefined

  const manifestUrl = row?.connection_url
  if (!manifestUrl) {
    return new Response(JSON.stringify({ error: "No registered connection URL found" }), {
      status: 400,
    })
  }

  const manifest = await loadManifest(manifestUrl)
  if (!manifest) {
    return new Response(JSON.stringify({ error: "Failed to load manifest" }), { status: 500 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      for (const crawler of manifest.crawlers) {
        console.log(`[SearchAPI] Processing spider: ${crawler.id}`)

        const externalConfig = await loadSpiderConfig(crawler.link)
        if (!externalConfig) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                spiderId: crawler.id,
                displayName: crawler.name,
                results: [],
                warning: "Could not load spider config",
              })}\n\n`
            )
          )
          continue
        }

        const { results, warning } = await searchSpider(externalConfig, query, fields)

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              spiderId: crawler.id,
              displayName: crawler.name,
              results,
              warning,
            })}\n\n`
          )
        )
      }

      controller.enqueue(encoder.encode("event: done\ndata: done\n\n"))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
