import { Spider, SpiderSchema } from "~/types"
import { z } from "zod"
import cloudscraper from "cloudscraper"
import randomUseragent from "random-useragent"

export const ManifestSchema = z.object({
  crawlers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      link: z.string().url(),
    })
  ),
})
export type Manifest = z.infer<typeof ManifestSchema>

const FIXED_TOKEN_HASH = "2f3e5b8f3c4a1e6d9b7c2f3a1e4b6d7c9f0a1b2c3d4e5f6789abcdef012345678"

export async function loadManifest(url: string): Promise<Manifest | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json: unknown = await res.json()
    return ManifestSchema.parse(json)
  } catch (err) {
    console.error("[loadManifest] Failed to load manifest:", err)
    return null
  }
}

export async function loadSpiderConfig(url: string): Promise<Spider | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json: unknown = await res.json()
    const rawSpider = typeof json === "object" && json && "spider" in json ? (json as any).spider : json
    const parsedSpider = SpiderSchema.parse(rawSpider)
    const receivedToken = (json as any).token

    console.log("[loadSpiderConfig] received token :", receivedToken)
    console.log("[loadSpiderConfig] expected hash :", FIXED_TOKEN_HASH)

    if (receivedToken !== FIXED_TOKEN_HASH) {
      console.error("[loadSpiderConfig] Token mismatch! Spider rejected.")
      throw new Error("Invalid or tampered spider token")
    }

    return parsedSpider
  } catch (err) {
    console.error("[loadSpiderConfig] Failed to load spider config:", err)
    return null
  }
}

export async function fetchHtml(url: string): Promise<string | null> {
  try {
    const userAgent =
      randomUseragent.getRandom() ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36"

    const res = (await cloudscraper({
      uri: url,
      method: "GET",
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Connection: "keep-alive",
        Referer: "https://www.google.com/",
        DNT: "1",
        UpgradeInsecureRequests: "1",
      },
      gzip: true,
      simple: true,
    })) as string

    if (typeof res !== "string") return null
    return res
  } catch (err: any) {
    console.error("[fetchHtml] Error fetching", url, err.message)
    if (err.response) console.error("[fetchHtml] Response status:", err.response.status)
    return null
  }
}
