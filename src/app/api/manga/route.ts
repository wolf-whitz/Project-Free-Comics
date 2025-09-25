import { NextRequest } from "next/server"
import { z } from "zod"
import { JSDOM } from "jsdom"
import { db } from "~/lib/db"
import { loadManifest, loadSpiderConfig } from "~/lib/loadManifest"
import type { Spider } from "~/types"

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
      ])
    )
    .optional(),
})

async function fetchHtml(url: string): Promise<Document | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    const dom = new JSDOM(html)
    return dom.window.document
  } catch {
    return null
  }
}

function applyReplacer(
  urlPattern: string,
  mangaId: string,
  replacer?: { pattern: string; with: string }
) {
  let normalizedId = mangaId
  if (replacer) {
    try {
      const regex = new RegExp(replacer.pattern)
      normalizedId = mangaId.replace(regex, replacer.with)
    } catch {}
  }
  return urlPattern.replace("{manga_id}", normalizedId)
}

async function getMangaDetails(spider: Spider, mangaId: string, fields: string[]) {
  const profileById = spider.itemConfig?.profileById
  if (!profileById?.urlPattern || !profileById.ProfileTarget) return { results: [] }

  const urlPattern = applyReplacer(profileById.urlPattern, mangaId, profileById.replace)
  const doc = await fetchHtml(urlPattern)
  if (!doc) return { results: [] }

  const target = profileById.ProfileTarget
  const data: any = { manga_id: mangaId }

  if (fields.includes("manga_name") && target.Name?.selector) {
    const el = doc.querySelector(target.Name.selector)
    data.manga_name = el?.textContent?.trim() ?? ""
  }

  if (fields.includes("manga_description") && target.Description?.selector) {
    const el = doc.querySelector(target.Description.selector)
    data.manga_description = el?.textContent?.trim() ?? ""
  }

  if (fields.includes("manga_image") && target.Image?.selector) {
    const el = doc.querySelector(target.Image.selector)
    const src = el?.getAttribute(target.Image.attribute ?? "src") ?? ""
    data.manga_image = src ? (src.startsWith("http") ? src : new URL(src, urlPattern).toString()) : null
  }

  if (fields.includes("genres") && target.Genres?.selector) {
    data.genres = Array.from(doc.querySelectorAll(target.Genres.selector))
      .map(el => el.textContent?.trim())
      .filter((txt): txt is string => Boolean(txt))
  }

  if (fields.includes("manga_chapters") && target.Chapters?.selector) {
    const chaptersArray = doc.querySelectorAll(target.Chapters.selector)
    if (chaptersArray.length > 0 && target.Chapters) {
      let chapters = Array.from(chaptersArray).map(ch => {
        const rawUrl = ch.getAttribute(target.Chapters.attribute ?? "href") ?? ""
        const fullUrl = rawUrl.startsWith("http") ? rawUrl : new URL(rawUrl, urlPattern).toString()
        return {
          title: target.Chapters?.text ? ch.textContent?.trim() ?? "" : "",
          url: fullUrl,
          chapter: fullUrl // store full chapter link here
        }
      })
      if (target.Chapters.arranger === "newestFirst") chapters = chapters.reverse()
      data.manga_chapters = chapters
    } else {
      data.manga_chapters = []
    }
  }

  return { results: [data] }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { manga_id, spiderId, fields } = MangaRequestSchema.parse(body)

    const row = db.prepare("SELECT connection_url FROM user_data LIMIT 1").get() as
      | { connection_url?: string }
      | undefined

    if (!row?.connection_url) {
      return new Response(JSON.stringify({ error: "No registered connection URL found" }), { status: 400 })
    }

    const manifest = await loadManifest(row.connection_url)
    if (!manifest) return new Response(JSON.stringify({ error: "Failed to load manifest" }), { status: 500 })

    const crawler = manifest.crawlers.find(c => c.id === spiderId)
    if (!crawler) return new Response(JSON.stringify({ error: `Spider '${spiderId}' not found in manifest` }), { status: 404 })

    const spiderJson = await loadSpiderConfig(crawler.link)
    if (!spiderJson) return new Response(JSON.stringify({ error: `Failed to load config for spider '${spiderId}'` }), { status: 500 })

    const result = await getMangaDetails(spiderJson as Spider, manga_id, fields ?? [])

    if (!result.results?.length) {
      return new Response(JSON.stringify({ spiderId, error: "No results found" }), { status: 200 })
    }

    return new Response(JSON.stringify({ spiderId, ...result }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
