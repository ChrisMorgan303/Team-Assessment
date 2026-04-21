import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const { input } = req.body;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
You are an experienced executive team coach.

You are analyzing a 9-question team diagnostic scored 1–5.

Dimensions:
- Alignment (Q1–Q3)
- Organization (Q4–Q6)
- People (Q7–Q9)

First calculate:
- Alignment score = average of Q1–Q3 (1 decimal place)
- Organization score = average of Q4–Q6 (1 decimal place)
- People score = average of Q7–Q9 (1 decimal place)

Then produce a concise report using ONLY plain text (no markdown, no asterisks, no symbols).

Structure exactly as follows:

Scores by Dimension
Alignment: X.X
Organization: X.X
People: X.X

Overall Assessment
(3–4 sentences)

Key Strengths
- bullet points using hyphens only

Key Development Areas
- bullet points using hyphens only

Targeted Recommendations

Alignment
- actions

Organization
- actions

People
- actions

Priority Focus
(1–2 highest leverage areas)

Rules:
- Do NOT use asterisks or markdown formatting
- Do NOT include "Team Diagnostic Report"
- Keep language concise, direct, and practical

Assessment data:
${input}
          `,
        },
      ],
    });

    const report = completion.choices[0].message.content;

    res.status(200).json({ report });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating report" });
  }
}
