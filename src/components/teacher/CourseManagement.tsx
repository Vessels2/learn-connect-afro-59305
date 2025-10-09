import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type GradeLevel = Database["public"]["Enums"]["grade_level"];
type LanguageCode = Database["public"]["Enums"]["language_code"];

export function CourseManagement({ teacherId }: { teacherId: string }) {
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    grade_level: GradeLevel;
    language: LanguageCode;
    is_published: boolean;
  }>({
    title: "",
    description: "",
    grade_level: "secondary",
    language: "en",
    is_published: false,
  });

  useEffect(() => {
    loadCourses();
  }, [teacherId]);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading courses",
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
      const { error } = await supabase.from("courses").insert([{
        ...formData,
        teacher_id: teacherId,
      }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course created successfully",
      });
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        grade_level: "secondary",
        language: "en",
        is_published: false,
      });
      loadCourses();
    } catch (error: any) {
      toast({
        title: "Error creating course",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("courses")
        .update({ is_published: !currentStatus })
        .eq("id", courseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Course ${!currentStatus ? "published" : "unpublished"}`,
      });
      loadCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading courses...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          My Courses
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title</Label>
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
                />
              </div>
              <div>
                <Label htmlFor="grade_level">Grade Level</Label>
                <Select
                  value={formData.grade_level}
                  onValueChange={(value: GradeLevel) => setFormData({ ...formData, grade_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="university">University</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value: LanguageCode) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ha">Hausa</SelectItem>
                    <SelectItem value="ig">Igbo</SelectItem>
                    <SelectItem value="yo">Yoruba</SelectItem>
                    <SelectItem value="pcm">Pidgin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Create Course</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No courses yet. Create your first course to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {course.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {course.grade_level}
                      </span>
                      <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded">
                        {course.language?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant={course.is_published ? "outline" : "default"}
                    size="sm"
                    onClick={() => togglePublish(course.id, course.is_published)}
                  >
                    {course.is_published ? "Unpublish" : "Publish"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}