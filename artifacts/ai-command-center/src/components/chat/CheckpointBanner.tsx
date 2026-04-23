import { Save } from "lucide-react";

export function CheckpointBanner({ title, time }: { title: string; time: string }) {
  return (
    <div className="flex items-center justify-center my-6 relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative bg-background px-4 text-xs text-muted-foreground flex items-center gap-2 border rounded-full py-1 shadow-sm">
        <Save className="w-3 h-3 text-primary" />
        <span className="font-semibold text-foreground">Checkpoint:</span> {title}
        <span className="opacity-50 ml-2">{time}</span>
      </div>
    </div>
  );
}
