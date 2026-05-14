import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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

    const {
      input,
      answers,
      teamCode,
      respondentType
    } = req.body;

    // ------------------------------------
// DETERMINISTIC SCORING
// ------------------------------------

const alignmentScores =
  answers
    .slice(0, 3)
    .map(a => Number(a));

const organizationScores =
  answers
    .slice(3, 6)
    .map(a => Number(a));

const peopleScores =
  answers
    .slice(6, 9)
    .map(a => Number(a));

    const avg = arr =>
      Number(
        (
          arr.reduce((a, b) => a + b, 0)
          / arr.length
        ).toFixed(1)
      );

    const alignment =
      avg(alignmentScores);

    const organization =
      avg(organizationScores);

    const people =
      avg(peopleScores);

    // ------------------------------------
    // CLASSIFICATION
    // ------------------------------------

    let classification =
      "MIXED EFFECTIVENESS";

    if (
      alignment >= 4.3 &&
      organization >= 4.3 &&
      people >= 4.3
    ) {

      classification =
        "HIGH PERFORMANCE";

    } else if (
      alignment >= 3.5 &&
      organization >= 3.5 &&
      people >= 3.5
    ) {

      classification =
        "STRONG BUT NOT CONSISTENT";

    } else if (
      alignment < 3.0 ||
      organization < 3.0 ||
      people < 3.0
    ) {

      classification =
        "LOW EFFECTIVENESS";
    }

    // ------------------------------------
    // LOWEST DIMENSION
    // ------------------------------------

    const dimensions = [

      {
        name: "Alignment",
        score: alignment
      },

      {
        name: "Organization",
        score: organization
      },

      {
        name: "People",
        score: people
      }

    ];

    const lowestDimension =
      [...dimensions]
        .sort((a, b) => a.score - b.score)[0]
        .name;

    // ------------------------------------
    // OPENAI CALL
    // ------------------------------------

    const response = await fetch(

      "https://api.openai.com/v1/responses",

      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          model: "gpt-4.1-mini",

          input: `

You are an experienced executive team coach.

You are analyzing a 9-question executive team diagnostic.

The arithmetic and classification have already been calculated.

Do NOT recalculate scores.

-----------------------------------

SCORES

Alignment: ${alignment}
Organization: ${organization}
People: ${people}

Overall Classification:
${classification}

Primary Constraint:
${lowestDimension}

-----------------------------------

COACHING PHILOSOPHY

Write like a seasoned executive team coach.

The audience is senior executives.

The tone should feel:
- grounded
- credible
- practical
- experienced
- commercially aware

Avoid:
- generic consulting language
- HR jargon
- exaggerated positivity
- therapy language
- corporate clichés

The writing should sound:
- concise
- thoughtful
- operationally intelligent
- strategically aware

Recommendations should:
- connect directly to execution
- reflect real leadership dynamics
- recognize organizational tradeoffs
- avoid over-intervening

-----------------------------------

OUTPUT FORMAT

Overall Assessment
(3–4 sentences)

Key Strengths
- bullets

Key Development Areas
- ONLY if meaningful gaps exist

Targeted Recommendations

Alignment
- bullets only if needed

Organization
- bullets only if needed

People
- bullets only if needed

Priority Focus
(1 concise paragraph)

Final Note
If you would like to explore addressing these challenges or to talk more about team effectiveness, contact Chris at 415-250-1528 or chris@morganalexander.com

-----------------------------------

RAW ASSESSMENT DATA

${input}

          `
        })
      }
    );

    const data =
      await response.json();

const text =
  response.output_text ||
  response.output?.[0]?.content?.[0]?.text ||
  "No report generated.";

    // ------------------------------------
    // SAVE TO SUPABASE
    // ------------------------------------

const { data: supabaseData, error: supabaseError } = await supabase
  .from("team_responses")
  .insert([{
    team_code: teamCode || null,
    respondent_type: respondentType || "unknown",
    answers,
    report: text
  }]);

console.log("SUPABASE RESULT:", supabaseData);
console.log("SUPABASE ERROR:", supabaseError);
if (error) {
  return res.status(500).json({
    supabase_error: error
  });
}    
    // ------------------------------------
    // RETURN
    // ------------------------------------

    res.status(200).json({

      result: text,

      scores: {
        alignment,
        organization,
        people
      },

      classification

    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
}
