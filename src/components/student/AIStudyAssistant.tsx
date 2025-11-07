import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, BookOpen, MessageSquare, FileText } from "lucide-react";
import StudyRecommendations from "./ai/StudyRecommendations";
import QuizGenerator from "./ai/QuizGenerator";
import EssayFeedback from "./ai/EssayFeedback";
import CourseQA from "./ai/CourseQA";

export default function AIStudyAssistant() {
  const [activeTab, setActiveTab] = useState("recommendations");

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>AI Study Assistant</CardTitle>
              <CardDescription>
                Get personalized help with your studies powered by AI
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Recommendations</span>
              </TabsTrigger>
              <TabsTrigger value="quiz" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Quiz</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Feedback</span>
              </TabsTrigger>
              <TabsTrigger value="qa" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Q&A</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="mt-6">
              <StudyRecommendations />
            </TabsContent>

            <TabsContent value="quiz" className="mt-6">
              <QuizGenerator />
            </TabsContent>

            <TabsContent value="feedback" className="mt-6">
              <EssayFeedback />
            </TabsContent>

            <TabsContent value="qa" className="mt-6">
              <CourseQA />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
