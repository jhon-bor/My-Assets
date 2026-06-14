import { defineCollection, z } from "astro:content";

const notes = defineCollection({
  schema: z.object({
    // Bilingual+ titles (first two are required for backward compat)
    title_zh: z.string(),
    title_en: z.string().optional(),
    title_ja: z.string().optional(),
    title_fr: z.string().optional(),
    title_es: z.string().optional(),
    title_pt: z.string().optional(),
    title_de: z.string().optional(),
    title_it: z.string().optional(),
    // Shared metadata
    date: z.date(),
    updated: z.date().optional(),
    tags: z.array(z.string()).default([]),
    folder: z.string().default(""),
    // Bilingual+ summaries
    summary_zh: z.string().optional(),
    summary_en: z.string().optional(),
    summary_ja: z.string().optional(),
    summary_fr: z.string().optional(),
    summary_es: z.string().optional(),
    summary_pt: z.string().optional(),
    summary_de: z.string().optional(),
    summary_it: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    premium: z.boolean().default(false),
    attachments: z.array(z.string()).default([]),
  }),
});

export const collections = { notes };