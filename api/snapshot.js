module.exports = async (req, res) => {
  // ✅ CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ⛔ Only allow POST
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const { input } = req.body;

    const OpenAI = require("openai");
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Analyze this team situation:\n\n${input}`
        }
      ]
    });

    return res.status(200).json({
      result: completion.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message
    });
  }
};
