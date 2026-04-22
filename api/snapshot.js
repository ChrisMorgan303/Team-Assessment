export default async function handler(req, res) {
  // --- CORS (required for Squarespace) ---
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
You are a senior executive team coach writing in a grounded, pragmatic, and personal tone.

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
Write 3–4 sentences that sound like an experienced coach speaking directly to a leadership team. Interpret the pattern of scores and what it likely means in practice.

Key Strengths
- 3–5 strengths grounded in the scores and what they imply in real team behavior

Key Development Areas
- 3–5 specific issues, tensions, or risks likely showing up in how the team operates

Targeted Recommendations

Alignment
- specific actions (e.g. clarify priorities, align on trade-offs, sharpen strategy narrative)
- where appropriate, include how Chris (an executive team coach) could help facilitate or accelerate this work

Organization
- specific actions (e.g. decision clarity, meeting effectiveness, operating cadence)
- include how Chris could support with structure, facilitation, or decision frameworks

People
- specific actions (e.g. trust, leadership behavior, capability gaps)
- include how Chris could help through coaching, feedback processes, or team interventions

Priority Focus
- Identify the 1–2 highest-leverage areas and briefly explain why they matter most now

Final Note
If you would like to explore addressing these challenges or to talk more about team effectiveness, contact Chris at 415 250-1528 or chris@morganalexander.com

Rules:
- Plain text only
- No asterisks or markdown
- Use hyphens for bullets
- Be concise, specific, and practical
- Avoid generic consulting language
- Write in a human, credible coaching voice
- Do not add extra sections beyond those listed

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
    return res.status(500).json({ error: error.message });
  }
}
