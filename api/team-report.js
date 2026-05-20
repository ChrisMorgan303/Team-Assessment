import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

  // CORS

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if(req.method==="OPTIONS"){
    return res.status(200).end();
  }

  if(req.method!=="POST"){
    return res.status(405).json({
      error:"Method not allowed"
    });
  }

  try{

    const {teamCode}=req.body;

    // ------------------------------------
    // LOAD TEAM RESPONSES
    // ------------------------------------

    const {data,error}=
      await supabase
        .from("team_responses")
        .select("*")
        .eq("team_code",teamCode);
// ------------------------------------
// QUESTION ANALYTICS
// ------------------------------------

const questionLabels = [

"Strategy clarity",
"Priority clarity",
"Shared responsibility",

"Structure",
"Decision-making",
"Meeting productivity",

"Trust in leader",
"Team capability",
"Working relationships"

];

const questionStats =
questionLabels.map((label,index)=>{

const scores =
data
.map(r=>r.answers?.[index])
.filter(v=>v);

const average =
scores.length
? scores.reduce((a,b)=>a+b,0)/scores.length
:0;

const distribution=[1,2,3,4,5]
.map(score=>
scores.filter(s=>s===score).length
);

return{

label,

average:
Number(
average.toFixed(1)
),

distribution

};

})

.sort(
(a,b)=>
b.average-a.average
);
    
    if(error){

      return res.status(500).json({
        error:error.message
      });
    }

    // ------------------------------------
    // RESPONSE COUNT
    // ------------------------------------

    const totalResponses =
      data.length;

    // ------------------------------------
    // OPENAI
    // ------------------------------------

const prompt=`

You are an experienced executive team coach.

You are analyzing a multi-rater executive team diagnostic.

The audience is senior executives.

You are interpreting patterns across multiple perspectives.

-----------------------------------

TEAM SIZE

${totalResponses} responses

-----------------------------------

-----------------------------------

COACHING PHILOSOPHY

Write like an experienced executive team coach.

The audience is senior executives.

TEAM STRUCTURE

This assessment contains:

- one team leader (Host)
- multiple team members

The leader completes one perspective.

Team members provide additional perspectives.

Use singular language when referring to the leader:

- "the leader"
- "the host"
- "the team leader"

Use plural language only for team members:

- "team members"
- "participants"
- "respondents"

Do not refer to "leaders" unless multiple leaders actually exist.

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

Capabilities such as trust-building, collaboration, communication, ownership, adaptability, and leadership effectiveness can be developed.

Coaching and feedback are practical mechanisms for helping leaders and teams strengthen these capabilities.

When trust in leadership, motivation, or working relationships are weak, consider whether leadership behavior or developmental coaching may represent important leverage points.

Interpret ratings as signals of where the team may benefit from increased attention and development.

The goal is not merely stronger relationships but greater capability in delivering the mission.

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
= meaningful constraint, inconsistency, or emerging challenge

These scores should not be described as:

- strong
- healthy
- solid
- moderate

For executive teams, ratings in this range often indicate friction, inconsistency, or unrealized capability.

1.0–2.9
= significant weakness likely affecting performance

Do not assume midpoint or neutral scores indicate satisfactory functioning.

A score that might appear acceptable in a general population may still represent a meaningful limitation for a senior leadership team.

Executive teams often require stronger-than-average performance to execute consistently.

When interpreting patterns:

- prioritize patterns over averages
- distinguish symptoms from underlying causes
- examine divergence between leader and team-member perspectives
- consider whether process problems may be downstream effects of trust, leadership credibility, role clarity, or relational dynamics
- treat leadership trust and motivation as high-leverage variables because they influence accountability, decision quality, alignment, and execution

Do not automatically assume the lowest-rated area is the root cause.

Treat lower scores as important indicators rather than conclusions.

Consider whether structural symptoms may reflect relational dynamics or leadership challenges, and whether people-related challenges may be amplified by organizational design.

If several dimensions score strongly but leadership trust, motivation, or working relationships remain neutral or weak, avoid concluding that the team is broadly healthy.

Explore whether relational factors may be constraining performance despite structural strengths.

Development recommendations, coaching, facilitated discussion, and feedback processes are valid interventions where capabilities or leadership behaviors appear to constrain team effectiveness.

-----------------------------------

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

Alignment and Divergence of Ratings
- bullets

Key Strengths
- bullets

Key Development Areas

Identify only the few issues most likely to constrain execution.

Do not restate scores or ratings.

Translate findings into executive language that explains practical implications.

Focus on patterns, friction points, and likely causes rather than numerical results.
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

RULES

Do not say:

"Certainly"
"Here is an analysis"
"Executive Summary"
"Your next steps"

Do not number sections

Do not use:

##
**
---

In Alignment and Divergence:

identify:

- areas with strong agreement
- areas where ratings vary substantially
- likely implications of differing perceptions

RAW TEAM DATA:

${JSON.stringify(data,null,2)}

`;

const completion =
await openai.chat.completions.create({

model:"gpt-4.1",

messages:[

{
role:"system",
content:
"You are a highly skilled executive team coach."
},

{
role:"user",
content:prompt
}

],

temperature:0.7

});

const report=
completion.choices[0]
.message.content;

return res.status(200).json({
success:true,
report,
totalResponses:data.length,
questionStats
});

}catch(error){

return res.status(500).json({
error:error.message
});

}

}
