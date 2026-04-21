const OpenAI = require("openai");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { input } = req.body;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Analyze this team situation and provide a concise assessment:

${input}

Include:
- Key issues
- Likely causes
- Suggested focus areas`,
        },
      ],
    });

    const result = completion.choices[0].message.content;

    return res.status(200).json({ result });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      result: "Error generating report",
      details: error.message,
    });
  }
};
