export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const { input, answers } = req.body;

    // -----------------------------------
    // SCORES
    // -----------------------------------

    const scores =
      answers.map(a => Number(a.score));

    const alignmentAvg = (
      (scores[0] + scores[1] + scores[2]) / 3
    ).toFixed(1);

    const organizationAvg = (
      (scores[3] + scores[4] + scores[5]) / 3
    ).toFixed(1);

    const peopleAvg = (
      (scores[6] + scores[7] + scores[8]) / 3
    ).toFixed(1);

    // -----------------------------------
    // CLASSIFICATION
    // -----------------------------------

    let classification = "";

    if (
      alignmentAvg >= 4.3 &&
      organizationAvg >= 4.3 &&
      peopleAvg >= 4.3
    ) {

      classification =
        "HIGH PERFORMANCE";

    } else if (

      alignmentAvg >= 3.5 &&
      organizationAvg >= 3.5 &&
      peopleAvg >= 3.5

    ) {

      classification =
        "STRONG BUT NOT CONSISTENT";

    } else if (

      alignmentAvg < 3.0 ||
      organizationAvg < 3.0 ||
      peopleAvg < 3.0

    ) {

      classification =
        "LOW EFFECTIVENESS";

    } else {

      classification =
        "MIXED EFFECTIVENESS";
    }

    // -----------------------------------
    // OPENAI
    // -----------------------------------

    const response = await fetch(

      "https://api.openai.com/v1/responses",

      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${process.env.OPENAI_API_KEY}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          model: "gpt-4.1-mini",

          input: `

You are an experienced executive team coach.

You are analyzing a 9-question executive team diagnostic.

-----------------------------------
DETERMINISTIC SCORES
-----------------------------------

Alignment Score: ${alignmentAvg}

Organization Score: ${organizationAvg}

People Score: ${peopleAvg}

Overall Classification:
${classification}

-----------------------------------
ASSESSMENT DATA
-----------------------------------

${input}

-----------------------------------
COACHING PHILOSOPHY
-----------------------------------

Organization:
- Emphasize regular review and reprioritization of priorities
- Focus meetings on aligning around priorities, making decisions, and clear tasking
- Avoid over-structuring meetings

People:
- Emphasize identifying the specific skills required to deliver the strategy
- Recommend targeted executive coaching
- Focus on practical capability building

General tone:
- Write like an experienced executive coach
- Be practical and credible
- Avoid generic consulting language

-----------------------------------
OUTPUT FORMAT
-----------------------------------

Return ONLY the following sections.

Do NOT repeat numeric scores.

Do NOT repeat classifications.

Do NOT create extra headings.

Use concise paragraphs and bullet points.

Overall Assessment
(3–4 sentences)

Key Strengths
- bullets

Key Development Areas
- bullets only if meaningful gaps exist

Targeted Recommendations

Alignment
- actions only if needed

Organization
- actions only if needed

People
- actions only if needed

Priority Focus
(1–2 highest leverage priorities)

Final Note
If you would like to explore addressing these challenges or to talk more about team effectiveness, contact Chris at 415-250-1528 or chris@morganalexander.com

-----------------------------------
RULES
-----------------------------------

- Use the provided scores and classification exactly as given
- Do NOT recalculate scores
- Do NOT reference question numbers
- Scores of 4 represent effective performance
- Avoid generic consulting language
- Be concise and practical
- Recognize when less intervention is appropriate

          `
        })
      }
    );

    const data = await response.json();

    const text =
      data.output?.[0]?.content?.[0]?.text ||
      "No response generated";

    res.status(200).json({

      result: text,

      scores: {
        alignment: alignmentAvg,
        organization: organizationAvg,
        people: peopleAvg,
        classification
      }

    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
}
