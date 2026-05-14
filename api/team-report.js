import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {

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

  // Temporary test response
  return res.status(200).json({
    success: true,
    totalResponses: data.length,
    responses: data
  });

}
