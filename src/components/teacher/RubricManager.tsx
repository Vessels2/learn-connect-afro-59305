import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface Criterion {
  id: string;
  criterion_name: string;
  description: string;
  max_points: number;
}

export const RubricManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  const { data: rubrics } = useQuery({
    queryKey: ["rubrics"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("rubrics")
        .select("*, rubric_criteria(*)")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addCriterion = () => {
    setCriteria([
      ...criteria,
      {
        id: crypto.randomUUID(),
        criterion_name: "",
        description: "",
        max_points: 5,
      },
    ]);
  };

  const updateCriterion = (id: string, updates: Partial<Criterion>) => {
    setCriteria(criteria.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeCriterion = (id: string) => {
    setCriteria(criteria.filter((c) => c.id !== id));
  };

  const createRubricMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: rubric, error: rubricError } = await supabase
        .from("rubrics")
        .insert({
          teacher_id: user.id,
          title,
          description,
        })
        .select()
        .single();

      if (rubricError) throw rubricError;

      const criteriaData = criteria.map((c, idx) => ({
        rubric_id: rubric.id,
        criterion_name: c.criterion_name,
        description: c.description,
        max_points: c.max_points,
        order_index: idx,
      }));

      const { error: criteriaError } = await supabase
        .from("rubric_criteria")
        .insert(criteriaData);

      if (criteriaError) throw criteriaError;

      return rubric;
    },
    onSuccess: () => {
      toast({ title: "Rubric created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["rubrics"] });
      setTitle("");
      setDescription("");
      setCriteria([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating rubric",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRubricMutation = useMutation({
    mutationFn: async (rubricId: string) => {
      const { error } = await supabase
        .from("rubrics")
        .delete()
        .eq("id", rubricId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Rubric deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["rubrics"] });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Rubric</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="rubricTitle">Title</Label>
            <Input
              id="rubricTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Rubric title"
            />
          </div>

          <div>
            <Label htmlFor="rubricDescription">Description</Label>
            <Textarea
              id="rubricDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rubric description"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Criteria</h3>
              <Button onClick={addCriterion} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Criterion
              </Button>
            </div>

            {criteria.map((criterion, idx) => (
              <Card key={criterion.id}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-4">
                      <div>
                        <Label>Criterion {idx + 1}</Label>
                        <Input
                          value={criterion.criterion_name}
                          onChange={(e) =>
                            updateCriterion(criterion.id, { criterion_name: e.target.value })
                          }
                          placeholder="Criterion name"
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={criterion.description}
                          onChange={(e) =>
                            updateCriterion(criterion.id, { description: e.target.value })
                          }
                          placeholder="Describe what to look for"
                        />
                      </div>

                      <div>
                        <Label>Max Points</Label>
                        <Input
                          type="number"
                          value={criterion.max_points}
                          onChange={(e) =>
                            updateCriterion(criterion.id, {
                              max_points: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCriterion(criterion.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            onClick={() => createRubricMutation.mutate()}
            disabled={!title || criteria.length === 0 || createRubricMutation.isPending}
            className="w-full"
          >
            Create Rubric
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Rubrics</h3>
        {rubrics?.map((rubric) => (
          <Card key={rubric.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{rubric.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{rubric.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRubricMutation.mutate(rubric.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rubric.rubric_criteria?.map((criterion: any) => (
                  <div key={criterion.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium">{criterion.criterion_name}</p>
                      <p className="text-sm text-muted-foreground">{criterion.description}</p>
                    </div>
                    <span className="text-sm font-semibold">{criterion.max_points} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
