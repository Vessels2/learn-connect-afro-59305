import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface Question {
  id: string;
  question_type: "multiple_choice" | "code_challenge" | "short_answer" | "essay";
  question_text: string;
  points: number;
  code_template?: string;
  options?: { text: string; is_correct: boolean }[];
}

export const AssessmentCreator = ({ courseId }: { courseId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assessmentType, setAssessmentType] = useState<"quiz" | "code_challenge" | "practice" | "graded">("quiz");
  const [timeLimit, setTimeLimit] = useState<number | undefined>();
  const [dueDate, setDueDate] = useState("");
  const [allowPeerReview, setAllowPeerReview] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question_type: "multiple_choice",
        question_text: "",
        points: 1,
        options: [
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
      },
    ]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId && q.options
          ? { ...q, options: [...q.options, { text: "", is_correct: false }] }
          : q
      )
    );
  };

  const updateOption = (questionId: string, optionIndex: number, text: string, isCorrect: boolean) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId && q.options
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? { text, is_correct: isCorrect } : opt
              ),
            }
          : q
      )
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId && q.options
          ? { ...q, options: q.options.filter((_, idx) => idx !== optionIndex) }
          : q
      )
    );
  };

  const createAssessmentMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: assessment, error: assessmentError } = await supabase
        .from("assessments")
        .insert({
          course_id: courseId,
          teacher_id: user.id,
          title,
          description,
          assessment_type: assessmentType,
          time_limit_minutes: timeLimit,
          due_date: dueDate || null,
          allow_peer_review: allowPeerReview,
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: question, error: questionError } = await supabase
          .from("assessment_questions")
          .insert({
            assessment_id: assessment.id,
            question_type: q.question_type,
            question_text: q.question_text,
            code_template: q.code_template,
            points: q.points,
            order_index: i,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        if (q.options && q.question_type === "multiple_choice") {
          const optionsData = q.options.map((opt, idx) => ({
            question_id: question.id,
            option_text: opt.text,
            is_correct: opt.is_correct,
            order_index: idx,
          }));

          const { error: optionsError } = await supabase
            .from("assessment_options")
            .insert(optionsData);

          if (optionsError) throw optionsError;
        }
      }

      return assessment;
    },
    onSuccess: () => {
      toast({ title: "Assessment created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["assessments", courseId] });
      setTitle("");
      setDescription("");
      setQuestions([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating assessment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Assessment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assessment title"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Assessment description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={assessmentType} onValueChange={(v: any) => setAssessmentType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="code_challenge">Code Challenge</SelectItem>
                <SelectItem value="practice">Practice Test</SelectItem>
                <SelectItem value="graded">Graded Test</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
            <Input
              id="timeLimit"
              type="number"
              value={timeLimit || ""}
              onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="peerReview"
            checked={allowPeerReview}
            onCheckedChange={setAllowPeerReview}
          />
          <Label htmlFor="peerReview">Allow Peer Review</Label>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Questions</h3>
            <Button onClick={addQuestion} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>

          {questions.map((question, qIdx) => (
            <Card key={question.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-4">
                    <div>
                      <Label>Question Type</Label>
                      <Select
                        value={question.question_type}
                        onValueChange={(v: any) => updateQuestion(question.id, { question_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="code_challenge">Code Challenge</SelectItem>
                          <SelectItem value="short_answer">Short Answer</SelectItem>
                          <SelectItem value="essay">Essay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Question {qIdx + 1}</Label>
                      <Textarea
                        value={question.question_text}
                        onChange={(e) =>
                          updateQuestion(question.id, { question_text: e.target.value })
                        }
                        placeholder="Enter your question"
                      />
                    </div>

                    <div>
                      <Label>Points</Label>
                      <Input
                        type="number"
                        value={question.points}
                        onChange={(e) =>
                          updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>

                    {question.question_type === "code_challenge" && (
                      <div>
                        <Label>Code Template</Label>
                        <Textarea
                          value={question.code_template || ""}
                          onChange={(e) =>
                            updateQuestion(question.id, { code_template: e.target.value })
                          }
                          placeholder="// Starting code template"
                          className="font-mono"
                        />
                      </div>
                    )}

                    {question.question_type === "multiple_choice" && question.options && (
                      <div className="space-y-2">
                        <Label>Options</Label>
                        {question.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <Input
                              value={option.text}
                              onChange={(e) =>
                                updateOption(question.id, optIdx, e.target.value, option.is_correct)
                              }
                              placeholder={`Option ${optIdx + 1}`}
                            />
                            <Switch
                              checked={option.is_correct}
                              onCheckedChange={(checked) =>
                                updateOption(question.id, optIdx, option.text, checked)
                              }
                            />
                            <Label>Correct</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(question.id, optIdx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(question.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          onClick={() => createAssessmentMutation.mutate()}
          disabled={!title || questions.length === 0 || createAssessmentMutation.isPending}
          className="w-full"
        >
          Create Assessment
        </Button>
      </CardContent>
    </Card>
  );
};
