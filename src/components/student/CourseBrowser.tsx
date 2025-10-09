import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, CheckCircle } from "lucide-react";

export function CourseBrowser({ studentId }: { studentId: string }) {
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      // Load published courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*, profiles!courses_teacher_id_fkey(full_name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      setCourses(coursesData || []);

      // Load student's enrollments
      const { data: enrollmentsData } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", studentId);

      if (enrollmentsData) {
        setEnrolledCourses(new Set(enrollmentsData.map(e => e.course_id)));
      }
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

  const handleEnroll = async (courseId: string) => {
    try {
      const { error } = await supabase.from("enrollments").insert({
        student_id: studentId,
        course_id: courseId,
      });

      if (error) throw error;

      toast({
        title: "Enrolled successfully!",
        description: "You can now access this course",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error enrolling",
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Available Courses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No courses available yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => {
              const isEnrolled = enrolledCourses.has(course.id);
              return (
                <div
                  key={course.id}
                  className="p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {course.description || "No description available"}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded capitalize">
                          {course.grade_level}
                        </span>
                        <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded uppercase">
                          {course.language}
                        </span>
                        <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded">
                          Teacher: {course.profiles?.full_name || "Unknown"}
                        </span>
                      </div>
                    </div>
                    {isEnrolled ? (
                      <Button variant="outline" size="sm" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Enrolled
                      </Button>
                    ) : (
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => handleEnroll(course.id)}
                      >
                        Enroll Now
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}