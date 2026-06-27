"use client";
import ReactMarkdown from "react-markdown";

interface ArticleContentProps {
  content: string;
}

/**
 * Renders article content with proper formatting.
 * Supports markdown syntax (headings, bold, italic, lists, links, etc.)
 * and also handles plain text with double-newline paragraph breaks.
 */
export default function ArticleContent({ content }: ArticleContentProps) {
  if (!content) {
    return <p style={{ color: "var(--slate-400)", fontStyle: "italic" }}>Este artículo no contiene texto adicional.</p>;
  }

  // Check if content has any markdown indicators
  const hasMarkdown = /[#*_\-\[\]>`]/.test(content);

  if (hasMarkdown) {
    return (
      <div className="article-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  // For plain text: split by double newlines into paragraphs
  const paragraphs = content.split(/\n{2,}/);
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
