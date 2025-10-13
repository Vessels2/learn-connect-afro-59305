import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, BookOpen, TrendingUp, Clock } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TeacherAnalyticsProps {
  teacherId: string;
}

export function TeacherAnalytics({ teacherId }: TeacherAnalyticsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [studentEngagement, setStudentEngagement] = useState<any[]>([]);
  const [submissionTrends, setSubmissionTrends] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    avgEngagementRate: 0,
    totalAssignments: 0,
    avgSubmissionRate: 0
  });

  useEffect(() => {
    loadTeacherAnalytics();
  }, [teacherId]);

  const loadTeacherAnalytics = async () => {
    try {
      // Load teacher's courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .eq("teacher_id", teacherId);

      if (!courses) return;

      const courseIds = courses.map(c => c.id);

      // Load enrollments
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("*, profiles(full_name)")
        .in("course_id", courseIds);

      // Load assignments
      const { data: assignments } = await supabase
        .from("assignments")
        .select("*")
        .eq("teacher_id", teacherId);

      // Load submissions
      const { data: submissions } = await supabase
        .from("submissions")
        .select("*, assignments!inner(course_id), profiles(full_name)")
        .in("assignments.course_id", courseIds);

      // Load activity logs
      const { data: activities } = await supabase
        .from("activity_logs")
        .select("*")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false })
        .limit(100);

      // Process course statistics
      if (courses && enrollments) {
        const courseStatsData = courses.map(course => {
          const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
          const courseSubmissions = submissions?.filter(s => 
            assignments?.find(a => a.id === s.assignment_id && a.course_id === course.id)
          ) || [];
          
          return {
            name: course.title,
            students: courseEnrollments.length,
            submissions: courseSubmissions.length,
            avgScore: courseSubmissions.length > 0
              ? courseSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / courseSubmissions.length
              : 0
          };
        });
        setCourseStats(courseStatsData);

        setStats(prev => ({
          ...prev,
          totalStudents: enrollments.length,
          totalCourses: courses.length,
          totalAssignments: assignments?.length || 0
        }));
      }

      // Process engagement data
      if (activities) {
        const engagementByDay = activities.reduce((acc: any, act: any) => {
          const date = new Date(act.created_at).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = { date, activities: 0, uniqueStudents: new Set() };
          }
          acc[date].activities++;
          acc[date].uniqueStudents.add(act.user_id);
          return acc;
        }, {});

        const engagementData = Object.entries(engagementByDay)
          .map(([date, data]: [string, any]) => ({
            date,
            activities: data.activities,
            students: data.uniqueStudents.size
          }))
          .slice(0, 7)
          .reverse();

        setStudentEngagement(engagementData);
      }

      // Process submission trends
      if (submissions) {
        const submissionsByWeek = submissions.reduce((acc: any, sub: any) => {
          const week = new Date(sub.submitted_at).toLocaleDateString();
          if (!acc[week]) {
            acc[week] = { week, submitted: 0, graded: 0 };
          }
          acc[week].submitted++;
          if (sub.graded_at) acc[week].graded++;
          return acc;
        }, {});

        setSubmissionTrends(Object.values(submissionsByWeek).slice(-7));
      }

      // Calculate top performers
      if (submissions && enrollments) {
        const studentScores: any = {};
        
        submissions.forEach((sub: any) => {
          if (sub.score) {
            if (!studentScores[sub.student_id]) {
              studentScores[sub.student_id] = {
                name: sub.profiles?.full_name || "Unknown",
                totalScore: 0,
                count: 0
              };
            }
            studentScores[sub.student_id].totalScore += sub.score;
            studentScores[sub.student_id].count++;
          }
        });

        const performers = Object.entries(studentScores)
          .map(([id, data]: [string, any]) => ({
            student: data.name,
            avgScore: data.totalScore / data.count,
            assignments: data.count
          }))
          .sort((a, b) => b.avgScore - a.avgScore)
          .slice(0, 5);

        setTopPerformers(performers);
      }

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
      teacherId,
      generatedAt: new Date().toISOString(),
      stats,
      courseStats,
      studentEngagement,
      submissionTrends,
      topPerformers
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teacher-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report exported",
      description: "Analytics report has been downloaded"
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Teacher Analytics Dashboard</h2>
        <Button onClick={exportReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Published courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Total created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentEngagement.length > 0 ? studentEngagement[studentEngagement.length - 1].activities : 0}</div>
            <p className="text-xs text-muted-foreground">Recent activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topPerformers.length > 0 
                ? (topPerformers.reduce((sum, p) => sum + p.avgScore, 0) / topPerformers.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Class average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>Student enrollment and average scores by course</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="hsl(var(--primary))" name="Students" />
                <Bar dataKey="avgScore" fill="hsl(var(--secondary))" name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Student Engagement Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Student Engagement Trends</CardTitle>
            <CardDescription>Daily active students and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={studentEngagement}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" name="Active Students" />
                <Line type="monotone" dataKey="activities" stroke="hsl(var(--accent))" name="Activities" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Submission Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Submissions</CardTitle>
            <CardDescription>Submitted vs graded assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={submissionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="submitted" fill="hsl(var(--primary))" name="Submitted" />
                <Bar dataKey="graded" fill="hsl(var(--secondary))" name="Graded" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Students</CardTitle>
            <CardDescription>Students with highest average scores</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Assignments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((performer, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{performer.student}</TableCell>
                    <TableCell>{performer.avgScore.toFixed(1)}%</TableCell>
                    <TableCell>{performer.assignments}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}