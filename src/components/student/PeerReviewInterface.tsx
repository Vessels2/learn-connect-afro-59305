import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";

interface PeerReviewInterfaceProps {
  submissionId: string;
}

export const PeerReviewInterface = ({ submissionId }: PeerReviewInterfaceProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState("");
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});

  const { data: submission } = useQuery({
    queryKey: ["submission_for_review", submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_submissions")
        .select(`
          *,
          assessment:assessments(*),
          student:profiles(full_name),
          assessment_answers(*)
        `)
        .eq("id", submissionId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: rubric } = useQuery({
    queryKey: ["assessment_rubric", submission?.assessment?.id],
    queryFn: async () => {
      if (!submission?.assessment?.id) return null;

      const { data, error } = await supabase
        .from("assessment_rubrics")
        .select(`
          rubric:rubrics(
            *,
            rubric_criteria(*)
          )
        `)
        .eq("assessment_id", submission.assessment.id)
        .maybeSingle();

      if (error) throw error;
      return data?.rubric;
    },
    enabled: !!submission?.assessment?.id,
  });

  const { data: existingReview } = useQuery({
    queryKey: ["peer_review", submissionId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("peer_reviews")
        .select("*")
        .eq("submission_id", submissionId)
        .eq("reviewer_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const totalScore = Object.values(rubricScores).reduce((sum, score) => sum + score, 0);

      const { error } = await supabase.from("peer_reviews").insert({
        submission_id: submissionId,
        reviewer_id: user.id,
        score: totalScore,
        feedback,
        rubric_scores: rubricScores,
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Peer review submitted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["peer_review", submissionId] });
      setFeedback("");
      setRubricScores({});
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (existingReview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Review Completed
          </CardTitle>
          <CardDescription>You have already reviewed this submission</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Your Score</Label>
              <p className="text-2xl font-bold">{existingReview.score}</p>
            </div>
            <div>
              <Label>Your Feedback</Label>
              <p className="text-muted-foreground">{existingReview.feedback}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!submission) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Peer Review
          </CardTitle>
          <CardDescription>
            Review your peer's submission for: {submission.assessment?.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Student Answers</Label>
            <div className="space-y-4 mt-2">
              {submission.assessment_answers?.map((answer: any, idx: number) => (
                <Card key={answer.id}>
                  <CardContent className="pt-6">
                    <p className="font-medium mb-2">Question {idx + 1}</p>
                    {answer.answer_text && <p>{answer.answer_text}</p>}
                    {answer.code_answer && (
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                        <code>{answer.code_answer}</code>
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {rubric && rubric.rubric_criteria && (
            <div className="space-y-4">
              <Label>Rubric Scoring</Label>
              {rubric.rubric_criteria.map((criterion: any) => (
                <Card key={criterion.id}>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <p className="font-medium">{criterion.criterion_name}</p>
                      <p className="text-sm text-muted-foreground">{criterion.description}</p>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Score</span>
                        <span className="text-sm font-medium">
                          {rubricScores[criterion.id] || 0} / {criterion.max_points}
                        </span>
                      </div>
                      <Slider
                        value={[rubricScores[criterion.id] || 0]}
                        onValueChange={([value]) =>
                          setRubricScores({ ...rubricScores, [criterion.id]: value })
                        }
                        max={criterion.max_points}
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div>
            <Label htmlFor="feedback">Overall Feedback</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback for your peer..."
              className="min-h-[150px]"
            />
          </div>

          <Button
            onClick={() => submitReviewMutation.mutate()}
            disabled={!feedback || submitReviewMutation.isPending}
            className="w-full"
          >
            Submit Review
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
