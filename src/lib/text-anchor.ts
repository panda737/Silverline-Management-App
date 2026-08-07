/**
 * Anchoring a comment to the exact words a reviewer selected.
 *
 * The unit of anchoring is (section key, quote, offset-within-section-text):
 *
 *   - The QUOTE is what the reviewer actually selected, stored verbatim. Even if
 *     the anchor is later lost, the comment still says what it was about.
 *   - The OFFSET picks the right occurrence. "the applicant" appears dozens of
 *     times in one report; the quote alone cannot say which one was meant.
 *
 * Offsets are measured over the section's PLAIN TEXT, never its HTML, so they
 * survive a change of converter, of styling, or of tag structure — the same
 * prose re-rendered differently still anchors.
 */

/** A resolved selection inside one section, ready to become a comment. */
export type TextSelection = {
  sectionKey: string;
  sectionTitle: string;
  quote: string;
  quoteStart: number;
  /** Viewport rect of the selection, for placing the floating button. */
  rect: DOMRect;
  /** Offset from the top of the section's prose, so the rail can line up. */
  railTop: number;
};

/**
 * Longest quote we will store. Generous because a whole paragraph or table row
 * is a normal thing to comment on; past this a section-level remark is the
 * better tool.
 */
const MAX_QUOTE = 4000;

/**
 * Elements a reviewer can point at: paragraphs, list items, headings, table
 * ROWS. The granularity is one thought — the thing someone would say "this bit"
 * about — not one word and not one whole page.
 */
export const BLOCK_SELECTOR =
  "p, li, tr, h1, h2, h3, h4, h5, h6, blockquote, pre";

/**
 * The commentable block containing `node`, or null if it is outside the prose.
 *
 * Rows win over anything nested inside them: a remark about a row of figures is
 * about the row, not about whichever cell the pointer happened to be over, and
 * not about the <p> that a converted table wraps its cell contents in.
 *
 * Otherwise the INNERMOST matching block wins, so a list item inside a long
 * section is its own target rather than being swallowed by an ancestor.
 */
export function blockFor(prose: HTMLElement, node: Node): HTMLElement | null {
  const el =
    node.nodeType === 1 ? (node as HTMLElement) : node.parentElement;
  if (!el || !prose.contains(el)) return null;
  // Inside a comment card, not the document.
  if (el.closest(`[${SLOT_ATTR}]`)) return null;

  const row = el.closest<HTMLElement>("tr");
  if (row && prose.contains(row)) return row;

  const block = el.closest<HTMLElement>(BLOCK_SELECTOR);
  return block && prose.contains(block) ? block : null;
}

/**
 * Character offset of an element's text within `root`'s plain text.
 *
 * Same measure as offsetWithin, addressed by element rather than by text node.
 */
function offsetOfElement(root: HTMLElement, el: HTMLElement): number {
  const walker = textWalker(root);
  let total = 0;
  let current = walker.nextNode();
  while (current) {
    if (el.contains(current)) return total;
    total += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }
  return 0;
}

/**
 * Turn a whole block into a comment anchor.
 *
 * A block comment is not a separate kind of comment — it is an ordinary quote
 * anchor whose quote happens to be the block's entire text. Everything
 * downstream (finding it again, highlighting it, striking it out and suggesting
 * replacement wording) therefore works unchanged.
 */
export function readBlock(block: HTMLElement): TextSelection | null {
  const section = block.closest<HTMLElement>("[data-section-key]");
  if (!section) return null;
  const prose = section.querySelector<HTMLElement>("[data-prose]");
  if (!prose || !prose.contains(block)) return null;

  const quote = (block.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!quote || quote.length > MAX_QUOTE) return null;

  const rect = block.getBoundingClientRect();
  return {
    sectionKey: section.dataset.sectionKey ?? "",
    sectionTitle: section.dataset.sectionTitle ?? "",
    quote,
    quoteStart: offsetOfElement(prose, block),
    rect,
    railTop: rect.top - prose.getBoundingClientRect().top,
  };
}

/**
 * Marks a comment card that has been injected into the document flow.
 *
 * Everything that measures document text must skip these: a card's own words
 * are not part of the document, and counting them would push every anchor below
 * it out by the length of the comment.
 */
export const SLOT_ATTR = "data-comment-slot";

/** Text nodes of `root` in document order, excluding injected comment cards. */
export function textWalker(root: Node): TreeWalker {
  return document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.parentElement?.closest(`[${SLOT_ATTR}]`)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
}

/** The document's own text, with injected comment cards left out. */
export function plainTextOf(root: Node): string {
  const walker = textWalker(root);
  let out = "";
  let node = walker.nextNode();
  while (node) {
    out += node.textContent ?? "";
    node = walker.nextNode();
  }
  return out;
}

/**
 * Character offset of a node/offset pair within the text of `root`.
 *
 * Walks text nodes in document order, which is exactly the order plainTextOf
 * concatenates them, so the two measures agree.
 */
