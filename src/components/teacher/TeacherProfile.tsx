import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Github, Twitter, Facebook } from "lucide-react";
import { Label } from "@/components/ui/label";

export function TeacherProfile({ teacherId }: { teacherId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    bio: "",
    qualifications: "",
    rank: "",
    github_link: "",
    twitter_link: "",
    facebook_link: "",
    other_links: [] as string[],
  });

  useEffect(() => {
    loadProfile();
  }, [teacherId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("teacher_profiles")
        .select("*")
        .eq("user_id", teacherId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfile(data);
        setFormData({
          bio: data.bio || "",
          qualifications: data.qualifications || "",
          rank: data.rank || "",
          github_link: data.github_link || "",
          twitter_link: data.twitter_link || "",
          facebook_link: data.facebook_link || "",
          other_links: data.other_links || [],
        });
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from("teacher_profiles")
          .update(formData)
          .eq("id", profile.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from("teacher_profiles")
          .insert({
            user_id: teacherId,
            ...formData,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      loadProfile();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Teacher Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="rank">Academic Rank/Title</Label>
            <Input
              id="rank"
              value={formData.rank}
              onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
              placeholder="e.g., Professor, Associate Professor, Lecturer"
            />
          </div>

          <div>
            <Label htmlFor="qualifications">Qualifications</Label>
            <Textarea
              id="qualifications"
              value={formData.qualifications}
              onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
              placeholder="e.g., PhD in Computer Science, MSc in Education..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell students about yourself, your teaching philosophy, and experience..."
              rows={5}
            />
          </div>

          <div className="space-y-3">
            <Label>Social Media Links</Label>
            
            <div>
              <Label htmlFor="github_link" className="text-sm text-muted-foreground">
                <Github className="h-3 w-3 inline mr-1" />
                GitHub
              </Label>
              <Input
                id="github_link"
                value={formData.github_link}
                onChange={(e) => setFormData({ ...formData, github_link: e.target.value })}
                placeholder="https://github.com/yourusername"
              />
            </div>

            <div>
              <Label htmlFor="twitter_link" className="text-sm text-muted-foreground">
                <Twitter className="h-3 w-3 inline mr-1" />
                X (Twitter)
              </Label>
              <Input
                id="twitter_link"
                value={formData.twitter_link}
                onChange={(e) => setFormData({ ...formData, twitter_link: e.target.value })}
                placeholder="https://twitter.com/yourusername"
              />
            </div>

            <div>
              <Label htmlFor="facebook_link" className="text-sm text-muted-foreground">
                <Facebook className="h-3 w-3 inline mr-1" />
                Facebook
              </Label>
              <Input
                id="facebook_link"
                value={formData.facebook_link}
                onChange={(e) => setFormData({ ...formData, facebook_link: e.target.value })}
                placeholder="https://facebook.com/yourprofile"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}