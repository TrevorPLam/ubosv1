import { QueueItem } from "@/hooks/useAttentionQueue";
import { Button } from "@/components/ui/button";
import { Check, X, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DecisionPacketProps {
  item: QueueItem;
  onApprove: () => void;
  onReject: () => void;
}

export function DecisionPacket({ item, onApprove, onReject }: DecisionPacketProps) {
  return (
    <div className="bg-background border rounded-xl p-4 shadow-sm" data-testid={`decision-${item.id}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span className="font-semibold text-foreground">{item.agentName}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(item.timestamp))} ago</span>
        </div>
      </div>
      
      <h4 className="text-sm font-semibold mb-1 text-foreground">{item.title}</h4>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{item.description}</p>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={onReject}
          aria-label={`Reject ${item.title}`}
          data-testid={`btn-reject-${item.id}`}
        >
          <X className="w-4 h-4 mr-1.5" /> Reject
        </Button>
        <Button 
          size="sm" 
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onApprove}
          aria-label={`Approve ${item.title}`}
          data-testid={`btn-approve-${item.id}`}
        >
          <Check className="w-4 h-4 mr-1.5" /> Approve
        </Button>
      </div>
    </div>
  );
}
