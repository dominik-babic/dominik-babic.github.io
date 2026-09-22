import { defineCollection, z } from "astro:content";
import { file, glob } from "astro/loaders";

/**
 * Dates are modelled as real `Date` objects. YAML parses an unquoted
 * `2026-09-01` into a Date and Zod coerces the quoted form, so both spellings
 * work; an unparseable value fails the build. Format with fmtDate() at the
 * point of rendering — see src/scripts/date.ts.
 */
const date = z.coerce.date();

/**
 * YAML infers a type for every unquoted scalar: `2023` is read back as a number
 * and `2026-10-18` as a Date. Fields that hold free text but can look like a
 * date or a number — a book title, a `2026-09-12/13` label, a year — are
 * coerced back to a string, so a hand edit that drops the quotes cannot break
 * the build.
 */
const text = z
  .union([z.string(), z.number(), z.date()])
  .transform((value) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value));


const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) => z.object({
    title: text,
    date: date,
    tags: z.array(z.string()).optional(),
    /** Also used as the item description in the RSS feed, so it is required */
    description: z.string(),
    featured: z.boolean().optional(),
    type: z.enum(["tech", "personal"]).default("tech"),
    /** Optional preview image shown next to the entry in list views (path relative to the .md file) */
    image: image().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: ({ image }) => z.object({
    title: text,
    date: date,
    tags: z.array(z.string()).optional(),
    description: z.string(),
    featured: z.boolean().optional(),
    github: z.string().url().optional(),
    hasDetailPage: z.boolean().optional(),
    /** Optional preview image shown next to the entry in list views (path relative to the .md file) */
    image: image().optional(),
  }),
});

const tips = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/tips" }),
  schema: z.object({
    title: text,
    date: date,
    category: z.enum(["Tech", "Running", "Research"]),
    summary: z.string(),
  }),
});

/** One entry in the Education / Experience timelines (rendered by InfoCard) */
const infoCard = z.object({
  title: text,
  organisation: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  list: z.array(z.string()).optional(),
  startDate: text,
  endDate: text,
});

/**
 * Copy for the two About pages, one entry per page ("tech" / "personal").
 * Prose fields hold inline markdown, rendered with inlineMd().
 */
const about = defineCollection({
  loader: file("src/data/about.yaml"),
  schema: z.object({
    tagline: z.string(),
    intro: z.array(z.string()),
    contact: z.string(),
    /* tech page */
    education: z.array(infoCard).optional(),
    experience: z.array(infoCard).optional(),
    skills: z.object({
      focus: z.array(z.string()),
      toolbox: z.array(z.string()),
    }).optional(),
    /* personal page */
    hobbies: z.array(z.object({
      title: z.string(),
      text: z.string().optional(),
    })).optional(),
    races: z.object({
      intro: z.string().optional(),
      upcoming: z.array(z.object({
        date: date,
        endDate: date.optional(),
        display: text,
        event: z.string(),
        venue: z.string(),
        distance: z.string(),
        url: z.string().url().optional(),
      })).default([]),
    }).optional(),
    reading: z.object({
      intro: z.string().optional(),
      books: z.array(z.object({
        title: text,
        author: z.string(),
        url: z.string().url().optional(),
        source: z.string().optional(),
      })).default([]),
    }).optional(),
    playing: z.object({
      intro: z.string().optional(),
      games: z.array(z.object({
        title: text,
        url: z.string().url().optional(),
        store: z.string().optional(),
      })).default([]),
    }).optional(),
  }),
});

export const collections = {
  about,
  blog,
  projects,
  tips,
};
