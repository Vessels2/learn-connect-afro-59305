import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function StudentManagement({ teacherId }: { teacherId: string }) {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

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

      // Load enrolled students
      if (coursesData && coursesData.length > 0) {
        const courseIds = coursesData.map((c) => c.id);
        const { data: enrollmentsData } = await supabase
          .from("enrollments")
          .select("*, profiles!enrollments_student_id_fkey(*), courses!enrollments_course_id_fkey(*)")
          .in("course_id", courseIds);

        setStudents(enrollmentsData || []);
      }
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

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find student by email
      const { data: studentData, error: studentError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", studentEmail)
        .eq("role", "student")
        .single();

      if (studentError || !studentData) {
        toast({
          title: "Error",
          description: "Student not found with this email",
          variant: "destructive",
        });
        return;
      }

      // Enroll student
      const { error } = await supabase.from("enrollments").insert({
        student_id: studentData.id,
        course_id: selectedCourse,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student enrolled successfully",
      });
      setOpen(false);
      setStudentEmail("");
      setSelectedCourse("");
      loadData();
    } catch (error: any) {
      toast({
        title: "Error enrolling student",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading students...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          My Students
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Enroll Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enroll Student in Course</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div>
                <Label htmlFor="course">Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course" />
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
                <Label htmlFor="email">Student Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full">Enroll Student</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No students enrolled yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((enrollment) => (
              <div
                key={enrollment.id}
                className="p-3 border rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{enrollment.profiles?.full_name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {enrollment.profiles?.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Course: {enrollment.courses?.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}