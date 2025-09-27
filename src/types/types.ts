import { z } from "zod"

export const SpiderFieldTypeSchema = z.enum([
  "string",
  "string[]",
  "url",
  "number",
  "object[]",
])
export type SpiderFieldType = z.infer<typeof SpiderFieldTypeSchema>

export const SpiderFieldSchema = z.object({
  name: z.string(),
  type: SpiderFieldTypeSchema,
})
export type SpiderField = z.infer<typeof SpiderFieldSchema>

export const SpiderTypeSchema = z.object({
  fields: z.array(SpiderFieldSchema),
})
export type SpiderType = z.infer<typeof SpiderTypeSchema>

export const SelectorWithAttributeSchema = z.object({
  selector: z.string().optional(),
  attribute: z.string().optional(),
  text: z.boolean().optional(),
  multiple: z.boolean().optional(),
  arranger: z.enum(["newestFirst", "oldestFirst"]).optional(),
  parseScriptJson: z.boolean().optional(),
  jsonPath: z.string().optional(),
})
export type SelectorWithAttribute = z.infer<typeof SelectorWithAttributeSchema>

export const SelectorOnlySchema = z.object({
  selector: z.string().optional(),
  parseScriptJson: z.boolean().optional(),
  jsonPath: z.string().optional(),
})
export type SelectorOnly = z.infer<typeof SelectorOnlySchema>

export const PageImageSchema = z.object({
  arrayVar: z
    .object({
      variableNames: z.array(z.string()).optional(),
      matchPattern: z.string().optional(),
      scriptMatch: z.string().optional(),
    })
    .optional(),
  selectors: z.array(z.string()).optional(),
  attribute: z.string().optional(),
  multiple: z.boolean().optional(),
  parseScriptJson: z.boolean().optional(),
  jsonPath: z.string().optional(),
})

export const SpiderItemSchema = z.object({
  selector: z.string().optional(),
  ProfileLink: SelectorWithAttributeSchema.optional(),
  ProfileTarget: z
    .object({
      Url: SelectorWithAttributeSchema.optional(),
      Image: SelectorWithAttributeSchema.optional(),
      Name: SelectorOnlySchema.optional(),
      Description: SelectorOnlySchema.optional(),
      Genres: z
        .object({
          selector: z.string().optional(),
          multiple: z.boolean().optional(),
          parseScriptJson: z.boolean().optional(),
          jsonPath: z.string().optional(),
        })
        .optional(),
      MangaID: SelectorWithAttributeSchema.optional(),
      Chapters: SelectorWithAttributeSchema,
      PageImage: PageImageSchema.optional(),
    })
    .optional(),
  Name: SelectorOnlySchema.optional(),
  HighlightText: SelectorOnlySchema.optional(),
  Genres: z
    .object({
      selector: z.string().optional(),
      multiple: z.boolean().optional(),
      parseScriptJson: z.boolean().optional(),
      jsonPath: z.string().optional(),
    })
    .optional(),
  profileById: z
    .object({
      urlPattern: z.string(),
      replace: z
        .object({
          pattern: z.string(),
          with: z.string(),
        })
        .optional(),
      ProfileTarget: z.object({
        Url: SelectorWithAttributeSchema.optional(),
        Image: SelectorWithAttributeSchema.optional(),
        Name: SelectorOnlySchema.optional(),
        Description: SelectorOnlySchema.optional(),
        Genres: z
          .object({
            selector: z.string().optional(),
            multiple: z.boolean().optional(),
            parseScriptJson: z.boolean().optional(),
            jsonPath: z.string().optional(),
          })
          .optional(),
        MangaID: SelectorWithAttributeSchema.optional(),
        Chapters: SelectorWithAttributeSchema,
        PageImage: PageImageSchema.optional(),
      }),
    })
    .optional(),
})

export type SpiderItem = z.infer<typeof SpiderItemSchema>

export const SpiderSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  types: SpiderTypeSchema.optional(),
  targetUrl: z.string(),
  itemConfig: SpiderItemSchema.optional(),
})
export type Spider = z.infer<typeof SpiderSchema>
