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
You are a senior executive team coach.

You are analyzing a 9-question team diagnostic scored 1–5.

Each item includes:
- Question number (Q1–Q9)
- Category (Alignment, Organization, People)
- Score (1–5)

Step 1 — Calculate:
- Alignment = average of Q1–3
- Organization = average of Q4–6
- People = average of Q7–9
- Round to 1 decimal place

Step 2 — Produce a concise, structured report EXACTLY in this format:

Scores by Dimension
Alignment: X.X
Organization: X.X
People: X.X

Overall Assessment
A clear, grounded evaluation of team effectiveness (3–4 sentences).

Key Strengths
- 3–5 specific strengths

Key Development Areas
- 3–5 specific gaps or risks

Targeted Recommendations

Alignment
- practical actions

Organization
- practical actions

People
- practical actions

Priority Focus
- 1–2 highest-leverage priorities

Rules:
- Plain text only
- No asterisks or markdown
- Use hyphens for bullets
- Be concise, specific, and pragmatic
- Avoid generic consulting language
- Do not add extra sections

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
