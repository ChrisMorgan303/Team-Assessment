export default async function handler(req, res) {
  // ✅ REQUIRED: CORS headers (this fixes "Failed to fetch")
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ REQUIRED: handle browser preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: "Missing input" });
    }

    // 🔑 Get API key from Vercel environment variables
    const apiKey = process.env.OPENAI_API_KEY;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `
You are an expert executive team coach.

Analyze the following team assessment responses and provide:

1. A short diagnostic summary
2. Key issues (bullet points)
3. Suggested focus areas (practical, executive-level)

Assessment data:
${input}
        `
      })
    });

    const data = await response.json();

    const text =
      data.output?.[0]?.content?.[0]?.text ||
      "No response generated";

    return res.status(200).json({ result: text });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
}
