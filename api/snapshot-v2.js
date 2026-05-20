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

Initial Signal:
${lowestDimension}

Treat this as an important indicator rather than a conclusion.

Consider whether lower scores in other dimensions or relational dynamics suggest a more fundamental constraint.

Distinguish symptoms from underlying causes.

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

COACHING PHILOSOPHY

Write like an experienced executive team coach.

The audience is senior executives.

This assessment is grounded in a practical view of executive team effectiveness.

Teams become more effective by improving three integrated dimensions:

1. Alignment

High-performing teams share a clear understanding of mission, strategy, priorities, and collective goals.

Teams often struggle when functional identities become stronger than commitment to shared enterprise outcomes.

2. Organization

Effective teams require structures and operating mechanisms that support execution.

This often includes:

- role expectations that match the functional needs of the organization
- effective decision-making
- productive meetings, often informed by Agile practices
- operating rhythms that include strategic reflection and review
- processes that create space for diverse viewpoints and healthy challenge

Execution problems frequently arise from organizational design issues rather than effort or intent.

3. People

Teams succeed when members demonstrate the competencies and leadership behaviors required to achieve the mission.

The team leader's behavior is the most powerful level. They are responsible for setting clear direction and roles and for optizing the team's intelligence by creating a safe environment for contructive ideas.  

Capabilities such as trust-building, collaboration, communication, ownership, adaptability, and leadership effectiveness can be developed.

Coaching and feedback are practical mechanisms for helping leaders and teams strengthen these capabilities.

When trust in leadership, motivation, or working relationships are weak, consider whether leadership behavior or developmental coaching may represent important leverage points.

Interpret ratings as signals of where the team may benefit from increased attention and development.

The goal is not merely stronger relationships but greater capability in delivering the mission.

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
