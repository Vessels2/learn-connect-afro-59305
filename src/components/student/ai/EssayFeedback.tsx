import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function EssayFeedback() {
  const [loading, setLoading] = useState(false);
  const [essayText, setEssayText] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [feedback, setFeedback] = useState("");

  const getFeedback = async () => {
    if (!essayText.trim()) {
      toast.error("Please enter your essay text");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('essay-feedback', {
        body: { 
          essayText,
          assignmentTitle: assignmentTitle || "General Essay"
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setFeedback(data.feedback);
      toast.success("Feedback generated!");
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast.error("Failed to generate feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label>Assignment Title (Optional)</Label>
          <Input 
            placeholder="e.g., Climate Change Essay"
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>Your Essay</Label>
          <Textarea 
            placeholder="Paste your essay here..."
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {essayText.length} characters
          </p>
        </div>

        <Button 
          onClick={getFeedback}
          disabled={loading || !essayText.trim()}
          className="w-full gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Get AI Feedback
            </>
          )}
        </Button>
      </div>

      {feedback && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Essay Feedback
          </h3>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{feedback}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
}
