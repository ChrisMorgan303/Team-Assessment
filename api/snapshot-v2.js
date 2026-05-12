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
      answers
    } = req.body;

    // ------------------------------------
    // DETERMINISTIC SCORING
    // ------------------------------------

    const alignmentScores =
      answers
        .slice(0, 3)
        .map(a => Number(a.score));

    const organizationScores =
      answers
        .slice(3, 6)
        .map(a => Number(a.score));

    const peopleScores =
      answers
        .slice(6, 9)
        .map(a => Number(a.score));

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

Write like a seasoned executive coach.

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

ORGANIZATION PHILOSOPHY

Strong executive teams:
- regularly revisit priorities
- align around enterprise goals
- make timely decisions
- use meetings for alignment and execution
- avoid unnecessary process complexity

Do NOT recommend:
- agile ceremonies
- excessive structure
- heavy process systems

Prefer:
- decision-focused meetings
- clarity of ownership
- operating cadence
- prioritization discipline

-----------------------------------

PEOPLE PHILOSOPHY

Strong teams:
- have trust in leadership
- possess the skills required to execute strategy
- collaborate effectively across functions
- maintain accountability while supporting each other

When discussing capability:
- focus on strategic execution capability
- identify gaps tied to delivery
- emphasize targeted coaching and development
- avoid generic “team building”

-----------------------------------

HIGH PERFORMANCE GUIDANCE

If classified HIGH PERFORMANCE:
- emphasize effectiveness
- avoid inventing problems
- minimize development areas
- recommendations should focus on sustaining effectiveness
- keep recommendations minimal

-----------------------------------

STRONG BUT NOT CONSISTENT GUIDANCE

If classified STRONG BUT NOT CONSISTENT:
- describe the team as effective but uneven
- identify 1–2 areas where consistency would improve execution
- recommendations should be focused and restrained

-----------------------------------

MIXED EFFECTIVENESS GUIDANCE

If classified MIXED EFFECTIVENESS:
- clearly identify the limiting dimension
- explain how it constrains execution
- focus recommendations primarily there

-----------------------------------

LOW EFFECTIVENESS GUIDANCE

If classified LOW EFFECTIVENESS:
- clearly identify constraints
- provide grounded recommendations
- avoid overwhelming the reader
- focus on leverage points

-----------------------------------

OUTPUT RULES

VERY IMPORTANT:

- Do NOT repeat the scores section in narrative text
- Do NOT reference question numbers
- Do NOT say “according to the assessment”
- Do NOT over-explain
- Do NOT create too many bullets
- Use executive-level language
- Keep the report concise
- Recommendations should feel high-value and specific

Use:
- 3 bullet points maximum for strengths
- 3 bullet points maximum for development areas
- 2 bullet points maximum per recommendation section

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
      data.output?.[0]?.content?.[0]?.text
      || "No response generated";

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
