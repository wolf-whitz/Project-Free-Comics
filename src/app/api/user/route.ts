import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@database/server/init";

initDb();

export async function GET(req: NextRequest) {
  try {
    const user = db
      .prepare(
        "SELECT connection_url FROM user_data ORDER BY ROWID DESC LIMIT 1",
      )
      .get() as { connection_url: string } | undefined;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No connection URL found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      connectionUrl: user.connection_url,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
