import type { ReactNode } from "react";

/**
 * A deliberately small Markdown renderer for assistant replies.
 *
 * Scope is the subset the chat system prompt actually asks for — prose
 * paragraphs, bold, inline code, bullet and numbered lists, headings, block
 * quotes for quoted licence wording, and pipe tables. Anything it does not
 * recognise is rendered as plain text rather than guessed at, so an unsupported
 * construct degrades to something readable instead of being mangled.
 *
 * Tables are here because the assistant genuinely produces them: asked which
 * projects are at risk, it laid out deadline-versus-status as a table, which was
 * the right call for that content. Without table support those rows collapse
 * into a single run of pipe characters — the one degradation ugly enough to
 * matter, so it gets handled rather than tolerated.
 *
 * The alternative was a Markdown dependency. Not worth the bundle for this
 * subset, and this way the failure mode is visible rather than surprising.
 */

/** Bold and inline code inside a line. Ordered so `**` wins over `*`. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Split on the two markers we support, keeping the delimiters.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  parts.forEach((part, i) => {
    if (!part) return;
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      out.push(
        <strong key={key} className="font-medium text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      out.push(
        <code
          key={key}
          className="rounded bg-muted px-1 py-px font-mono text-[0.85em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    } else {
      out.push(part);
    }
  });
  return out;
}

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "h"; level: number; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "quote"; lines: string[] }
  | { kind: "table"; header: string[]; rows: string[][] };

/** `| a | b |` → ["a","b"], tolerating missing outer pipes. */
function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

const isTableRow = (line: string) => line.trim().startsWith("|");
/** The `|---|:--:|` separator that makes the line above it a header. */
const isTableDivider = (line: string) =>
  /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes("-");

/** Group lines into blocks. Blank lines close whatever is open. */
function parse(src: string): Block[] {
  const blocks: Block[] = [];
  let open: Block | null = null;
  const close = () => {
    if (open) blocks.push(open);
    open = null;
  };

  const lines = src.replace(/\r\n/g, "\n").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (!line.trim()) {
      close();
      continue;
    }

    // Tables need one line of lookahead: a pipe row only starts a table if the
    // NEXT line is the `|---|` divider. Without that check, a paragraph that
    // happens to contain pipes would be eaten as a table.
    if (isTableRow(line) && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      close();
      const header = splitRow(line);
      const rows: string[][] = [];
      i += 2; // past the header and its divider
      while (i < lines.length && isTableRow(lines[i])) {
        const cells = splitRow(lines[i]);
        // Pad or trim to the header width so the grid never goes ragged.
        while (cells.length < header.length) cells.push("");
        rows.push(cells.slice(0, header.length));
        i++;
      }
      i--; // the outer loop will advance past the first non-table line
      blocks.push({ kind: "table", header, rows });
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      close();
      blocks.push({ kind: "h", level: heading[1].length, text: heading[2] });
      continue;
    }

    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      if (open?.kind !== "ul") {
        close();
        open = { kind: "ul", items: [] };
      }
      open.items.push(bullet[1]);
      continue;
    }

    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      if (open?.kind !== "ol") {
        close();
        open = { kind: "ol", items: [] };
      }
      open.items.push(numbered[1]);
      continue;
    }

    const quote = /^\s*>\s?(.*)$/.exec(line);
    if (quote) {
      if (open?.kind !== "quote") {
        close();
        open = { kind: "quote", lines: [] };
      }
      open.lines.push(quote[1]);
      continue;
    }

    // A continuation line inside a list item belongs to that item; anything
    // else starts or extends a paragraph.
    if (open?.kind === "ul" || open?.kind === "ol") {
      if (/^\s{2,}\S/.test(raw)) {
        open.items[open.items.length - 1] += ` ${line.trim()}`;
        continue;
      }
      close();
    }
    if (open?.kind !== "p") {
      close();
      open = { kind: "p", lines: [] };
    }
    open.lines.push(line);
  }
  close();
  return blocks;
}

export function Markdown({ source }: { source: string }) {
  const blocks = parse(source);
  return (
    <div className="space-y-3 text-[0.9375rem] leading-relaxed">
      {blocks.map((block, i) => {
        const key = `b${i}`;
        switch (block.kind) {
          case "h":
            return (
              <p
                key={key}
                className="pt-1 text-[0.9375rem] font-medium text-foreground"
              >
                {renderInline(block.text, key)}
              </p>
            );
          case "ul":
            return (
              <ul key={key} className="ml-1 space-y-1.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-[0.55em] size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                    <span>{renderInline(item, `${key}-${j}`)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="ml-1 space-y-1.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {j + 1}.
                    </span>
                    <span>{renderInline(item, `${key}-${j}`)}</span>
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={key}
                className="border-l-2 border-border pl-3 text-muted-foreground italic"
              >
                {renderInline(block.lines.join(" "), key)}
              </blockquote>
            );
          case "table":
            return (
              // Scrolls inside itself — a wide table must not push the chat
              // column sideways.
              <div key={key} className="-mx-1 overflow-x-auto px-1">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {block.header.map((cell, j) => (
                        <th
                          key={j}
                          className="py-1.5 pr-4 text-left font-medium whitespace-nowrap"
                        >
                          {renderInline(cell, `${key}-h${j}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={j} className="border-b border-border/40 last:border-0">
                        {row.map((cell, k) => (
                          <td
                            key={k}
                            className="py-1.5 pr-4 align-top text-muted-foreground"
                          >
                            {renderInline(cell, `${key}-${j}-${k}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return <p key={key}>{renderInline(block.lines.join(" "), key)}</p>;
        }
      })}
    </div>
  );
}
