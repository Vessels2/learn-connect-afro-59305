import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function CourseQA() {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id, courses(id, title)')
        .eq('student_id', user.id);

      if (error) throw error;
      setCourses(data?.map(e => e.courses).filter(Boolean) || []);
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const askQuestion = async () => {
    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }

    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    const userMessage: Message = { role: "user", content: question };
    setMessages(prev => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('course-qa', {
        body: { 
          question,
          courseId: selectedCourse,
          conversationHistory: messages
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const assistantMessage: Message = { role: "assistant", content: data.answer };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Failed to get answer");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Course</Label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto">
        {messages.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <p>Ask any question about your course and get instant help from AI!</p>
          </Card>
        ) : (
          messages.map((msg, index) => (
            <Card key={index} className={`p-4 ${msg.role === 'user' ? 'bg-primary/5 ml-8' : 'mr-8'}`}>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {msg.role === 'user' ? (
                  <p className="font-medium">{msg.content}</p>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input 
          placeholder="Ask a question about the course..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading || !selectedCourse}
        />
        <Button 
          onClick={askQuestion}
          disabled={loading || !selectedCourse || !question.trim()}
          size="icon"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
