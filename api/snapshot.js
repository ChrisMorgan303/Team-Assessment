const OpenAI = require("openai");

module.exports = async (req, res) => {
  try {
    // sanity checks
    if (req.method !== "POST") {
      return res.status(405).send("Method not allowed");
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const { input } = req.body || {};

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // simplest possible call
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: `Test: ${input}` }
      ],
    });

    return res.status(200).json({
      result: completion.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({
      error: err.message
    });
  }
};
