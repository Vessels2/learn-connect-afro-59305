import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, ExternalLink, CheckCircle, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

export function StudentAssignments({ studentId }: { studentId: string }) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionData, setSubmissionData] = useState({
    content: "",
    github_link: "",
  });

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      // Get enrolled courses
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", studentId);

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);

      // Get assignments for enrolled courses
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select("*, courses!assignments_course_id_fkey(title)")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });

      setAssignments(assignmentsData || []);

      // Get student submissions
      const { data: submissionsData } = await supabase
        .from("submissions")
        .select("*")
        .eq("student_id", studentId);

      if (submissionsData) {
        const submissionsMap = new Map();
        submissionsData.forEach(sub => {
          submissionsMap.set(sub.assignment_id, sub);
        });
        setSubmissions(submissionsMap);
      }
    } catch (error: any) {
      toast({
        title: "Error loading assignments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    try {
      const { error } = await supabase.from("submissions").insert({
        assignment_id: selectedAssignment.id,
        student_id: studentId,
        content: submissionData.content,
        github_link: submissionData.github_link || null,
      });

      if (error) throw error;

      toast({
        title: "Assignment submitted!",
        description: "Your teacher will grade it soon",
      });
      setOpen(false);
      setSubmissionData({ content: "", github_link: "" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error submitting assignment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openSubmitDialog = (assignment: any) => {
    setSelectedAssignment(assignment);
    setOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading assignments...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          My Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No assignments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const submission = submissions.get(assignment.id);
              const isSubmitted = !!submission;
              const isGraded = submission?.score !== null;

              return (
                <div
                  key={assignment.id}
                  className="p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{assignment.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {assignment.description || "No description"}
                      </p>
                      <div className="flex gap-2 flex-wrap mb-2">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {assignment.courses?.title}
                        </span>
                        {assignment.due_date && (
                          <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded">
                            Due: {formatDistanceToNow(new Date(assignment.due_date), { addSuffix: true })}
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded">
                          Max: {assignment.max_score} pts
                        </span>
                      </div>
                      {assignment.github_link && (
                        <a
                          href={assignment.github_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View template on GitHub
                        </a>
                      )}
                      {isSubmitted && (
                        <div className="mt-2 p-2 bg-primary/5 rounded text-sm">
                          {isGraded ? (
                            <p className="text-primary font-medium">
                              Graded: {submission.score}/{assignment.max_score} pts
                              {submission.feedback && <span className="block text-xs mt-1">{submission.feedback}</span>}
                            </p>
                          ) : (
                            <p className="text-muted-foreground">Submitted - Awaiting grade</p>
                          )}
                        </div>
                      )}
                    </div>
                    {isSubmitted ? (
                      <Button variant="outline" size="sm" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submitted
                      </Button>
                    ) : (
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => openSubmitDialog(assignment)}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="content">Your Work</Label>
                <Textarea
                  id="content"
                  value={submissionData.content}
                  onChange={(e) => setSubmissionData({ ...submissionData, content: e.target.value })}
                  placeholder="Describe your work or paste your answers..."
                  rows={6}
                  required
                />
              </div>
              <div>
                <Label htmlFor="github">GitHub Repository (Optional)</Label>
                <Input
                  id="github"
                  type="url"
                  value={submissionData.github_link}
                  onChange={(e) => setSubmissionData({ ...submissionData, github_link: e.target.value })}
                  placeholder="https://github.com/username/repo"
                />
              </div>
              <Button type="submit" className="w-full">Submit Assignment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}