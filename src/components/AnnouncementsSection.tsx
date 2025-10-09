import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bell, Plus, X, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AnnouncementsSectionProps {
  userRole: string;
}

export const AnnouncementsSection = ({ userRole }: AnnouncementsSectionProps) => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    target_role: "all" as "all" | "student" | "teacher",
    is_global: false
  });

  const canCreateAnnouncement = userRole === "teacher" || userRole === "admin";

  useEffect(() => {
    loadAnnouncements();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("announcements")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements"
        },
        () => {
          loadAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*, profiles(full_name, role)")
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) setAnnouncements(data);
  };

  const handleCreate = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("announcements").insert({
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      author_id: user.id,
      target_role: newAnnouncement.target_role === "all" ? null : newAnnouncement.target_role,
      is_global: userRole === "admin" && newAnnouncement.is_global
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Announcement created!",
        description: "Your announcement has been posted"
      });
      setShowCreate(false);
      setNewAnnouncement({ title: "", content: "", target_role: "all", is_global: false });
    }
  };

  const handleDelete = async (announcementId: string, authorId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const canDelete = userRole === "student" || user.id === authorId;
    if (!canDelete) {
      toast({
        title: "Permission denied",
        description: "You can only delete your own announcements",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcementId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Announcement deleted",
        description: "The announcement has been removed"
      });
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary animate-pulse" />
            Announcements
          </CardTitle>
          {canCreateAnnouncement && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreate(!showCreate)}
            >
              {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showCreate ? "Cancel" : "New"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showCreate && (
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <Input
              placeholder="Announcement title"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
            />
            <Textarea
              placeholder="Announcement content"
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
            />
            <div className="flex gap-4">
              <Select
                value={newAnnouncement.target_role}
                onValueChange={(value: any) =>
                  setNewAnnouncement({ ...newAnnouncement, target_role: value })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="student">Students Only</SelectItem>
                  <SelectItem value="teacher">Teachers Only</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} variant="hero">
                Post Announcement
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No announcements yet
            </p>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 border rounded-lg hover:bg-accent/5 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{announcement.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDelete(announcement.id, announcement.author_id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{announcement.content}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">by {announcement.profiles?.full_name}</span>
                  {announcement.is_global && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      Global
                    </span>
                  )}
                  {announcement.target_role && (
                    <span className="px-2 py-0.5 bg-accent/10 text-accent rounded-full capitalize">
                      {announcement.target_role}s
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
