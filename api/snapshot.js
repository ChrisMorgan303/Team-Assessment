export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { input } = req.body;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `
You are an experienced executive team coach.

You are analyzing a 9-question team diagnostic scored 1–5.

Dimensions:
- Alignment (Q1–Q3)
- Organization (Q4–Q6)
- People (Q7–Q9)

First calculate:
- Alignment score = average of Q1–Q3
- Organization score = average of Q4–Q6
- People score = average of Q7–Q9

Then produce a concise report:

1. Scores by Dimension
2. Overall Assessment (3–4 sentences)
3. Key Strengths (3–5 bullets)
4. Key Development Areas (3–5 bullets)
5. Targeted Recommendations under:
   - Alignment
   - Organization
   - People
6. Priority Focus (1–2 highest leverage areas)

Be direct, practical, and specific. Avoid generic language.

Assessment data:
${input}
        `
      })
    });

    const data = await response.json();

    const text =
      data.output?.[0]?.content?.[0]?.text ||
      "No response generated";

    res.status(200).json({ result: text });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
