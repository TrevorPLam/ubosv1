import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Citation } from "@/api/chat";
import { cn } from "@/lib/utils";
import { Globe, BookOpen, FileText, ExternalLink } from "lucide-react";

interface CitationBadgeProps {
  number: number;
  citation?: Citation;
}

const SOURCE_ICONS = {
  web: Globe,
  knowledge_base: BookOpen,
  document: FileText,
} as const;

const SOURCE_LABELS = {
  web: "Web",
  knowledge_base: "Knowledge Base",
  document: "Document",
} as const;

export function CitationBadge({ number, citation }: CitationBadgeProps) {
  const badge = (
    <sup
      className={cn(
        "inline-flex items-center justify-center cursor-pointer",
        "px-1 py-0.5 mx-0.5 rounded text-[0.65em] font-semibold leading-none align-super",
        "bg-primary/10 text-primary hover:bg-primary/25 active:bg-primary/30",
        "transition-colors duration-150 select-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
      )}
      aria-label={citation ? `Citation ${number}: ${citation.title}` : `Citation ${number}`}
      tabIndex={citation ? 0 : undefined}
    >
      {number}
    </sup>
  );

  if (!citation) {
    return badge;
  }

  const Icon = SOURCE_ICONS[citation.sourceType];

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{badge}</HoverCardTrigger>
      <HoverCardContent
        className="w-80 p-0 overflow-hidden shadow-lg"
        side="top"
        align="start"
        sideOffset={8}
      >
        <div className="p-4 space-y-3">
          {/* Header: icon + title + badge number */}
          <div className="flex items-start gap-2.5">
            <div
              className="flex-shrink-0 w-6 h-6 rounded bg-primary/10 flex items-center justify-center mt-0.5"
              aria-hidden="true"
            >
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug line-clamp-2">
                {citation.title}
              </p>
              {citation.domain && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {citation.domain}
                  {citation.publishedAt && (
                    <span className="ml-2 opacity-70">
                      · {new Date(citation.publishedAt).getFullYear()}
                    </span>
                  )}
                </p>
              )}
            </div>
            <span
              className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold"
              aria-hidden="true"
            >
              {number}
            </span>
          </div>

          {/* Snippet */}
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {citation.snippet}
          </p>

          {/* Footer: source type label + external link */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              {SOURCE_LABELS[citation.sourceType]}
            </span>
            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "text-xs text-primary flex items-center gap-1",
                  "hover:underline focus:outline-none focus-visible:underline"
                )}
                onClick={(e) => e.stopPropagation()}
                aria-label={`View source: ${citation.title}`}
              >
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                View source
              </a>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
