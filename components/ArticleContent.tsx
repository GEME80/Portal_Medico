"use client";
import ReactMarkdown from "react-markdown";

interface ArticleContentProps {
  content: string;
}

/**
 * Renders article content with proper formatting.
 * - If content starts with an HTML tag (<p>, <h2>, etc.) it was created
 *   with the Tiptap WYSIWYG editor → render via dangerouslySetInnerHTML.
 * - If content contains Markdown indicators (**, ##, >, etc.) → use react-markdown.
 * - Otherwise treat as plain text with paragraph breaks.
 */
export default function ArticleContent({ content }: ArticleContentProps) {
  if (!content) {
    return <p style={{ color: "var(--slate-400)", fontStyle: "italic" }}>Este artículo no contiene texto adicional.</p>;
  }

  const trimmed = content.trim();

  // ── WYSIWYG HTML (from Tiptap) ──────────────────────────────────────────
  if (trimmed.startsWith("<")) {
    return (
      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }

  // ── Markdown (legacy articles) ──────────────────────────────────────────
  const hasMarkdown = /[#*_\-\[\]>`]/.test(trimmed);
  if (hasMarkdown) {
    return (
      <div className="article-content">
        <ReactMarkdown>{trimmed}</ReactMarkdown>
      </div>
    );
  }

  // ── Plain text — split double newlines into paragraphs ──────────────────
  const paragraphs = trimmed.split(/\n{2,}/);
  return (
    <div className="article-content">
      {paragraphs.map((p, i) => (
        <p key={i} style={{ marginBottom: "1.2em" }}>
          {p.split("\n").map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
