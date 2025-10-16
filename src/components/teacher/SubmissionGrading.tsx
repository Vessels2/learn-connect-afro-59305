import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, Github, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const getLetterGrade = (score: number): string => {
  if (score >= 70) return "A";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 40) return "D";
  return "F";
};

export function SubmissionGrading({ teacherId }: { teacherId: string }) {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [gradeData, setGradeData] = useState({ score: 0, feedback: "" });

  useEffect(() => {
    loadSubmissions();
  }, [teacherId]);

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          assignments!inner(
            id,
            title,
            max_score,
            course_id,
            courses!inner(teacher_id)
          ),
          profiles!submissions_student_id_fkey(full_name, email)
        `)
        .eq("assignments.courses.teacher_id", teacherId)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading submissions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      const { error } = await supabase
        .from("submissions")
        .update({
          score: gradeData.score,
          feedback: gradeData.feedback,
          graded_at: new Date().toISOString(),
        })
        .eq("id", selectedSubmission.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Submission graded: ${gradeData.score}/${selectedSubmission.assignments.max_score} (${getLetterGrade(gradeData.score)})`,
      });

      setSelectedSubmission(null);
      setGradeData({ score: 0, feedback: "" });
      loadSubmissions();
    } catch (error: any) {
      toast({
        title: "Error grading submission",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openGradeDialog = (submission: any) => {
    setSelectedSubmission(submission);
    setGradeData({
      score: submission.score || 0,
      feedback: submission.feedback || "",
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading submissions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Student Submissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div key={submission.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{submission.profiles?.full_name}</h3>
                      {submission.score !== null && (
                        <Badge variant="secondary">
                          {getLetterGrade(submission.score)} - {submission.score}/{submission.assignments.max_score}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {submission.profiles?.email}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      Assignment: {submission.assignments?.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted: {new Date(submission.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant={submission.score === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => openGradeDialog(submission)}
                      >
                        {submission.score === null ? "Grade" : "Update Grade"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Grade Submission</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                          <p><strong>Student:</strong> {submission.profiles?.full_name}</p>
                          <p><strong>Assignment:</strong> {submission.assignments?.title}</p>
                          <p><strong>Max Score:</strong> {submission.assignments?.max_score}</p>
                        </div>

                        {submission.content && (
                          <div>
                            <Label>Submission Content</Label>
                            <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {submission.content}
                            </div>
                          </div>
                        )}

                        {submission.github_link && (
                          <a
                            href={submission.github_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <Github className="h-4 w-4" />
                            View GitHub Submission
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}

                        <form onSubmit={handleGrade} className="space-y-4">
                          <div>
                            <Label htmlFor="score">Score (out of {submission.assignments?.max_score})</Label>
                            <Input
                              id="score"
                              type="number"
                              min="0"
                              max={submission.assignments?.max_score}
                              value={gradeData.score}
                              onChange={(e) => setGradeData({ ...gradeData, score: parseInt(e.target.value) || 0 })}
                              required
                            />
                            {gradeData.score > 0 && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Letter Grade: <strong>{getLetterGrade(gradeData.score)}</strong>
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="feedback">Feedback</Label>
                            <Textarea
                              id="feedback"
                              value={gradeData.feedback}
                              onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                              rows={5}
                              placeholder="Provide feedback for the student..."
                            />
                          </div>

                          <Button type="submit" className="w-full">
                            Save Grade
                          </Button>
                        </form>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {submission.feedback && (
                  <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                    <strong>Feedback:</strong> {submission.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
