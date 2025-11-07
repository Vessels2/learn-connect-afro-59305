import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  LogOut, 
  BookOpen, 
  Users, 
  Bell, 
  TrendingUp,
  GraduationCap,
  Calendar,
  Award,
  ArrowLeft
} from "lucide-react";
import { AnnouncementsSection } from "@/components/AnnouncementsSection";
import { TeacherDashboard } from "@/components/teacher/TeacherDashboard";
import { CourseBrowser } from "@/components/student/CourseBrowser";
import { StudentAssignments } from "@/components/student/StudentAssignments";
import { StudentAnalytics } from "@/components/analytics/StudentAnalytics";
import AIStudyAssistant from "@/components/student/AIStudyAssistant";
import { GamificationHeader } from "@/components/gamification/GamificationHeader";
import { BadgeCollection } from "@/components/gamification/BadgeCollection";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { AchievementTracker } from "@/components/gamification/AchievementTracker";
import { UnlockableContent } from "@/components/gamification/UnlockableContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { OfflineIndicator, OnlineStatusBadge } from "@/components/OfflineIndicator";
import { InstallPrompt } from "@/components/InstallPrompt";
import { fetchAndCacheCourses, fetchAndCacheAssignments } from "@/services/offlineSync";

function StudentDashboardContent({ userId }: { userId: string }) {
  const { data: progress } = useQuery({
    queryKey: ["student-progress-overview", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_progress")
        .select("*")
        .eq("student_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data || {
        points: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0
      };
    },
  });

  return (
    <>
      {/* Gamification Header */}
      <GamificationHeader
        points={progress?.points || 0}
        level={progress?.level || 1}
        currentStreak={progress?.current_streak || 0}
        longestStreak={progress?.longest_streak || 0}
      />

      {/* Tabs for different sections */}
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6 mt-6">
          <StudentAnalytics studentId={userId} />
          <CourseBrowser studentId={userId} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <StudentAssignments studentId={userId} />
        </TabsContent>

        <TabsContent value="ai-assistant" className="mt-6">
          <AIStudyAssistant />
        </TabsContent>

        <TabsContent value="badges" className="mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Badge Collection</h3>
              <p className="text-muted-foreground mb-6">
                Earn badges by completing assignments, maintaining streaks, and reaching milestones
              </p>
            </div>
            <BadgeCollection userId={userId} />
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Achievements</h3>
              <p className="text-muted-foreground mb-6">
                Track your progress and unlock rewards
              </p>
            </div>
            <AchievementTracker userId={userId} />

            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-2">Unlockable Content</h3>
              <p className="text-muted-foreground mb-6">
                Unlock special content by leveling up and earning points
              </p>
              <UnlockableContent
                userId={userId}
                userLevel={progress?.level || 1}
                userPoints={progress?.points || 0}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Leaderboard</h3>
              <p className="text-muted-foreground mb-6">
                See how you rank against other students
              </p>
            </div>
            <Leaderboard />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setUser(user);
      setProfile(profileData);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isTeacher = profile?.role === "teacher";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-primary">EduAI</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <OnlineStatusBadge />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {getGreeting()}, {profile?.full_name}!
          </h2>
          <p className="text-muted-foreground">
            {isTeacher 
              ? "Ready to inspire and educate today?"
              : "Ready to learn something new today?"}
          </p>
        </div>

        {/* Announcements */}
        <AnnouncementsSection userRole={profile?.role} />

        {isTeacher ? (
          /* Teacher Dashboard */
          <TeacherDashboard teacherId={user.id} />
        ) : (
          <StudentDashboardContent userId={user.id} />
        )}
      </main>

      {/* Tagline Footer */}
      <footer className="text-center py-6 text-sm text-muted-foreground">
        <p className="font-medium text-primary">Education in Every Pocket</p>
        <p className="text-xs mt-1">Plagiarism-free, quality content for every learner</p>
      </footer>

      {/* PWA Components */}
      <OfflineIndicator />
      <InstallPrompt />
    </div>
  );
}
