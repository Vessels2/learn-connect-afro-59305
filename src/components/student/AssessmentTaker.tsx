import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle } from "lucide-react";

interface AssessmentTakerProps {
  assessmentId: string;
}

export const AssessmentTaker = ({ assessmentId }: AssessmentTakerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, { selected_option_id?: string; answer_text?: string; code_answer?: string }>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime] = useState(Date.now());

  const { data: assessment } = useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", assessmentId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: questions } = useQuery({
    queryKey: ["assessment_questions", assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_questions")
        .select("*, assessment_options(*)")
        .eq("assessment_id", assessmentId)
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const { data: existingSubmission } = useQuery({
    queryKey: ["assessment_submission", assessmentId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("assessment_submissions")
        .select("*")
        .eq("assessment_id", assessmentId)
        .eq("student_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingSubmission && existingSubmission.submitted_at) {
      return;
    }

    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, existingSubmission]);

  const startAssessmentMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("assessment_submissions")
        .insert({
          assessment_id: assessmentId,
          student_id: user.id,
          is_practice: assessment?.assessment_type === "practice",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSubmissionId(data.id);
      toast({ title: "Assessment started!" });
    },
  });

  const submitAssessmentMutation = useMutation({
    mutationFn: async () => {
      if (!submissionId) throw new Error("No submission found");

      const answerData = Object.entries(answers).map(([questionId, answer]) => ({
        submission_id: submissionId,
        question_id: questionId,
        ...answer,
      }));

      const { error: answersError } = await supabase
        .from("assessment_answers")
        .insert(answerData);

      if (answersError) throw answersError;

      const timeInMinutes = Math.floor(timeElapsed / 60);

      const { error: submissionError } = await supabase
        .from("assessment_submissions")
        .update({
          submitted_at: new Date().toISOString(),
          time_taken_minutes: timeInMinutes,
        })
        .eq("id", submissionId);

      if (submissionError) throw submissionError;

      const { error: gradeError } = await supabase.rpc("auto_grade_submission", {
        p_submission_id: submissionId,
      });

      if (gradeError) throw gradeError;
    },
    onSuccess: () => {
      toast({ title: "Assessment submitted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["assessment_submission", assessmentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting assessment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!assessment || !questions) {
    return <div>Loading...</div>;
  }

  if (existingSubmission?.submitted_at) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Assessment Completed
          </CardTitle>
          <CardDescription>
            You submitted this assessment on {new Date(existingSubmission.submitted_at).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {existingSubmission.score !== null && (
            <div className="text-lg font-semibold">
              Score: {existingSubmission.score} / {assessment.max_score}
            </div>
          )}
          {existingSubmission.feedback && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Feedback:</h4>
              <p className="text-muted-foreground">{existingSubmission.feedback}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!submissionId && !existingSubmission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{assessment.title}</CardTitle>
          <CardDescription>{assessment.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Type:</strong> {assessment.assessment_type}
            </div>
            {assessment.time_limit_minutes && (
              <div>
                <strong>Time Limit:</strong> {assessment.time_limit_minutes} minutes
              </div>
            )}
            <div>
              <strong>Questions:</strong> {questions.length}
            </div>
            <Button onClick={() => startAssessmentMutation.mutate()}>
              Start Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{assessment.title}</CardTitle>
            <CardDescription>{assessment.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeElapsed)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question, idx) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">
                Question {idx + 1} ({question.points} points)
              </CardTitle>
              <CardDescription>{question.question_text}</CardDescription>
            </CardHeader>
            <CardContent>
              {question.question_type === "multiple_choice" && question.assessment_options && (
                <RadioGroup
                  value={answers[question.id]?.selected_option_id || ""}
                  onValueChange={(value) =>
                    setAnswers({ ...answers, [question.id]: { selected_option_id: value } })
                  }
                >
                  {question.assessment_options.map((option: any) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id}>{option.option_text}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.question_type === "code_challenge" && (
                <Textarea
                  value={answers[question.id]?.code_answer || question.code_template || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [question.id]: { code_answer: e.target.value } })
                  }
                  placeholder="Write your code here..."
                  className="font-mono min-h-[200px]"
                />
              )}

              {(question.question_type === "short_answer" || question.question_type === "essay") && (
                <Textarea
                  value={answers[question.id]?.answer_text || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [question.id]: { answer_text: e.target.value } })
                  }
                  placeholder="Type your answer here..."
                  className={question.question_type === "essay" ? "min-h-[200px]" : ""}
                />
              )}
            </CardContent>
          </Card>
        ))}

        <Button
          onClick={() => submitAssessmentMutation.mutate()}
          disabled={submitAssessmentMutation.isPending}
          className="w-full"
        >
          Submit Assessment
        </Button>
      </CardContent>
    </Card>
  );
};
