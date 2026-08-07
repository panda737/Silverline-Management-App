import mammoth from "mammoth";
import { marked } from "marked";

/**
 * Turning a document into commentable pieces.
 *
 * Comments anchor to a SECTION, not a character range. That is a deliberate
 * accessibility decision: precise drag-select is the first thing that fails for
 * a reviewer who is not a precise mouse user, and our reviewers comment at the
 * level of "§3.6 storage" anyway, never at the level of a single word.
 *
 * Section keys must survive a re-render of the same document, so they are
 * derived from the heading text (slugged) plus an occurrence counter for
 * duplicates — not from array position, which shifts whenever a heading is
 * added above.
 */

export type DocumentSection = {
  /** Stable anchor stored on the comment row. */
  key: string;
  /** Heading text shown in the comment list. */
  title: string;
  /** 1–3; drives indentation only. */
  level: number;
  /** Inner HTML of everything under this heading, up to the next one. */
  html: string;
};

export type RenderedDocument = {
  sections: DocumentSection[];
  /** Non-fatal conversion notes from mammoth (unsupported styles etc.). */
  warnings: string[];
};

/** File extensions we can render in the browser. Anything else downloads. */
export const RENDERABLE_EXTENSIONS = ["docx", "md", "markdown", "txt"] as const;

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function isRenderable(name: string): boolean {
  return (RENDERABLE_EXTENSIONS as readonly string[]).includes(
    extensionOf(name)
  );
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "section"
  );
}

/**
 * Walk the converted HTML and cut it at every h1/h2/h3.
 *
 * Content that appears before the first heading (title blocks, the "WORKING
 * DRAFT — NOT FOR SUBMISSION" banner) is kept as an untitled opening section so
 * it is never silently dropped — that banner is often the most important thing
 * on the page.
 */
function splitIntoSections(html: string): DocumentSection[] {
  const doc = new DOMParser().parseFromString(
    `<div id="root">${html}</div>`,
    "text/html"
  );
  const root = doc.getElementById("root");
  if (!root) return [];

  const sections: DocumentSection[] = [];
  const usedKeys = new Map<string, number>();

  let current: { key: string; title: string; level: number; nodes: Node[] } = {
    key: "opening",
    title: "Opening",
    level: 1,
    nodes: [],
  };

  const flush = () => {
    if (current.nodes.length === 0 && current.key === "opening") return;
    const wrapper = doc.createElement("div");
    current.nodes.forEach((n) => wrapper.appendChild(n.cloneNode(true)));
    sections.push({
      key: current.key,
      title: current.title,
      level: current.level,
      html: wrapper.innerHTML,
    });
  };

  Array.from(root.childNodes).forEach((node) => {
    const el = node.nodeType === 1 ? (node as HTMLElement) : null;
    const tag = el?.tagName.toLowerCase() ?? "";

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      flush();
      const title = (el?.textContent ?? "").trim() || "Untitled section";
      const base = slugify(title);
      const seen = usedKeys.get(base) ?? 0;
      usedKeys.set(base, seen + 1);
      current = {
        key: seen === 0 ? base : `${base}-${seen + 1}`,
        title,
        level: Number(tag.slice(1)),
        nodes: [],
      };
      return;
    }

    current.nodes.push(node);
  });

  flush();
  return sections;
}

/**
 * Convert a stored document into sections.
 *
 * Returns null for formats we cannot render (PDF, images, spreadsheets) — the
 * caller falls back to download-only, which is honest rather than showing a
 * broken preview.
 */
export async function renderDocument(
  blob: Blob,
  filename: string
): Promise<RenderedDocument | null> {
  const ext = extensionOf(filename);

  if (ext === "docx") {
    const arrayBuffer = await blob.arrayBuffer();
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        // Word's built-in heading styles map to h1–h3 by default. Silverline
        // house documents also use bold single-line paragraphs as pseudo
        // headings; those stay as paragraphs, which is correct — inventing
        // sections from formatting guesses would scatter comments randomly.
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
        ],
      }
    );
    return {
      sections: splitIntoSections(result.value),
      warnings: result.messages.map((m) => m.message),
    };
  }

  if (ext === "md" || ext === "markdown") {
    const text = await blob.text();
    const html = await marked.parse(text, { async: true, gfm: true });
    return { sections: splitIntoSections(html), warnings: [] };
  }

  if (ext === "txt") {
    const text = await blob.text();
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return {
      sections: [
        {
          key: "document",
          title: "Document",
          level: 1,
          html: `<pre class="whitespace-pre-wrap">${escaped}</pre>`,
        },
      ],
      warnings: [],
    };
  }

  return null;
}
