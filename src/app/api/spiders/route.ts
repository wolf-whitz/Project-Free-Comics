import { NextRequest, NextResponse } from "next/server"
import { db } from "~/lib/db"
import { loadManifest } from "~/lib/loadManifest"

export async function POST(req: NextRequest) {
  try {
    const row = db.prepare("SELECT connection_url FROM user_data LIMIT 1").get() as
      | { connection_url?: string }
      | undefined

    if (!row?.connection_url) {
      return NextResponse.json({ error: "No registered connection URL found" }, { status: 400 })
    }

    const manifest = await loadManifest(row.connection_url)
    if (!manifest) {
      return NextResponse.json({ error: "Failed to load manifest" }, { status: 500 })
    }

    const spiders = manifest.crawlers.map(crawler => ({
      spider_name: crawler.name,
      spider_link: crawler.link,
    }))

    return NextResponse.json({ spiders })
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch manifest", details: err.message }, { status: 500 })
  }
}
