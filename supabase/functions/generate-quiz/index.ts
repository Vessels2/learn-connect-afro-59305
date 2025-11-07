import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, topic, difficulty, questionCount } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get course information
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, description')
      .eq('id', courseId)
      .single();

    if (courseError) throw courseError;

    // Get course assignments for context
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select('title, description')
      .eq('course_id', courseId)
      .limit(5);

    if (assignError) throw assignError;

    const prompt = `Generate a quiz for the following course:

Course: ${course.title}
Description: ${course.description}
Topic: ${topic || 'General course content'}
Difficulty: ${difficulty || 'medium'}
Number of Questions: ${questionCount || 5}

Recent Topics Covered: ${JSON.stringify(assignments)}

Create ${questionCount || 5} multiple-choice questions with 4 options each. 
Format the response as valid JSON with this structure:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": 0,
      "explanation": "Why this is the correct answer"
    }
  ]
}

Make questions educational, clear, and aligned with the course content.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert educational content creator. Generate clear, accurate quiz questions that test understanding. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", response.status);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const quiz = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    return new Response(
      JSON.stringify({ quiz }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-quiz:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
