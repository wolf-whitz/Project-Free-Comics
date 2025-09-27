import { NextRequest, NextResponse } from "next/server"
import { db, initDb } from "~/lib/db"
import { z } from "zod"
import { loadManifest } from "~/lib/loader"

initDb()

const RegisterRequestSchema = z.object({
  connectionUrl: z.string().url(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { connectionUrl } = RegisterRequestSchema.parse(body)

    const existing = db
      .prepare("SELECT connection_url FROM user_data WHERE connection_url = ?")
      .get(connectionUrl) as { connection_url: string } | undefined

    if (!existing) {
      db.prepare("INSERT INTO user_data (connection_url) VALUES (?)").run(connectionUrl)
    }

    const manifest = await loadManifest(connectionUrl)
    if (!manifest) {
      return NextResponse.json(
        { success: false, error: "Failed to load manifest" },
        { status: 500 }
      )
    }

    const crawlers = manifest.crawlers.map(crawler => ({
      id: crawler.id,
      name: crawler.name,
      link: crawler.link,
    }))

    return NextResponse.json({
      success: true,
      manifest: crawlers,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.errors ?? err.message },
      { status: 400 }
    )
  }
}
