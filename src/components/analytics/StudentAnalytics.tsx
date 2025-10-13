import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Clock, Award, BookOpen } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface StudentAnalyticsProps {
  studentId: string;
}

export function StudentAnalytics({ studentId }: StudentAnalyticsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [skillsData, setSkillsData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTimeSpent: 0,
    avgCompletionRate: 0,
    totalCourses: 0,
    totalAssignments: 0,
    avgScore: 0
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [studentId]);

  const loadAnalyticsData = async () => {
    try {
      // Load progress data
      const { data: progress } = await supabase
        .from("student_progress")
        .select("*, courses(title)")
        .eq("student_id", studentId);

      // Load submissions for scores
      const { data: submissions } = await supabase
        .from("submissions")
        .select("*, assignments(title, course_id)")
        .eq("student_id", studentId);

      // Load activity logs
      const { data: activities } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", studentId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (progress) {
        const courseProgress = progress.map((p: any) => ({
          name: p.courses?.title || "Unknown",
          completion: p.completion_rate || 0,
          timeSpent: p.time_spent_minutes || 0
        }));
        setProgressData(courseProgress);

        // Calculate stats
        const totalTime = progress.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0);
        const avgRate = progress.length > 0 
          ? progress.reduce((sum, p) => sum + (p.completion_rate || 0), 0) / progress.length 
          : 0;

        setStats(prev => ({
          ...prev,
          totalTimeSpent: totalTime,
          avgCompletionRate: avgRate,
          totalCourses: progress.length
        }));
      }

      if (submissions) {
        const avgScore = submissions.length > 0
          ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
          : 0;

        setStats(prev => ({
          ...prev,
          totalAssignments: submissions.length,
          avgScore: avgScore
        }));
      }

      if (activities) {
        const activityByDay = activities.reduce((acc: any, act: any) => {
          const date = new Date(act.created_at).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = { date, count: 0, minutes: 0 };
          }
          acc[date].count++;
          acc[date].minutes += act.duration_minutes || 0;
          return acc;
        }, {});

        setActivityData(Object.values(activityByDay).slice(0, 7).reverse());
      }

      // Mock skills data (can be enhanced with real skills tracking)
      setSkillsData([
        { skill: "Problem Solving", level: 75 },
        { skill: "Critical Thinking", level: 68 },
        { skill: "Communication", level: 82 },
        { skill: "Creativity", level: 70 }
      ]);

    } catch (error: any) {
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    const report = {
      studentId,
      generatedAt: new Date().toISOString(),
      stats,
      progressData,
      activityData,
      skillsData
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report exported",
      description: "Your progress report has been downloaded"
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading analytics...</div>;
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Performance Dashboard</h2>
        <Button onClick={exportReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.totalTimeSpent / 60)}h</div>
            <p className="text-xs text-muted-foreground">{stats.totalTimeSpent} minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">On assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Completion Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Course Completion Rates</CardTitle>
            <CardDescription>Your progress across enrolled courses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completion" fill="hsl(var(--primary))" name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 7 days of learning activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="minutes" stroke="hsl(var(--secondary))" name="Minutes" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skills Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Skills Development</CardTitle>
            <CardDescription>Your skill levels across different areas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={skillsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="skill" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="level" fill="hsl(var(--accent))" name="Skill Level %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Spent Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Time Distribution</CardTitle>
            <CardDescription>Time spent across courses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={progressData}
                  dataKey="timeSpent"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}