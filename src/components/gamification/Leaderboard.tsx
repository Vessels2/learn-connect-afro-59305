import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Leaderboard = () => {
  const { data: classLeaderboard } = useQuery({
    queryKey: ["class-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_progress")
        .select(`
          points,
          level,
          student_id,
          profiles:student_id (full_name)
        `)
        .order("points", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const { data: schoolLeaderboard } = useQuery({
    queryKey: ["school-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_progress")
        .select(`
          points,
          level,
          student_id,
          profiles:student_id (full_name)
        `)
        .order("points", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const renderLeaderboard = (data: any[] | undefined) => {
    if (!data) return null;

    return (
      <div className="space-y-2">
        {data.map((entry, index) => {
          const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
          
          return (
            <Card key={entry.student_id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8">
                  {index === 0 && <Trophy className="h-6 w-6 text-yellow-500" />}
                  {index === 1 && <Medal className="h-6 w-6 text-gray-400" />}
                  {index === 2 && <Medal className="h-6 w-6 text-amber-600" />}
                  {index > 2 && <span className="text-muted-foreground font-semibold">{index + 1}</span>}
                </div>

                <Avatar>
                  <AvatarFallback>
                    {profile?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <p className="font-semibold">{profile?.full_name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">
                    Level {entry.level || 1}
                  </p>
                </div>

                <div className="text-right">
                  <Badge variant="secondary" className="font-bold">
                    {entry.points || 0} pts
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Tabs defaultValue="class" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="class">Class</TabsTrigger>
        <TabsTrigger value="school">School-Wide</TabsTrigger>
      </TabsList>

      <TabsContent value="class" className="mt-4">
        {renderLeaderboard(classLeaderboard)}
      </TabsContent>

      <TabsContent value="school" className="mt-4">
        {renderLeaderboard(schoolLeaderboard)}
      </TabsContent>
    </Tabs>
  );
};