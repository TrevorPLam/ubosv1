import { Progress } from "./progress";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
}

export function ProgressBar({ value, max = 100, label }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-mono text-muted-foreground">{Math.round(percentage)}%</span>
        </div>
      )}
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
