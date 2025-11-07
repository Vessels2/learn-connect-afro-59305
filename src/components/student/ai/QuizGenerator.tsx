import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Quiz {
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>;
}

export default function QuizGenerator() {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState("5");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

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

  const generateQuiz = async () => {
    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }

    setLoading(true);
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);

    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { 
          courseId: selectedCourse,
          topic,
          difficulty,
          questionCount: parseInt(questionCount)
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setQuiz(data.quiz);
      toast.success("Quiz generated!");
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const correct = quiz?.questions.filter((q, i) => answers[i] === q.correctAnswer).length || 0;
    const total = quiz?.questions.length || 0;
    toast.success(`You scored ${correct} out of ${total}!`);
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

        <div className="grid gap-2">
          <Label>Topic (Optional)</Label>
          <Input 
            placeholder="e.g., Variables and Data Types"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Questions</Label>
            <Select value={questionCount} onValueChange={setQuestionCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={generateQuiz}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating Quiz...
            </>
          ) : (
            "Generate Quiz"
          )}
        </Button>
      </div>

      {quiz && (
        <div className="space-y-4">
          {quiz.questions.map((q, index) => (
            <Card key={index} className="p-4">
              <h4 className="font-semibold mb-3">
                Question {index + 1}: {q.question}
              </h4>
              <div className="space-y-2">
                {q.options.map((option, optIndex) => (
                  <label 
                    key={optIndex}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      submitted 
                        ? optIndex === q.correctAnswer
                          ? 'border-green-500 bg-green-50 dark:bg-green-950'
                          : answers[index] === optIndex
                          ? 'border-red-500 bg-red-50 dark:bg-red-950'
                          : 'border-border'
                        : answers[index] === optIndex
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      checked={answers[index] === optIndex}
                      onChange={() => !submitted && setAnswers({...answers, [index]: optIndex})}
                      disabled={submitted}
                      className="sr-only"
                    />
                    <span className="flex-1">{option}</span>
                    {submitted && optIndex === q.correctAnswer && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {submitted && answers[index] === optIndex && optIndex !== q.correctAnswer && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </label>
                ))}
              </div>
              {submitted && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm"><strong>Explanation:</strong> {q.explanation}</p>
                </div>
              )}
            </Card>
          ))}

          {!submitted && (
            <Button onClick={handleSubmit} className="w-full">
              Submit Quiz
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
