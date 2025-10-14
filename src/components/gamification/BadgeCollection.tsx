import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const BadgeCollection = ({ userId }: { userId: string }) => {
  const { data: badges, isLoading } = useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("points_required");

      if (error) throw error;
      return data;
    },
  });

  const { data: earnedBadges } = useQuery({
    queryKey: ["student-badges", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_badges")
        .select("badge_id")
        .eq("student_id", userId);

      if (error) throw error;
      return data.map(b => b.badge_id);
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {badges?.map((badge) => {
        const isEarned = earnedBadges?.includes(badge.id);
        const IconComponent = (LucideIcons as any)[badge.icon] || LucideIcons.Award;

        return (
          <Card
            key={badge.id}
            className={`p-4 text-center transition-all ${
              isEarned ? "border-primary shadow-lg" : "opacity-50 grayscale"
            }`}
          >
            <div className={`inline-block p-3 rounded-full mb-2 ${
              isEarned ? "bg-primary/20" : "bg-muted"
            }`}>
              <IconComponent className={`h-8 w-8 ${isEarned ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <h4 className="font-semibold mb-1">{badge.name}</h4>
            <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
            {isEarned ? (
              <Badge variant="default">Earned</Badge>
            ) : (
              <Badge variant="outline">Locked</Badge>
            )}
          </Card>
        );
      })}
    </div>
  );
};