import { ConversationSummary } from "@/api/chat";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Sparkles,
  Brain
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface SummaryPanelProps {
  summary: ConversationSummary | null;
  isLoading?: boolean;
  onGenerate?: () => void;
  onRefresh?: () => void;
  className?: string;
}

const summaryVariants: Variants = {
  hidden: { 
    opacity: 0, 
    height: 0,
    y: -20 
  },
  visible: { 
    opacity: 1, 
    height: "auto",
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    height: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

const contentVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      delay: 0.1,
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export function SummaryPanel({ 
  summary, 
  isLoading = false, 
  onGenerate, 
  onRefresh,
  className 
}: SummaryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!summary && !isLoading && !onGenerate) {
    return null;
  }

  return (
    <div className={cn("border-b bg-linear-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20", className)}>
      {/* Header */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            AI Summary
          </span>
          {summary && (
            <span className="text-xs text-blue-600 dark:text-blue-400">
              ({summary.messageCount} messages)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Generating...
            </div>
          )}

          {summary && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Update
            </Button>
          )}

          {!summary && !isLoading && onGenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerate}
              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Generate
            </Button>
          )}

          {summary && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpanded}
              className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {(summary || isLoading) && isExpanded && (
          <motion.div
            variants={summaryVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-6 pb-4">
              {isLoading ? (
                <motion.div
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Analyzing conversation...
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-blue-100 dark:bg-blue-900/30 rounded animate-pulse" />
                    <div className="h-3 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-blue-100 dark:bg-blue-900/30 rounded w-1/2 animate-pulse" />
                  </div>
                </motion.div>
              ) : summary ? (
                <motion.div
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {/* Overall Summary */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                      <FileText className="w-4 h-4" />
                      Summary
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                      {summary.overallSummary}
                    </p>
                  </motion.div>

                  {/* Key Points */}
                  {summary.keyPoints.length > 0 && (
                    <motion.div variants={itemVariants} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                        <CheckCircle className="w-4 h-4" />
                        Key Points
                      </div>
                      <ul className="space-y-1">
                        {summary.keyPoints.map((point, index) => (
                          <li
                            key={index}
                            className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-600 mt-1.5 shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Action Items */}
                  {summary.actionItems.length > 0 && (
                    <motion.div variants={itemVariants} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                        <CheckCircle className="w-4 h-4" />
                        Action Items
                      </div>
                      <ul className="space-y-1">
                        {summary.actionItems.map((item, index) => (
                          <li
                            key={index}
                            className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 dark:bg-green-600 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Metadata */}
                  <motion.div 
                    variants={itemVariants}
                    className="pt-2 border-t border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Generated {format(new Date(summary.generatedAt), "MMM d, h:mm a")}
                      </div>
                      {summary.isAutoGenerated && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          Auto-generated
                        </span>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
