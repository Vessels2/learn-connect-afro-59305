import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ParentCommunication({ teacherId }: { teacherId: string }) {
  const { toast } = useToast();
  const [communications, setCommunications] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    subject: "",
    message: "",
    parent_email: "",
    parent_phone: "",
  });

  useEffect(() => {
    loadData();
  }, [teacherId]);

  const loadData = async () => {
    try {
      // Load communications
      const { data: commsData } = await supabase
        .from("parent_communications")
        .select("*, profiles!parent_communications_student_id_fkey(*)")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });

      setCommunications(commsData || []);

      // Load teacher's students
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id")
        .eq("teacher_id", teacherId);

      if (coursesData && coursesData.length > 0) {
        const courseIds = coursesData.map((c) => c.id);
        const { data: enrollmentsData } = await supabase
          .from("enrollments")
          .select("profiles!enrollments_student_id_fkey(*)")
          .in("course_id", courseIds);

        const uniqueStudents = enrollmentsData?.reduce((acc: any[], curr) => {
          if (!acc.find((s) => s.id === curr.profiles.id)) {
            acc.push(curr.profiles);
          }
          return acc;
        }, []);

        setStudents(uniqueStudents || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("parent_communications").insert({
        teacher_id: teacherId,
        ...formData,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent to parent",
      });
      setOpen(false);
      setFormData({
        student_id: "",
        subject: "",
        message: "",
        parent_email: "",
        parent_phone: "",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-secondary" />
          Parent Communication
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Send className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Message to Parent</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="student">Select Student</Label>
                <Select
                  value={formData.student_id}
                  onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} ({student.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="parent_email">Parent Email (Optional)</Label>
                <Input
                  id="parent_email"
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                  placeholder="parent@example.com"
                />
              </div>
              <div>
                <Label htmlFor="parent_phone">Parent Phone (Optional)</Label>
                <Input
                  id="parent_phone"
                  type="tel"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  placeholder="+234 XXX XXX XXXX"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {communications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No messages sent yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {communications.map((comm) => (
              <div key={comm.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{comm.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      To: {comm.profiles?.full_name}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comm.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{comm.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}