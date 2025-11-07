import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function StudyRecommendations() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string>("");

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('study-recommendations', {
        body: { studentId: user.id }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setRecommendations(data.recommendations);
      toast.success("Recommendations generated!");
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast.error("Failed to generate recommendations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Personalized Study Plan</h3>
          <p className="text-sm text-muted-foreground">
            Get AI-powered recommendations based on your progress
          </p>
        </div>
        <Button 
          onClick={generateRecommendations}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Plan
            </>
          )}
        </Button>
      </div>

      {recommendations && (
        <Card className="p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{recommendations}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
}
