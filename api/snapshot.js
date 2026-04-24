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
- Alignment score = average of Q1–Q3 (1 decimal)
- Organization score = average of Q4–Q6 (1 decimal)
- People score = average of Q7–Q9 (1 decimal)

---

CLASSIFY PERFORMANCE:

HIGH PERFORMANCE:
All three dimensions ≥ 4.3

STRONG BUT NOT CONSISTENT:
All dimensions ≥ 3.5 AND at least one < 4.3

MIXED EFFECTIVENESS:
At least one dimension between 3.0 and 3.4

LOW EFFECTIVENESS:
Any dimension < 3.0

---

COACHING PHILOSOPHY:

When making recommendations:

Organization:
- Emphasize regular review and reprioritization of priorities (like a backlog), not short sprint cycles
- Focus meetings on aligning around priorities, making decisions, and clear tasking
- Avoid over-structuring meetings; allow space for connection, reflection, and creative contribution

People:
- Emphasize identifying the specific skills required to deliver the strategy
- Recommend targeted executive coaching for both the leader and team members to build those skills
- Focus on practical capability building tied directly to execution of strategy

General tone:
- Write like an experienced executive coach, not a management consultant
- Be specific, grounded, and practical
- Avoid generic or formulaic recommendations

---

INSTRUCTIONS BY CATEGORY:

HIGH PERFORMANCE:
- Emphasize that the team is highly effective
- Do NOT create artificial problems
- Do NOT treat scores of 4+ as deficiencies
- Minimize or omit development areas
- Limit recommendations to 2–3 total
- Focus on sustaining performance and avoiding unnecessary complexity

STRONG BUT NOT CONSISTENT:
- Describe the team as effective but not yet consistent
- Identify 1–2 areas where greater consistency would improve performance
- Keep recommendations focused and practical

MIXED EFFECTIVENESS:
- Describe the team as uneven with a clear constraint
- Identify the lowest dimension as a limiting factor
- Focus recommendations primarily on that constraint

LOW EFFECTIVENESS:
- Clearly identify development areas
- Provide specific, practical recommendations
- Focus on weakest dimensions

---

OUTPUT FORMAT (plain text only):

Scores by Dimension
Alignment: X.X
Organization: X.X
People: X.X

Overall Assessment
(3–4 sentences)

Key Strengths
- bullet points

Key Development Areas
- include ONLY if meaningful gaps exist

Targeted Recommendations
Alignment
- actions (only if needed)

Organization
- actions (only if needed)

People
- actions (only if needed)

Priority Focus
(1–2 highest leverage priorities OR sustaining focus if high-performing)

Final Note
If you would like to explore addressing these challenges or to talk more about team effectiveness, contact Chris at 415-250-1528 or chris@morganalexander.com

---

RULES:
- Do NOT reference question numbers
- Do NOT include scores in narrative commentary
- Scores of 4 represent effective performance
- Avoid generic consulting language
- Be concise and credible
- Recognize when less intervention is appropriate

---

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
