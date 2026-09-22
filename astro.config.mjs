import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

/**
 * Astro gives local markdown images `loading`/`decoding` hints through the asset
 * pipeline, but leaves images pointing at remote URLs bare. Apply the same hints
 * so a figure written as plain markdown behaves the same either way.
 */
function rehypeImageHints() {
  return (tree) => {
    const walk = (node) => {
      if (node.tagName === 'img' && node.properties) {
        node.properties.loading ??= 'lazy';
        node.properties.decoding ??= 'async';
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}


/**
 * Move an image's markdown title — `![alt](src "caption")`, what the CMS image
 * dialog writes — onto a data attribute, and take it off the node.
 *
 * This has to happen in remark: Astro rebuilds a local image's attributes from
 * the parsed node after rehype plugins run, so a title removed later reappears
 * in the HTML as a tooltip duplicating the visible caption.
 */
function remarkImageCaptions() {
  return (tree) => {
    const walk = (node) => {
      if (node.type === 'image' && node.title) {
        node.data ??= {};
        node.data.hProperties = { ...node.data.hProperties, 'data-caption': node.title };
        node.title = null;
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

/**
 * Turn a paragraph that holds nothing but images into a <figure>, captioned
 * from the image title — `![alt](src "caption")`, which is what the CMS image
 * dialog writes.
 *
 * Captions are deliberately tied to the image rather than inferred from an
 * adjacent paragraph: any adjacency rule also matches ordinary prose that
 * happens to follow a figure, which is how a whole paragraph once ended up
 * styled as a caption. On a multi-image row the first title found captions the
 * row, since a figure is one unit.
 */
function rehypeFigures() {
  const blank = (n) => n.type === 'text' && !n.value.trim();
  const parts = (n) => (n.children ?? []).filter((c) => !blank(c));
  const isFigure = (n) =>
    n.tagName === 'p' && parts(n).length > 0 && parts(n).every((c) => c.tagName === 'img');
  const el = (tagName, children) => ({ type: 'element', tagName, properties: {}, children });

  // remarkImageCaptions parked the caption here; hast may spell the key either
  // way depending on how the properties were built.
  const readTitle = (img) => {
    const props = img.properties ?? {};
    return props['data-caption'] ?? props.dataCaption ?? '';
  };

  const clearTitle = (img) => {
    const props = img.properties ?? {};
    delete props['data-caption'];
    delete props.dataCaption;
  };

  return (tree) => {
    const walk = (node) => {
      if (!Array.isArray(node.children)) return;
      const out = [];
      for (let i = 0; i < node.children.length; i += 1) {
        const child = node.children[i];
        if (child.type !== 'element' || !isFigure(child)) {
          walk(child);
          out.push(child);
          continue;
        }
        const images = parts(child);
        const figure = el('figure', [el('div', images)]);

        // An image caption wins: it is attached to the image itself, so it can
        // never be confused with body text that happens to sit underneath.
        const title = images.map(readTitle).find(Boolean);
        if (title) {
          figure.children.push(el('figcaption', [{ type: 'text', value: title }]));
          images.forEach(clearTitle);
        }
        out.push(figure);
      }
      node.children = out;
    };
    walk(tree);
  };
}

export default defineConfig({
  output: 'static',
  site: 'https://dominik-babic.github.io',
  base: '/',

  redirects: {
    '/about': '/about/tech',
    '/blog': '/blog/tech',
  },

  markdown: {
    remarkPlugins: [remarkImageCaptions],
    rehypePlugins: [rehypeImageHints, rehypeFigures]
  },

  integrations: [
    mdx(),
    sitemap()
  ],

  build: {
    assets: 'assets'
  },

  vite: {
    plugins: [tailwindcss()]
  }
});
