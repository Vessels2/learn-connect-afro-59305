import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import * as LucideIcons from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const AchievementTracker = ({ userId }: { userId: string }) => {
  const { data: achievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value");

      if (error) throw error;
      return data;
    },
  });

  const { data: studentAchievements } = useQuery({
    queryKey: ["student-achievements", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_achievements")
        .select("*")
        .eq("student_id", userId);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      {achievements?.map((achievement) => {
        const studentAchievement = studentAchievements?.find(
          (sa) => sa.achievement_id === achievement.id
        );
        const isUnlocked = !!studentAchievement;
        const progress = studentAchievement?.progress || 0;
        const progressPercent = (progress / achievement.requirement_value) * 100;
        const IconComponent = (LucideIcons as any)[achievement.icon] || LucideIcons.CheckCircle;

        return (
          <Card key={achievement.id} className={`p-4 ${isUnlocked ? "border-primary" : ""}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${isUnlocked ? "bg-primary/20" : "bg-muted"}`}>
                <IconComponent className={`h-6 w-6 ${isUnlocked ? "text-primary" : "text-muted-foreground"}`} />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{achievement.name}</h4>
                  {isUnlocked ? (
                    <Badge variant="default">Unlocked</Badge>
                  ) : (
                    <Badge variant="outline">{achievement.points_reward} pts</Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {achievement.description}
                </p>

                {!isUnlocked && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{progress} / {achievement.requirement_value}</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </>
                )}

                {isUnlocked && studentAchievement && (
                  <p className="text-xs text-muted-foreground">
                    Unlocked on {new Date(studentAchievement.unlocked_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};