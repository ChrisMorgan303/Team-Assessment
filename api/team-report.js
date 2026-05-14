import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
export default async function handler(req, res) {

  // CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Allow POST only
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  // Get teamCode from request
  const { teamCode } = req.body;

  // Pull all responses for this team
  const { data, error } = await supabase
    .from("team_responses")
    .select("*")
    .eq("team_code", teamCode);

  // Handle database error
  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }
const prompt = `
You are an experienced executive team coach.

Analyze these team assessment responses.

Focus on:
- overall team effectiveness
- alignment and divergence
- strengths
- development areas
- practical recommendations

Team responses:
${JSON.stringify(data, null, 2)}
`;

const completion = await openai.chat.completions.create({
  model: "gpt-4.1",
  messages: [
    {
      role: "system",
      content: "You are a highly skilled executive team coach."
    },
    {
      role: "user",
      content: prompt
    }
  ],
  temperature: 0.7
});

const report =
  completion.choices[0].message.content;

return res.status(200).json({
  success: true,
  report
});

}
