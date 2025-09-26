import { Spider, SpiderSchema } from "~/types";
import { z } from "zod";

export const ManifestSchema = z.object({
  crawlers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      link: z.string().url(),
    })
  ),
});
export type Manifest = z.infer<typeof ManifestSchema>;

export async function loadManifest(url: string): Promise<Manifest | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: unknown = await res.json();
    return ManifestSchema.parse(json);
  } catch (err) {
    console.error("[loadManifest] Failed to load manifest:", err);
    return null;
  }
}

export async function loadSpiderConfig(url: string): Promise<Spider | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: unknown = await res.json();
    const rawSpider = typeof json === "object" && json && "spider" in json ? (json as any).spider : json;
    return SpiderSchema.parse(rawSpider);
  } catch (err) {
    console.error("[loadSpiderConfig] Failed to load spider config:", err);
    return null;
  }
}
