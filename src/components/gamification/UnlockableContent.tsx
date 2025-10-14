import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UnlockableContentProps {
  userId: string;
  userLevel: number;
  userPoints: number;
}

export const UnlockableContent = ({ userId, userLevel, userPoints }: UnlockableContentProps) => {
  const { data: content } = useQuery({
    queryKey: ["unlockable-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unlockable_content")
        .select("*")
        .order("level_required");

      if (error) throw error;
      return data;
    },
  });

  const { data: unlockedContent, refetch } = useQuery({
    queryKey: ["student-unlocks", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_unlocks")
        .select("content_id")
        .eq("student_id", userId);

      if (error) throw error;
      return data.map(u => u.content_id);
    },
  });

  const handleUnlock = async (contentId: string) => {
    const { error } = await supabase
      .from("student_unlocks")
      .insert({ student_id: userId, content_id: contentId });

    if (error) {
      toast.error("Failed to unlock content");
      return;
    }

    toast.success("Content unlocked!");
    refetch();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {content?.map((item) => {
        const isUnlocked = unlockedContent?.includes(item.id);
        const canUnlock = userLevel >= item.level_required && userPoints >= item.points_required;

        return (
          <Card key={item.id} className={`p-6 ${isUnlocked ? "border-primary" : ""}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              {isUnlocked ? (
                <Unlock className="h-5 w-5 text-primary" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div className="flex gap-2 mb-4">
              <Badge variant="outline">
                Level {item.level_required}+
              </Badge>
              <Badge variant="outline">
                {item.points_required} pts
              </Badge>
              <Badge variant="secondary">
                {item.content_type}
              </Badge>
            </div>

            {!isUnlocked && (
              <Button
                className="w-full"
                disabled={!canUnlock}
                onClick={() => handleUnlock(item.id)}
              >
                {canUnlock ? "Unlock Now" : "Requirements Not Met"}
              </Button>
            )}

            {isUnlocked && (
              <Button className="w-full" variant="default">
                Access Content
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
};