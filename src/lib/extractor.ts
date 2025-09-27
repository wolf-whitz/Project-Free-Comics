import { JSDOM } from "jsdom"
import { JSONPath } from "jsonpath-plus"

type ContentOptions = {
  selector?: string
  attribute?: string
  text?: boolean
  parseScriptJson?: boolean
  jsonPath?: string
  multiple?: boolean
}

function normalizeAttr(value: string | null | undefined): string | undefined {
  return value ?? undefined
}

export function extractContent(el: any, opts: ContentOptions = {}): any {
  const { selector, attribute, text, parseScriptJson, jsonPath, multiple } = opts

  const NodeElement = (el?.ownerDocument?.defaultView || {}).Element
  let nodes: any[] = []

  if (NodeElement && el instanceof NodeElement) {
    nodes = selector ? Array.from(el.querySelectorAll(selector)) : [el]
  } else {
    nodes = [el]
  }

  if (!multiple && nodes.length > 1) nodes = [nodes[0]]

  const results: any[] = []

  for (const node of nodes) {
    let value: any = undefined

    if (parseScriptJson && node?.textContent) {
      try {
        const parsed = JSON.parse(node.textContent.trim())
        value = jsonPath ? JSONPath({ path: jsonPath, json: parsed }) : parsed
      } catch {
        value = undefined
      }
    }

    if (value === undefined) {
      if (text && node?.textContent !== undefined) value = node.textContent.trim()
      else if (attribute && node?.getAttribute) value = normalizeAttr(node.getAttribute(attribute))
      else if (node?.innerHTML !== undefined) value = node.innerHTML.trim()
      else value = node
    }

    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) results.push(...value.filter(v => v != null))
      else results.push(value)
    }
  }

  return multiple ? results : results[0] ?? undefined
}
