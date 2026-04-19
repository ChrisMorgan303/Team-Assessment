export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { input } = req.body || {};

    if (!input) {
      return res.status(400).json({ error: "Missing input" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `Analyze this team situation and provide a concise assessment with key issues and suggested focus areas:\n\n${input}`
      })
    });

    const data = await response.json();

    // More robust parsing of OpenAI response
    const text =
      data.output_text ||
      (data.output && data.output[0]?.content?.[0]?.text) ||
      JSON.stringify(data);

    return res.status(200).json({ result: text });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
