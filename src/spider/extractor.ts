import { JSONPath } from "jsonpath-plus";
import axios from "axios";
import { db, initDb } from "@database/server/init";

type ContentOptions = {
  selector?: string;
  attribute?: string;
  text?: boolean;
  parseScriptJson?: boolean;
  jsonPath?: string;
  multiple?: boolean;
  fetch?: boolean;
  urlPattern?: string;
  baseEl?: Element;
};

initDb();

function normalizeAttr(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

async function runCloudflareFetch(url: string, cfg: any): Promise<any> {
  const user = db
    .prepare("SELECT auth_token FROM user_data ORDER BY ROWID DESC LIMIT 1")
    .get() as { auth_token: string | null } | undefined;

  if (!user || !user.auth_token) return null;

  const workerUrl = "https://sandboxed.whitzscott.workers.dev";
  const { data } = await axios.post(
    workerUrl,
    { url, cfg },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.auth_token}`,
      },
    },
  );
  return data?.data ?? null;
}

export async function extractContent(
  el: any,
  opts: ContentOptions = {},
): Promise<any> {
  const {
    selector,
    attribute,
    text,
    parseScriptJson,
    jsonPath,
    multiple,
    fetch: fetchContent,
    urlPattern,
    baseEl,
  } = opts;

  if (fetchContent) {
    let targetUrl = urlPattern;
    if (!targetUrl && baseEl) {
      const id = baseEl.getAttribute("data-id") || "";
      targetUrl = urlPattern?.replace("{manga_id}", id);
    }
    if (!targetUrl) return undefined;

    try {
      const data = await runCloudflareFetch(targetUrl, opts);
      if (!data) return undefined;
      return data;
    } catch {
      return undefined;
    }
  }

  let nodes: any[] = selector
    ? Array.from(el?.querySelectorAll?.(selector) || [])
    : [el];
  if (!multiple && nodes.length > 1) nodes = [nodes[0]];

  const results: any[] = [];

  for (const node of nodes) {
    let value: any;

    if (parseScriptJson && node?.textContent) {
      try {
        const parsed = JSON.parse(node.textContent.trim());
        const jsonpathResult = jsonPath
          ? JSONPath({ path: jsonPath, json: parsed })
          : parsed;
        value = multiple
          ? jsonpathResult
          : Array.isArray(jsonpathResult)
            ? jsonpathResult[0]
            : jsonpathResult;
      } catch {
        value = undefined;
      }
    }

    if (value === undefined) {
      if (text && node?.textContent !== undefined)
        value = node.textContent.trim();
      else if (attribute && node?.getAttribute)
        value = normalizeAttr(node.getAttribute(attribute));
      else if (node?.innerHTML !== undefined) value = node.innerHTML.trim();
      else value = node;
    }

    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) results.push(...value.filter((v) => v != null));
      else results.push(value);
    }
  }

  return multiple ? results : (results[0] ?? undefined);
}