function offsetWithin(root: Node, node: Node, nodeOffset: number): number {
  const walker = textWalker(root);
  let total = 0;
  let current = walker.nextNode();
  while (current) {
    if (current === node) return total + nodeOffset;
    total += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }
  // Selection anchored to an element rather than a text node (a triple-click,
  // usually). Falling back to the start is better than a wrong offset.
  return 0;
}

/**
 * Read the current window selection, if it lies inside one section's prose.
 *
 * Returns null for a collapsed caret, whitespace-only selection, or a selection
 * spanning two sections — none of which is a thing a comment can attach to.
 */
export function readSelection(container: HTMLElement): TextSelection | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  const quote = sel.toString().replace(/\s+/g, " ").trim();
  if (!quote || quote.length > MAX_QUOTE) return null;

  // Both ends must sit in the same section's prose block.
  const startSection = (range.startContainer.nodeType === 1
    ? (range.startContainer as HTMLElement)
    : range.startContainer.parentElement
  )?.closest<HTMLElement>("[data-section-key]");
  const endSection = (range.endContainer.nodeType === 1
    ? (range.endContainer as HTMLElement)
    : range.endContainer.parentElement
  )?.closest<HTMLElement>("[data-section-key]");

  if (!startSection || startSection !== endSection) return null;
  if (!container.contains(startSection)) return null;

  const prose = startSection.querySelector<HTMLElement>("[data-prose]");
  if (!prose || !prose.contains(range.startContainer)) return null;

  const quoteStart = offsetWithin(prose, range.startContainer, range.startOffset);
  const rect = range.getBoundingClientRect();

  return {
    sectionKey: startSection.dataset.sectionKey ?? "",
    sectionTitle: startSection.dataset.sectionTitle ?? "",
    quote,
    quoteStart,
    rect,
    railTop: rect.top - prose.getBoundingClientRect().top,
  };
}

/** Where a stored quote actually sits in the rendered prose, or null if lost. */
export type ResolvedAnchor = { start: number; end: number };

/**
 * Find a stored quote in the section's current plain text.
 *
 * Tries the recorded offset first, then the nearest occurrence to it, so a
 * comment stays put when text is inserted above it. Returns null rather than
 * guessing when the quote is genuinely gone — an anchor on the wrong sentence is
 * worse than an honest "this text has changed".
 */
export function resolveAnchor(
  plainText: string,
  quote: string,
  quoteStart: number | null
): ResolvedAnchor | null {
  if (!quote) return null;
  const needle = quote.replace(/\s+/g, " ").trim();
  if (!needle) return null;

  // Whitespace in the rendered text may differ from what was selected, so match
  // against a normalised copy while keeping a map back to real indices.
  const map: number[] = [];
  let haystack = "";
  let lastWasSpace = false;
  for (let i = 0; i < plainText.length; i++) {
    const ch = plainText[i];
    if (/\s/.test(ch)) {
      if (lastWasSpace) continue;
      haystack += " ";
      map.push(i);
      lastWasSpace = true;
    } else {
      haystack += ch;
      map.push(i);
      lastWasSpace = false;
    }
  }

  const hits: number[] = [];
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    hits.push(at);
    from = at + 1;
  }
  if (hits.length === 0) return null;

  // Nearest hit to where it was when the comment was written.
  const target = quoteStart ?? 0;
  let best = hits[0];
  for (const h of hits) {
    if (Math.abs(map[h] - target) < Math.abs(map[best] - target)) best = h;
  }

  const startReal = map[best];
  const endIdx = best + needle.length - 1;
  const endReal = (map[endIdx] ?? map[map.length - 1]) + 1;
  return { start: startReal, end: endReal };
}

/**
 * Wrap [start,end) of `root`'s text in a <mark>, without disturbing the rest.
 *
 * Splits text nodes at the boundaries and wraps each touched node separately,
 * so a highlight may span several elements (bold runs, links) and still leave
 * the document's own markup intact.
 */
export function highlightRange(
  root: HTMLElement,
  start: number,
  end: number,
  attrs: Record<string, string>
): HTMLElement[] {
  const walker = textWalker(root);
  const marks: HTMLElement[] = [];
  const targets: { node: Text; from: number; to: number }[] = [];

  let seen = 0;
  let node = walker.nextNode() as Text | null;
  while (node) {
    const len = node.textContent?.length ?? 0;
    const nodeStart = seen;
    const nodeEnd = seen + len;
    if (nodeEnd > start && nodeStart < end) {
      targets.push({
        node,
        from: Math.max(0, start - nodeStart),
        to: Math.min(len, end - nodeStart),
      });
    }
    seen = nodeEnd;
    if (seen >= end) break;
    node = walker.nextNode() as Text | null;
  }

  // Mutate after walking — splitting text nodes mid-walk invalidates the walker.
  for (const t of targets) {
    let target = t.node;
    if (t.from > 0) target = target.splitText(t.from);
    if (t.to - t.from < (target.textContent?.length ?? 0)) {
      target.splitText(t.to - t.from);
    }
    const mark = document.createElement("mark");
    for (const [k, v] of Object.entries(attrs)) mark.setAttribute(k, v);
    target.parentNode?.insertBefore(mark, target);
    mark.appendChild(target);
    marks.push(mark);
  }

  return marks;
}
