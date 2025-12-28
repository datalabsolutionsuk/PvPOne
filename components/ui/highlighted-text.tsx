import React from "react";

interface HighlightedTextProps {
  text: string | null | undefined;
  query: string | undefined;
  className?: string;
}

export function HighlightedText({ text, query, className }: HighlightedTextProps) {
  if (!text) return null;
  if (!query || query.trim() === "") return <span className={className}>{text}</span>;

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
}
