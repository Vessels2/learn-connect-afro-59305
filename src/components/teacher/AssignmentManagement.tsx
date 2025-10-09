import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Github } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AssignmentManagement({ teacherId }: { teacherId: string }) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    description: "",
    due_date: "",
    max_score: 100,
    github_link: "",
  });

  useEffect(() => {
    loadData();
  }, [teacherId]);

  const loadData = async () => {
    try {
      // Load teacher's courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_id", teacherId);

      setCourses(coursesData || []);

      // Load assignments
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select("*, courses!assignments_course_id_fkey(title)")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });

      setAssignments(assignmentsData || []);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("assignments").insert({
        ...formData,
        teacher_id: teacherId,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment created successfully",
      });
      setOpen(false);
      setFormData({
        course_id: "",
        title: "",
        description: "",
        due_date: "",
        max_score: 100,
        github_link: "",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error creating assignment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading assignments...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Assignments
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="course">Course</Label>
                <Select
                  value={formData.course_id}
                  onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Assignment Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_score">Max Score</Label>
                  <Input
                    id="max_score"
                    type="number"
                    value={formData.max_score}
                    onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="github_link">GitHub Template Link (Optional)</Label>
                <Input
                  id="github_link"
                  value={formData.github_link || ""}
                  onChange={(e) => setFormData({ ...formData, github_link: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>
              <Button type="submit" className="w-full">Create Assignment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No assignments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Course: {assignment.courses?.title}
                    </p>
                    {assignment.description && (
                      <p className="text-sm mt-2">{assignment.description}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      {assignment.due_date && (
                        <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                      )}
                      <span>Max Score: {assignment.max_score}</span>
                    </div>
                    {assignment.github_link && (
                      <a
                        href={assignment.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                      >
                        <Github className="h-3 w-3" />
                        View Template
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}