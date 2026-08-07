-- Anchor comments to the SELECTED TEXT, not just the section.
--
-- The first cut anchored to a section heading, on the reasoning that precise
-- drag-select is the first thing that fails for a reviewer who is not a precise
-- mouse user. That reasoning was wrong for this reviewer: he has marked up Word
-- documents for years and asked for exactly that ("it must be inline, almost
-- like Word edits"). Section anchoring also made the composer open at the top of
-- a long section, so a remark about something near the bottom meant scrolling
-- away from the passage being written about.
--
-- Section anchoring is kept, not replaced: quote is nullable, so a whole-section
-- or whole-document remark is still a first-class comment.

alter table public.document_comments
  -- The exact run of text the reviewer selected. Stored verbatim so the comment
  -- still says what it was about even if the document is later re-rendered, the
  -- converter changes, or the anchor can no longer be found.
  add column quote text,
  -- Character offset of that run within the section's plain text. The quote
  -- alone is ambiguous — "the applicant" occurs dozens of times in one report —
  -- so the offset picks the right occurrence. Advisory: if the text has shifted,
  -- the renderer falls back to the first exact match, and if there is none the
  -- comment shows as unanchored rather than attaching to the wrong sentence.
  add column quote_start integer,
  -- Set when the reviewer proposes replacement wording rather than only
  -- remarking. Null means a plain comment. This is what makes it a suggestion
  -- ("strike that, it should say this") instead of a note.
  add column suggested_text text;

comment on column public.document_comments.quote is
  'Verbatim text the reviewer selected; null for a section- or document-level remark.';
comment on column public.document_comments.quote_start is
  'Character offset of quote within the section plain text; disambiguates repeated phrases.';
comment on column public.document_comments.suggested_text is
  'Proposed replacement for quote. Null = plain comment, not a suggestion.';

-- A suggestion has to be a suggestion ABOUT something; replacement wording with
-- nothing to replace is meaningless and would render as a dangling strike-out.
alter table public.document_comments
  add constraint document_comments_suggestion_needs_quote
  check (suggested_text is null or quote is not null);

-- Rendering a section pulls every comment anchored in it and positions each one
-- against its quote, so this is the hot path for the review page.
create index document_comments_anchor_idx
  on public.document_comments (document_id, section_key, quote_start);
