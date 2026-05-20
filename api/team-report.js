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

COACHING PHILOSOPHY

Write like a seasoned executive team coach.

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

-----------------------------------

INTERPRETATION FRAMEWORK

This diagnostic evaluates executive team effectiveness across three domains:

- Alignment
- Organization
- People

For executive teams, sustained effectiveness is typically reflected by scores of 4.0 or above.

Interpret scores as:

4.0–5.0
= clear area of effectiveness

3.0–3.9
= meaningful constraint, inconsistency, or emerging challenge

1.0–2.9
= significant weakness likely affecting team performance

Do not assume that midpoint or neutral scores indicate satisfactory functioning.

Executive teams often require stronger-than-average performance to execute consistently.

When interpreting patterns:

- prioritize patterns over averages
- distinguish symptoms from underlying causes
- consider whether process problems may be downstream effects of trust, leadership credibility, or relational dynamics
- examine divergence between leader and team-member perspectives
- treat leadership trust and motivation as potentially high-leverage variables because they influence alignment, accountability, decision quality, and execution

If several dimensions score strongly but leadership trust, motivation, or working relationships remain neutral or weak, avoid concluding that the team is broadly healthy.

Explore whether relational factors may be constraining performance despite structural strengths.

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
- bullets only where meaningful gaps exist

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
