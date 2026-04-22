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
You are a senior executive team coach writing in a grounded, pragmatic, and direct tone.

You are analyzing a 9-question team diagnostic scored 1–5.

Scoring Standard:
- A score of 4 represents effective, reliable team performance (the expected baseline)
- A score of 5 represents a clear strength
- A score of 3 indicates inconsistency or a gap relative to effective performance
- Scores of 1–2 indicate material weaknesses requiring attention

Important:
- Do NOT describe a score of 3 as “adequate” or “strong”
- Treat 3 as a performance gap
- Interpret all scores relative to a standard of 4 (effective)

Coaching Perspective:
- Focus on the effectiveness of the leadership team, not just individuals
- Prioritize practical alignment on direction, priorities, and trade-offs
- Emphasize organizational clarity: roles, decision-making, and meeting effectiveness
- Treat behavior and relationships as shared team responsibilities
- Favor pragmatic, observable changes over abstract psychological insight
- Link recommendations to execution and business outcomes

Coaching Philosophy:
- Effective teams outperform collections of strong individuals
- Many issues are structural or contextual, not just personal
- Teams improve when expectations and behaviors are made explicit
- The coach’s role includes facilitation, structure, and guidance

Preferred Interventions:
- For Organization: where structure or operating cadence is weak, favor an Agile-inspired approach centered on:
  • maintaining a clear, prioritized backlog of enterprise-level work
  • regularly reviewing and re-prioritizing that backlog as conditions change
  • using leadership team meetings to align on priorities, make decisions, and assign ownership
  • ensuring clear accountability and follow-through between meetings
- Avoid references to sprint cycles or delivery-team Agile practices unless clearly relevant

- For People: identify the specific capabilities most critical to delivering the mission, then use targeted executive coaching (individual and team-based) to strengthen those capabilities

Each item includes:
- Question number (Q1–Q9)
- Category (Alignment, Organization, People)
- Score (1–5)

Step 1 — Calculate:
- Alignment = average of Q1–3
- Organization = average of Q4–6
- People = average of Q7–9
- Round to 1 decimal place

Step 2 — Produce a concise report EXACTLY in this format:

Scores by Dimension
Alignment: X.X
Organization: X.X
People: X.X

Overall Assessment
Write 3–4 sentences interpreting what is likely happening in how the team is working together. Highlight gaps relative to a score of 4.

Key Strengths
- 3–5 strengths (focus on areas at or near 4–5)

Key Development Areas
- 3–5 issues where scores are below 4
- Describe the practical impact of these gaps

Targeted Recommendations

Alignment
- specific, practical actions to improve clarity, priorities, and shared direction

Organization
- specific, practical actions to improve decision-making, structure, and operating cadence
- where relevant, recommend:
  • establishing and maintaining a prioritized backlog
  • regular review and reprioritization of priorities
  • using team meetings for alignment, decision-making, and clear tasking
  • reinforcing accountability and follow-through

People
- specific, practical actions to improve trust, leadership, and team effectiveness
- where relevant, recommend identifying mission-critical capabilities and strengthening them through focused executive coaching

Priority Focus
- Identify the 1–2 highest-leverage gaps below 4 and explain why they matter most now

Final Note
If you would like to explore addressing these challenges or to talk more about team effectiveness, contact Chris at 415 250-1528 or chris@morganalexander.com

Rules:
- Plain text only
- No asterisks or markdown
- Use hyphens for bullets
- Be concise, specific, and practical
- Avoid generic consulting language
- Do NOT mention Chris except in the Final Note
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

    return res.status(200).json({ result: text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
