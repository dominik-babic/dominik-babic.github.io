import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const blogs = await getCollection("blog");
  blogs.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: "Dominik Babić",
    description:
      "Writing and notes on machine learning, security, self-hosting and running.",
    site: context.site!,
    items: blogs.map((blog) => ({
      title: blog.data.title,
      description: blog.data.description,
      pubDate: blog.data.date,
      link: `/blog/${blog.id}/`,
    })),
  });
}
