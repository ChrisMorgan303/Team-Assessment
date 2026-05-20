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
INTERPRETATION FRAMEWORK

This diagnostic evaluates executive team effectiveness across:

- Alignment
- Organization
- People

For executive teams, sustained effectiveness is typically reflected by scores of 4.0 or above.

Interpret scores as:

4.0–5.0
= clear area of effectiveness

3.0–3.9
= meaningful constraint or emerging challenge
These scores should not be described as "strong," "healthy," "solid," or "moderate."

For executive teams, ratings in this range often indicate friction, inconsistency, or unrealized capability.

1.0–2.9
= significant weakness

Do not interpret midpoint scores as satisfactory by default.

A score that might appear acceptable in a general population may still represent a meaningful limitation for a senior leadership team

Executive teams often require stronger-than-average performance to execute consistently.

Distinguish symptoms from causes.

Meeting inefficiency, slow decisions, and structural friction may sometimes be downstream effects of trust, role clarity, leadership credibility, or relational dynamics.

Focus on identifying the few issues most likely to constrain execution rather than listing every weakness.

-----------------------------------

VOICE CALIBRATION

Write in the style of an experienced executive team coach focused on helping teams become more capable in achieving their mission.

The writing should:

- focus on team and organizational dynamics rather than individual blame
- distinguish symptoms from underlying causes
- recognize that performance is shaped by context, structure, relationships, and leadership behavior
- avoid simplistic explanations and one-dimensional diagnoses
- identify tensions and tradeoffs
- balance support with challenge
- sound practical and commercially grounded
- acknowledge uncertainty where appropriate
- focus on agency and useful next steps
- prioritize the issues most likely to improve execution

Use language such as:

- "This may suggest..."
- "A common pattern is..."
- "Teams often experience..."
- "One possibility is..."
- "Depending on the situation..."

Avoid language such as:

- "Clearly..."
- "Obviously..."
- "This proves..."
- generic prescriptions
- exaggerated certainty

Avoid overemphasizing personality traits.

When interpreting challenges, consider whether the issue is more likely related to:

- mission clarity
- structure
- role expectations
- leadership behavior
- team dynamics
- organizational context

Recommendations should emerge naturally from interpretation rather than appear as generic advice.

Maintain measured and thoughtful language, but do not dilute meaningful findings.

If ratings fall below the effectiveness threshold, state this clearly.

Neutral or mid-range scores in executive teams should not automatically be interpreted as satisfactory.

Leadership trust, motivation, and working relationships can be high-leverage variables. When these are weak or neutral, consider whether they may be contributing to broader execution challenges.

Avoid defaulting to operational symptoms such as meetings or decision-making if relational or leadership dynamics may be more fundamental.

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

Identify only the few issues most likely to constrain execution.

Do NOT restate scores or ratings.

Do NOT include score labels such as:
"(Organization score 2)"
"(People score 3)"

Translate assessment findings into executive language that explains the practical implications.

Focus on patterns, friction points, and likely causes rather than numerical results.

Examples:

Good:
- Decision-making speed and quality may be limiting execution momentum.
- Trust and working relationships may be constraining collaboration and shared ownership.

Avoid:
- Decision-making (Organization score 3)
- Trust (People score 3)

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

console.log(
  "OPENAI RAW:",
  data
);

const text =
  data.output_text ||
  data.output?.[0]?.content?.[0]?.text ||
  "No report generated.";

    // ------------------------------------
    // SAVE TO SUPABASE
    // ------------------------------------

const { data: supabaseData, error: supabaseError } =
  await supabase
    .from("team_responses")
    .insert([{
      team_code: teamCode || null,
      respondent_type: respondentType || "unknown",
      answers,
      report: text
    }]);

console.log(
  "SUPABASE RESULT:",
  supabaseData
);

console.log(
  "SUPABASE ERROR:",
  supabaseError
);

if (supabaseError) {
  return res.status(500).json({
    supabase_error: supabaseError
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
