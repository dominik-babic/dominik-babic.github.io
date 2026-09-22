/**
 * Minimal inline-markdown renderer for strings that live in frontmatter or data
 * files (tip summaries, entry descriptions, About prose) and are displayed
 * outside a markdown <Content /> body.
 * Escapes HTML, then supports `code`, [links](url), **bold** and *italic* spans.
 * Use with set:html on an element carrying the .md-inline class.
 */
export function inlineMd(text: string): string {
    const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    return escaped
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, href: string) =>
            /^https?:\/\//.test(href)
                ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
                : `<a href="${href}">${label}</a>`)
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
