import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MessageFeedback } from "@/api/chat";

const FEEDBACK_CATEGORIES = [
  { value: "inaccurate", label: "Inaccurate", description: "The information is incorrect" },
  { value: "not_relevant", label: "Not relevant", description: "Doesn't address my question" },
  { value: "incomplete", label: "Incomplete", description: "Missing important details" },
  { value: "harmful", label: "Harmful", description: "Unsafe or inappropriate content" },
] as const;

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: typeof FEEDBACK_CATEGORIES[number]["value"], comment?: string) => void;
  isLoading?: boolean;
}

export function FeedbackModal({ isOpen, onClose, onSubmit, isLoading = false }: FeedbackModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("inaccurate");
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    onSubmit(selectedCategory as typeof FEEDBACK_CATEGORIES[number]["value"], comment.trim() || undefined);
    onClose();
    setSelectedCategory("inaccurate");
    setComment("");
  };

  const handleCancel = () => {
    onClose();
    setSelectedCategory("inaccurate");
    setComment("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Help us improve</DialogTitle>
          <DialogDescription>
            What was wrong with this response? Your feedback helps us provide better answers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">What's the issue?</Label>
            <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
              {FEEDBACK_CATEGORIES.map((category) => (
                <div key={category.value} className="flex items-start space-x-2">
                  <RadioGroupItem
                    value={category.value}
                    id={category.value}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={category.value}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {category.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {category.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-comment" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="feedback-comment"
              placeholder="Tell us more about what went wrong..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none h-20"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="min-w-[80px]"
          >
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
