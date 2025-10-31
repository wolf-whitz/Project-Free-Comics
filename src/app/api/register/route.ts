import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@database/server/init";
import { z } from "zod";
import { loadManifest } from "~/spider";
import { randomUUID, createHash } from "crypto";

initDb();

const RegisterRequestSchema = z.object({
  connectionUrl: z.string().url(),
  token: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { connectionUrl, token } = RegisterRequestSchema.parse(body);

    const existing = db
      .prepare(
        "SELECT connection_url, auth_token FROM user_data WHERE connection_url = ?",
      )
      .get(connectionUrl) as
      | { connection_url: string; auth_token: string }
      | undefined;

    let authToken: string;

    if (!existing) {
      const userId = token;
      const specialKey = createHash("sha256")
        .update(userId + Date.now().toString())
        .digest("hex");
      authToken = specialKey;

      db.prepare(
        "INSERT INTO user_data (connection_url, auth_token) VALUES (?, ?)",
      ).run(connectionUrl, authToken);
    } else {
      authToken = existing.auth_token;
    }

    const manifest = await loadManifest(connectionUrl);
    if (!manifest) {
      return NextResponse.json(
        { success: false, error: "Failed to load manifest" },
        { status: 500 },
      );
    }

    const crawlers = manifest.crawlers.map((crawler) => ({
      id: crawler.id,
      name: crawler.name,
      link: crawler.link,
    }));

    return NextResponse.json({
      success: true,
      manifest: crawlers,
      authToken,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.errors ?? err.message },
      { status: 400 },
    );
  }
}
